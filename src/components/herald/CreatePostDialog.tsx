import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Image, Video, Film, Send, Sparkles, BarChart2, X, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MediaUpload } from './MediaUpload';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export function CreatePostDialog({ open, onOpenChange, onPostCreated }: CreatePostDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      const { data: postData, error } = await supabase.from('posts').insert({
        author_id: user.id,
        content: content.trim(),
        media_type: mediaType,
        media_url: mediaUrl,
      }).select('id').single();

      if (error) throw error;

      // Create attached poll
      const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
      if (showPoll && pollQuestion.trim() && validOptions.length >= 2 && postData) {
        const { error: pollError } = await supabase.from('polls').insert({
          post_id: postData.id,
          user_id: user.id,
          question: pollQuestion.trim(),
          options: validOptions,
        });
        if (pollError) throw pollError;
      }

      toast({
        title: 'Post created!',
        description: 'Your content is now live. +5 HTTN Points earned!',
      });

      // Award points for posting
      const { data: wallet } = await supabase
        .from('wallets')
        .select('httn_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wallet) {
        await supabase.from('wallets').update({
          httn_points: wallet.httn_points + 5,
        }).eq('user_id', user.id);
      }

      setContent('');
      setMediaType(null);
      setShowPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setMediaUrl(null);
      onOpenChange(false);
      onPostCreated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUploaded = (url: string, type: string) => {
    setMediaUrl(url);
  };

  const handleMediaRemoved = () => {
    setMediaUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-input border-border resize-none"
          />

          <Tabs value={mediaType || 'none'} onValueChange={(v) => {
            setMediaType(v === 'none' ? null : v);
            if (v === 'none') setMediaUrl(null);
          }}>
            <TabsList className="w-full">
              <TabsTrigger value="none" className="flex-1">Text Only</TabsTrigger>
              <TabsTrigger value="image" className="flex-1 gap-1">
                <Image className="w-4 h-4" /> Image
              </TabsTrigger>
              <TabsTrigger value="video" className="flex-1 gap-1">
                <Video className="w-4 h-4" /> Video
              </TabsTrigger>
              <TabsTrigger value="reel" className="flex-1 gap-1">
                <Film className="w-4 h-4" /> Reel
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {user && mediaType && (
            <MediaUpload
              userId={user.id}
              mediaType={mediaType}
              onMediaUploaded={handleMediaUploaded}
              onMediaRemoved={handleMediaRemoved}
              currentMediaUrl={mediaUrl || undefined}
            />
          )}

          {/* Poll creator */}
          <button
            type="button"
            onClick={() => setShowPoll(!showPoll)}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-full border transition-colors ${
              showPoll
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            {showPoll ? 'Remove poll' : 'Add poll'}
          </button>

          {showPoll && (
            <div className="space-y-2 p-3 rounded-lg border border-border">
              <Input
                placeholder="Poll question"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="bg-input border-border"
              />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => setPollOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                    className="bg-input border-border"
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <Button variant="outline" size="sm" onClick={() => setPollOptions(prev => [...prev, ''])}>
                  <Plus className="w-4 h-4 mr-1" /> Add option
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <span className="text-sm text-muted-foreground">Posting rewards you</span>
            <span className="text-sm gold-text font-semibold flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> +5 HTTN Points
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              className="flex-1 gap-2"
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
            >
              {loading ? 'Posting...' : 'Post'}
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
