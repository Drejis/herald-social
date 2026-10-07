import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/herald/MainLayout';
import { TwitterStylePost } from '@/components/herald/TwitterStylePost';
import { VerticalAdBanner, verticalAds } from '@/components/herald/VerticalAdBanner';
import { Hash, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  display_name: string;
  username: string;
  tier: string;
  reputation: number;
  avatar_url: string | null;
  is_creator: boolean;
  is_verified: boolean;
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
}

export default function Hashtag() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;
    fetchPosts();
  }, [tag]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(display_name, username, tier, reputation, avatar_url, is_creator, is_verified)
      `)
      .ilike('content', `%#${tag}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setPosts(data.map(p => ({ ...p, author: p.author as unknown as Profile })));
    setLoading(false);
  };

  const rightSidebar = (
    <div className="space-y-4">
      <VerticalAdBanner {...verticalAds[0]} />
    </div>
  );

  return (
    <MainLayout rightSidebar={rightSidebar}>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            #{tag}
          </h1>
          <p className="text-sm text-muted-foreground">{posts.length} post{posts.length === 1 ? '' : 's'}</p>
        </div>
      </header>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Hash className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No posts with #{tag} yet. Be the first!</p>
        </div>
      ) : (
        posts.map((post) => (
          <TwitterStylePost
            key={post.id}
            id={post.id}
            author={{
              id: post.author_id || post.author.username,
              displayName: post.author.display_name,
              username: post.author.username,
              avatar: post.author.avatar_url,
              isVerified: post.author.is_verified,
            }}
            content={post.content}
            mediaUrl={post.media_url || undefined}
            mediaType={post.media_type === 'image' ? 'image' : post.media_type === 'video' ? 'video' : undefined}
            likes={post.likes_count}
            comments={post.comments_count}
            reposts={post.shares_count}
            httnEarned={post.httn_earned}
            createdAt={new Date(post.created_at)}
          />
        ))
      )}
    </MainLayout>
  );
}
