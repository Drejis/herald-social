import { useState, useEffect } from 'react';
import { BarChart2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PollData {
  id: string;
  question: string;
  options: string[];
}

interface PollBoxProps {
  postId: string;
}

export function PollBox({ postId }: PollBoxProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [poll, setPoll] = useState<PollData | null>(null);
  const [votes, setVotes] = useState<{ option_index: number; user_id: string }[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    // Skip dummy posts
    if (postId.startsWith('d')) return;
    fetchPoll();
  }, [postId]);

  const fetchPoll = async () => {
    const { data: pollData } = await supabase
      .from('polls')
      .select('*')
      .eq('post_id', postId)
      .maybeSingle();

    if (!pollData) return;
    setPoll({ id: pollData.id, question: pollData.question, options: (pollData.options as string[]) || [] });

    const { data: voteData } = await supabase
      .from('poll_votes')
      .select('option_index, user_id');
    const filtered = (voteData || []).filter(v => v.option_index !== null);
    setVotes(filtered);
    if (user) {
      const mine = filtered.find(v => v.user_id === user.id);
      if (mine) setMyVote(mine.option_index);
    }
  };

  const handleVote = async (index: number) => {
    if (!user || !poll || voting) return;
    if (myVote !== null) return;
    setVoting(true);
    try {
      const { error } = await supabase.from('poll_votes').insert({
        poll_id: poll.id,
        user_id: user.id,
        option_index: index,
      });
      if (error) throw error;
      setMyVote(index);
      setVotes(prev => [...prev, { option_index: index, user_id: user.id }]);
      toast({ title: 'Vote counted!', description: 'Thanks for participating' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not vote', variant: 'destructive' });
    } finally {
      setVoting(false);
    }
  };

  if (!poll) return null;

  const totalVotes = votes.length;

  return (
    <div className="mt-3 p-4 rounded-2xl border border-border bg-secondary/30 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <BarChart2 className="w-4 h-4 text-primary" />
        {poll.question}
      </div>
      <div className="space-y-2">
        {poll.options.map((option, i) => {
          const count = votes.filter(v => v.option_index === i).length;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const voted = myVote !== null;
          return (
            <button
              key={i}
              onClick={() => handleVote(i)}
              disabled={voting || voted}
              className={`relative w-full text-left px-3 py-2 rounded-xl border transition-colors overflow-hidden ${
                voted ? 'border-border' : 'border-border hover:border-primary/50 hover:bg-secondary'
              }`}
            >
              {voted && (
                <div
                  className="absolute inset-y-0 left-0 bg-primary/20 transition-all"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className={`text-sm ${myVote === i ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {option}
                  {myVote === i && ' \u2713'}
                </span>
                {voted && <span className="text-sm text-muted-foreground">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {totalVotes} vote{totalVotes === 1 ? '' : 's'}
        {voting && <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />}
      </p>
    </div>
  );
}
