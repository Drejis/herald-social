import { useState, useEffect, useRef } from 'react';
import { Plus, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck } from 'lucide-react';

interface Story {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
}

interface StoryGroup {
  userId: string;
  displayName: string;
  username: string;
  avatar: string | null;
  isVerified: boolean;
  stories: Story[];
}

export function StoryBar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewingGroup, setViewingGroup] = useState<number | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchStories();
  }, [user]);

  const fetchStories = async () => {
    const { data: stories, error } = await supabase
      .from('stories')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !stories) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, is_verified');

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const grouped: Record<string, StoryGroup> = {};
    for (const s of stories) {
      const p = profileMap.get(s.user_id);
      if (!grouped[s.user_id]) {
        grouped[s.user_id] = {
          userId: s.user_id,
          displayName: p?.display_name || 'User',
          username: p?.username || 'user',
          avatar: p?.avatar_url || null,
          isVerified: p?.is_verified || false,
          stories: [],
        };
      }
      grouped[s.user_id].stories.push({
        ...s,
        display_name: p?.display_name || 'User',
        username: p?.username || 'user',
        avatar_url: p?.avatar_url || null,
        is_verified: p?.is_verified || false,
      });
    }

    // Current user's story first
    const list = Object.values(grouped).sort((a, b) =>
      a.userId === user?.id ? -1 : b.userId === user?.id ? 1 : 0
    );
    setGroups(list);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!user || (!storyText.trim() && !mediaFile)) return;
    setPosting(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (mediaFile) {
        const ext = mediaFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(path, mediaFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('post-media').getPublicUrl(path);
        mediaUrl = data.publicUrl;
        mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
      }

      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        content: storyText.trim() || null,
        media_url: mediaUrl,
        media_type: mediaType,
      });
      if (error) throw error;

      toast({ title: 'Story posted!', description: 'Your story is live for 24 hours' });
      setCreateOpen(false);
      setStoryText('');
      setMediaFile(null);
      setMediaPreview(null);
      fetchStories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not post story',
        variant: 'destructive',
      });
    } finally {
      setPosting(false);
    }
  };

  const openGroup = (groupIdx: number) => {
    setViewingGroup(groupIdx);
    setStoryIndex(0);
  };

  const advance = () => {
    if (viewingGroup === null) return;
    const group = groups[viewingGroup];
    if (storyIndex + 1 < group.stories.length) {
      setStoryIndex(prev => prev + 1);
    } else if (viewingGroup + 1 < groups.length) {
      setViewingGroup(prev => (prev !== null ? prev + 1 : null));
      setStoryIndex(0);
    } else {
      setViewingGroup(null);
    }
  };

  // Auto-advance stories every 5 seconds
  useEffect(() => {
    if (viewingGroup === null) return;
    const timer = setTimeout(advance, 5000);
    return () => clearTimeout(timer);
  }, [viewingGroup, storyIndex, groups]);

  const activeGroup = viewingGroup !== null ? groups[viewingGroup] : null;
  const activeStory = activeGroup ? activeGroup.stories[storyIndex] : null;

  return (
    <div className="border-b border-border p-4">
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
        {/* Add story */}
        <button
          onClick={() => setCreateOpen(true)}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center hover:bg-secondary transition-colors">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Your story</span>
        </button>

        {/* Stories */}
        {groups.map((group, idx) => (
          <button
            key={group.userId}
            onClick={() => openGroup(idx)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary via-primary/60 to-herald-violet">
              <div className="w-full h-full rounded-full p-[2px] bg-background">
                <Avatar className="w-full h-full">
                  <AvatarImage src={group.avatar || undefined} />
                  <AvatarFallback className="bg-secondary font-display font-bold text-foreground">
                    {group.displayName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs text-muted-foreground max-w-[64px] truncate">
              {group.userId === user?.id ? 'You' : group.username}
            </span>
          </button>
        ))}
      </div>

      {/* Story viewer */}
      <Dialog open={viewingGroup !== null} onOpenChange={() => setViewingGroup(null)}>
        <DialogContent className="sm:max-w-md p-0 bg-card border-border overflow-hidden">
          {activeStory && (
            <div className="relative">
              <div className="flex gap-1 p-2">
                {activeGroup!.stories.map((_, i) => (
                  <div key={i} className="flex-1 h-0.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full bg-primary transition-all duration-500 ${
                        i < storyIndex ? 'w-full' : i === storyIndex ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-4 pb-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={activeStory.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-foreground font-bold text-xs">
                    {activeStory.display_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                    {activeStory.display_name}
                    {activeStory.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-primary fill-primary/20" />}
                  </p>
                  <p className="text-xs text-muted-foreground">@{activeStory.username}</p>
                </div>
                <button
                  onClick={() => setViewingGroup(null)}
                  className="ml-auto w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              <div
                className="min-h-[400px] flex flex-col items-center justify-center bg-secondary/40 cursor-pointer"
                onClick={advance}
              >
                {activeStory.media_url && activeStory.media_type === 'video' ? (
                  <video src={activeStory.media_url} controls className="w-full max-h-[400px]" />
                ) : activeStory.media_url ? (
                  <img src={activeStory.media_url} className="w-full max-h-[400px] object-cover" />
                ) : null}
                {activeStory.content && (
                  <p className="p-6 text-lg text-foreground text-center whitespace-pre-wrap">
                    {activeStory.content}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create story */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Create Story</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Share something with your followers..."
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            className="min-h-[100px] bg-input border-border resize-none"
          />
          <input ref={fileInputRef} type="file" accept="image/*,video/*" hidden onChange={handleFile} />
          {mediaPreview && (
            <div className="relative rounded-lg overflow-hidden border border-border">
              {mediaFile?.type.startsWith('video') ? (
                <video src={mediaPreview} className="w-full max-h-[200px]" controls />
              ) : (
                <img src={mediaPreview} className="w-full max-h-[200px] object-cover" />
              )}
              <button
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" gap-2 onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="w-4 h-4 mr-1" />
              {mediaPreview ? 'Change media' : 'Add photo/video'}
            </Button>
            <Button variant="gold" onClick={handleCreate} disabled={posting || (!storyText.trim() && !mediaFile)}>
              {posting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Posting...
                </>
              ) : (
                'Post Story'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
