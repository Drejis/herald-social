import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { PostCard } from '@/components/herald/PostCard';
import { WalletPreview } from '@/components/herald/WalletPreview';
import { TasksPanel } from '@/components/herald/TasksPanel';
import { CreatePostDialog } from '@/components/herald/CreatePostDialog';
import { SchedulePostDialog } from '@/components/herald/SchedulePostDialog';
import { FloatingMessageButton } from '@/components/herald/FloatingMessageButton';
import { Button } from '@/components/ui/button';
import { Sparkles, PenSquare, TrendingUp, ArrowUpRight, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import heroBg from '@/assets/herald-hero-bg.jpg';

interface WalletBalance {
  httn_points: number;
  httn_tokens: number;
  espees: number;
  pending_rewards: number;
}

interface Profile {
  display_name: string;
  username: string;
  tier: string;
  reputation: number;
  avatar_url: string | null;
}

interface UserTask {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  task_type: string;
  progress: number;
  target: number;
  completed: boolean;
}

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  httn_earned: number;
  created_at: string;
  author: Profile;
  author_id: string;
  isLiked?: boolean;
  isShared?: boolean;
}

export default function Feed() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [topCreators, setTopCreators] = useState<Profile[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchPosts();
      fetchTopCreators();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    const [walletRes, profileRes, tasksRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_tasks').select('*').eq('user_id', user.id).eq('completed', false),
    ]);

    if (walletRes.data) setWallet(walletRes.data);
    if (profileRes.data) setProfile(profileRes.data);
    if (tasksRes.data) setTasks(tasksRes.data);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(display_name, username, tier, reputation, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setPosts(data.map(p => ({ ...p, author: p.author as unknown as Profile })));
    }
  };

  const fetchTopCreators = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('reputation', { ascending: false })
      .limit(5);

    if (data) setTopCreators(data);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    await supabase.from('post_interactions').insert({
      post_id: postId,
      user_id: user.id,
      interaction_type: 'like',
    });

    await supabase.from('posts').update({ 
      likes_count: posts.find(p => p.id === postId)!.likes_count + 1 
    }).eq('id', postId);

    fetchPosts();
  };

  const handleShare = async (postId: string) => {
    if (!user) return;

    await supabase.from('post_interactions').insert({
      post_id: postId,
      user_id: user.id,
      interaction_type: 'share',
    });

    await supabase.from('posts').update({ 
      shares_count: posts.find(p => p.id === postId)!.shares_count + 1 
    }).eq('id', postId);

    fetchPosts();
  };

  const handleTip = (postId: string) => {
    console.log('Tipping post:', postId);
  };

  const handleClaimTask = async (taskId: string) => {
    if (!user) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await supabase.from('user_tasks').update({ completed: true }).eq('id', taskId);
    
    if (wallet) {
      await supabase.from('wallets').update({ 
        httn_points: wallet.httn_points + task.reward 
      }).eq('user_id', user.id);
    }

    fetchUserData();
  };

  const walletBalance = wallet ? {
    httnPoints: wallet.httn_points,
    httnTokens: Number(wallet.httn_tokens),
    espees: Number(wallet.espees),
    pendingRewards: wallet.pending_rewards,
  } : { httnPoints: 0, httnTokens: 0, espees: 0, pendingRewards: 0 };

  const formattedTasks = tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    reward: t.reward,
    type: t.task_type as 'daily' | 'weekly' | 'campaign',
    progress: t.progress,
    target: t.target,
    completed: t.completed,
  }));

  const rightSidebar = (
    <>
      <WalletPreview balance={walletBalance} />
      <TasksPanel tasks={formattedTasks} onClaim={handleClaimTask} />
      
      {/* Top Creators */}
      <div className="herald-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top Creators
          </h3>
        </div>
        <div className="space-y-3">
          {topCreators.map((creator) => (
            <div
              key={creator.username}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-display font-bold text-foreground">
                  {creator.display_name?.[0] || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {creator.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {creator.reputation} Rep
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">
                Follow
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Value Flow Info */}
      <div className="herald-card p-4 space-y-3 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10">
          <h3 className="font-display font-semibold text-foreground">How Value Flows</h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">1</span>
              <span className="text-muted-foreground">Create & Engage</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">2</span>
              <span className="text-muted-foreground">Earn HTTN Points</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">3</span>
              <span className="text-muted-foreground">Convert to Tokens</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">4</span>
              <span className="text-foreground font-medium">Redeem as Espees</span>
            </div>
          </div>
          <Button variant="gold-outline" size="sm" className="w-full mt-4 gap-1">
            Learn More <ArrowUpRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <MainLayout rightSidebar={rightSidebar}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <h1 className="font-display font-bold text-xl text-foreground">Feed</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setScheduleDialogOpen(true)}>
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
            <Button variant="gold" size="sm" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
              <PenSquare className="w-4 h-4" />
              Create
            </Button>
          </div>
        </div>
      </header>

      {/* User welcome card */}
      {profile && (
        <div className="p-4 border-b border-border">
          <div className="herald-card-elevated p-5 relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url(${heroBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Welcome back,</p>
                <h2 className="font-display font-bold text-2xl text-foreground">
                  {profile.display_name}
                </h2>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <Sparkles className="w-4 h-4 text-primary glow-gold-sm" />
                  <span className="font-display font-bold text-xl gold-text">
                    {walletBalance.httnPoints.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">HTTN Points</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="relative z-10 grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="font-display font-semibold text-lg text-foreground">
                  {walletBalance.httnTokens.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Tokens</p>
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-lg gold-text">
                  {profile.reputation}
                </p>
                <p className="text-xs text-muted-foreground">Reputation</p>
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-lg text-foreground">
                  {tasks.length}
                </p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="divide-y divide-border">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No posts yet. Be the first to create content!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-4">
              <PostCard
                post={{
                  id: post.id,
                  content: post.content,
                  mediaUrl: post.media_url || undefined,
                  mediaType: post.media_type as 'image' | 'video' | 'audio' | undefined,
                  likes: post.likes_count,
                  comments: post.comments_count,
                  shares: post.shares_count,
                  httnEarned: post.httn_earned,
                  createdAt: new Date(post.created_at),
                  isLiked: post.isLiked || false,
                  isShared: post.isShared || false,
                  author: {
                    id: post.author_id,
                    username: post.author?.username || 'unknown',
                    displayName: post.author?.display_name || 'Unknown User',
                    avatar: post.author?.avatar_url || '',
                    tier: (post.author?.tier || 'participant') as 'herald' | 'creator' | 'participant' | 'partner',
                    httnPoints: 0,
                    httnTokens: 0,
                    espees: 0,
                    reputation: post.author?.reputation || 0,
                    badges: [],
                    joinedAt: new Date(),
                  },
                }}
                onLike={handleLike}
                onShare={handleShare}
                onTip={handleTip}
              />
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      <div className="p-8 text-center">
        <Button variant="outline" className="gap-2">
          Load more posts
        </Button>
      </div>

      <CreatePostDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onPostCreated={fetchPosts}
      />

      <SchedulePostDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onPostScheduled={fetchPosts}
      />

      <FloatingMessageButton />
    </MainLayout>
  );
}
