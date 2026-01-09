import { useState } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { PostCard } from '@/components/herald/PostCard';
import { WalletPreview } from '@/components/herald/WalletPreview';
import { TasksPanel } from '@/components/herald/TasksPanel';
import { mockPosts, mockTasks, walletBalance, currentUser, mockUsers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Sparkles, PenSquare, TrendingUp, ArrowUpRight } from 'lucide-react';
import heroBg from '@/assets/herald-hero-bg.jpg';

const Index = () => {
  const [posts, setPosts] = useState(mockPosts);
  const [tasks, setTasks] = useState(mockTasks);

  const handleLike = (postId: string) => {
    console.log('Liked post:', postId);
  };

  const handleShare = (postId: string) => {
    console.log('Shared post:', postId);
  };

  const handleTip = (postId: string) => {
    console.log('Tipped post:', postId);
  };

  const handleClaimTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
  };

  const rightSidebar = (
    <>
      <WalletPreview balance={walletBalance} />
      <TasksPanel tasks={tasks} onClaim={handleClaimTask} />
      
      {/* Top Creators */}
      <div className="herald-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top Creators
          </h3>
        </div>
        <div className="space-y-3">
          {mockUsers.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-display font-bold text-foreground">
                  {user.displayName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.httnTokens.toFixed(0)} HTTN
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
          <Button variant="gold" size="sm" className="gap-2">
            <PenSquare className="w-4 h-4" />
            Create
          </Button>
        </div>
      </header>

      {/* User welcome card */}
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
                {currentUser.displayName}
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
                {currentUser.httnTokens.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Tokens</p>
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-lg gold-text">
                {currentUser.reputation}
              </p>
              <p className="text-xs text-muted-foreground">Reputation</p>
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-lg text-foreground">
                {tasks.filter((t) => !t.completed).length}
              </p>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="divide-y divide-border">
        {posts.map((post) => (
          <div key={post.id} className="p-4">
            <PostCard
              post={post}
              onLike={handleLike}
              onShare={handleShare}
              onTip={handleTip}
            />
          </div>
        ))}
      </div>

      {/* Load more */}
      <div className="p-8 text-center">
        <Button variant="outline" className="gap-2">
          Load more posts
        </Button>
      </div>
    </MainLayout>
  );
};

export default Index;
