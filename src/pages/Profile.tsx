import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BadgeCheck,
  Edit2,
  Sparkles,
  Users,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  tier: string | null;
  reputation: number | null;
  is_verified: boolean;
  total_engagement: number;
  followers_count: number;
  following_count: number;
  created_at: string;
}

interface WalletData {
  httn_points: number;
  httn_tokens: number;
}

interface Post {
  id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  httn_earned: number;
  created_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    bio: '',
  });

  const VERIFICATION_THRESHOLD = 10000;
  const ENGAGEMENT_THRESHOLD = 100;

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    const [profileRes, walletRes, postsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('wallets').select('httn_points, httn_tokens').eq('user_id', user.id).maybeSingle(),
      supabase.from('posts').select('*').eq('author_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data as ProfileData);
      setEditForm({
        display_name: profileRes.data.display_name || '',
        username: profileRes.data.username || '',
        bio: profileRes.data.bio || '',
      });
    }
    if (walletRes.data) setWallet(walletRes.data);
    if (postsRes.data) setPosts(postsRes.data);
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editForm.display_name,
        username: editForm.username,
        bio: editForm.bio,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      setIsEditing(false);
      fetchProfileData();
    }
  };

  const verificationProgress = wallet
    ? Math.min((wallet.httn_points / VERIFICATION_THRESHOLD) * 100, 100)
    : 0;

  const engagementProgress = profile
    ? Math.min((profile.total_engagement / ENGAGEMENT_THRESHOLD) * 100, 100)
    : 0;

  const canGetVerified = wallet && profile && 
    wallet.httn_points >= VERIFICATION_THRESHOLD && 
    profile.total_engagement >= ENGAGEMENT_THRESHOLD;

  const tierConfig: Record<string, { label: string; color: string }> = {
    herald: { label: 'Herald', color: 'bg-primary text-primary-foreground' },
    creator: { label: 'Creator', color: 'bg-herald-violet text-white' },
    participant: { label: 'Participant', color: 'bg-secondary text-secondary-foreground' },
    partner: { label: 'Partner', color: 'bg-herald-ember text-white' },
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row gap-4 -mt-12">
              <Avatar className="w-24 h-24 border-4 border-background">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl font-display font-bold bg-secondary">
                  {profile?.display_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 pt-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Input
                          value={editForm.display_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                          className="text-xl font-display font-bold"
                        />
                      ) : (
                        <h1 className="font-display font-bold text-2xl text-foreground">
                          {profile?.display_name || 'Anonymous'}
                        </h1>
                      )}
                      {profile?.is_verified && (
                        <BadgeCheck className="w-6 h-6 text-primary glow-gold" />
                      )}
                    </div>
                    {isEditing ? (
                      <Input
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        className="mt-1"
                        placeholder="@username"
                      />
                    ) : (
                      <p className="text-muted-foreground">@{profile?.username || 'username'}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={tierConfig[profile?.tier || 'participant'].color}>
                        {tierConfig[profile?.tier || 'participant'].label}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                  
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                      <Button variant="gold" size="sm" onClick={handleSaveProfile}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                
                {isEditing ? (
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="mt-4"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-foreground mt-4">
                    {profile?.bio || 'No bio yet. Add one to tell the world about yourself!'}
                  </p>
                )}
                
                {/* Stats */}
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <p className="font-display font-bold text-lg text-foreground">{profile?.followers_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-lg text-foreground">{profile?.following_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-lg gold-text">{profile?.reputation || 0}</p>
                    <p className="text-xs text-muted-foreground">Reputation</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-lg text-foreground">{posts.length}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Progress Card */}
        {!profile?.is_verified && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-primary" />
                Verification Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Earn the blue verification badge by reaching {VERIFICATION_THRESHOLD.toLocaleString()} HTTN Points and {ENGAGEMENT_THRESHOLD} total engagement!
              </p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      HTTN Points
                    </span>
                    <span className="text-foreground">
                      {wallet?.httn_points.toLocaleString() || 0} / {VERIFICATION_THRESHOLD.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={verificationProgress} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Engagement
                    </span>
                    <span className="text-foreground">
                      {profile?.total_engagement || 0} / {ENGAGEMENT_THRESHOLD}
                    </span>
                  </div>
                  <Progress value={engagementProgress} className="h-2" />
                </div>
              </div>

              {canGetVerified && (
                <Button variant="gold" className="w-full">
                  <BadgeCheck className="w-4 h-4 mr-2" />
                  Claim Verification Badge
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-4">
            {posts.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No posts yet. Start creating content to earn HTTN!
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <p className="text-foreground">{post.content}</p>
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
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                Liked posts will appear here
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                Media posts will appear here
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
