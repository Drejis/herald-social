import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  TrendingUp, 
  Users, 
  Flame, 
  Sparkles,
  Play,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Creator {
  display_name: string;
  username: string;
  avatar_url: string | null;
  tier: string;
  reputation: number;
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
  author: Creator;
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [reels, setReels] = useState<Post[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [postsRes, creatorsRes, reelsRes] = await Promise.all([
      supabase
        .from('posts')
        .select(`*, author:profiles!posts_author_id_fkey(display_name, username, avatar_url, tier, reputation)`)
        .order('likes_count', { ascending: false })
        .limit(10),
      supabase
        .from('profiles')
        .select('*')
        .order('reputation', { ascending: false })
        .limit(10),
      supabase
        .from('posts')
        .select(`*, author:profiles!posts_author_id_fkey(display_name, username, avatar_url, tier, reputation)`)
        .eq('media_type', 'reel')
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

    if (postsRes.data) setTrendingPosts(postsRes.data.map(p => ({ ...p, author: p.author as unknown as Creator })));
    if (creatorsRes.data) setTopCreators(creatorsRes.data);
    if (reelsRes.data) setReels(reelsRes.data.map(p => ({ ...p, author: p.author as unknown as Creator })));
  };

  const trendingTopics = [
    { name: '#HeraldLaunch', posts: 1234 },
    { name: '#Web3Creators', posts: 856 },
    { name: '#HTTNRewards', posts: 642 },
    { name: '#CreatorEconomy', posts: 521 },
    { name: '#EarnWithHerald', posts: 398 },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Search Header */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search creators, posts, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </div>

        <Tabs defaultValue="trending" className="w-full">
          <TabsList>
            <TabsTrigger value="trending" className="gap-2">
              <Flame className="w-4 h-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="creators" className="gap-2">
              <Users className="w-4 h-4" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="reels" className="gap-2">
              <Play className="w-4 h-4" />
              Reels
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <Users className="w-4 h-4" />
              Community
            </TabsTrigger>
          </TabsList>

          {/* Trending Tab */}
          <TabsContent value="trending" className="mt-6 space-y-6">
            {/* Trending Topics */}
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Trending Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.map((topic, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {topic.name}
                    <Badge variant="secondary" className="text-xs">
                      {topic.posts}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Trending Posts */}
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                Hot Posts
              </h3>
              <div className="grid gap-4">
                {trendingPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No trending posts yet.</p>
                ) : (
                  trendingPosts.map((post) => (
                    <Card key={post.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold">
                            {post.author?.display_name?.[0] || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {post.author?.display_name || 'Unknown'}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                @{post.author?.username || 'unknown'}
                              </span>
                            </div>
                            <p className="text-foreground mt-1">{post.content}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Heart className="w-4 h-4" /> {post.likes_count}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MessageCircle className="w-4 h-4" /> {post.comments_count}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Share2 className="w-4 h-4" /> {post.shares_count}
                              </span>
                              <span className="flex items-center gap-1 text-sm gold-text ml-auto">
                                <Sparkles className="w-4 h-4" /> {post.httn_earned} HTTN
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Creators Tab */}
          <TabsContent value="creators" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {topCreators.map((creator, index) => (
                <Card key={creator.username} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center font-display text-xl font-bold">
                          {creator.display_name?.[0] || '?'}
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-semibold text-foreground">
                          {creator.display_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">@{creator.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {creator.tier}
                          </Badge>
                          <span className="text-xs gold-text flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {creator.reputation} Rep
                          </span>
                        </div>
                      </div>
                      <Button variant="gold" size="sm">
                        Follow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reels Tab */}
          <TabsContent value="reels" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {reels.length === 0 ? (
                <p className="col-span-full text-muted-foreground text-center py-8">
                  No reels yet. Be the first to create one!
                </p>
              ) : (
                reels.map((reel) => (
                  <div 
                    key={reel.id} 
                    className="aspect-[9/16] rounded-xl bg-secondary relative overflow-hidden cursor-pointer group"
                  >
                    {reel.media_url && (
                      <img 
                        src={reel.media_url} 
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                          {reel.author?.display_name?.[0] || '?'}
                        </div>
                        <span className="text-xs text-foreground font-medium">
                          {reel.author?.display_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {reel.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {reel.comments_count}
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: 'Herald Creators', members: 1234, category: 'Official' },
                { name: 'Web3 Enthusiasts', members: 856, category: 'Tech' },
                { name: 'Content Creators Hub', members: 642, category: 'Creative' },
                { name: 'Token Economics', members: 521, category: 'Finance' },
              ].map((community, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-semibold text-foreground">
                          {community.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {community.members.toLocaleString()} members
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {community.category}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Join
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
