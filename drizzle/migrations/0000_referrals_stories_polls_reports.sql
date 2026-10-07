-- Referral code on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
UPDATE public.profiles SET referral_code = SUBSTRING(MD5(id::text), 1, 8) WHERE referral_code IS NULL;

-- Referrals
CREATE TABLE public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  referred_id uuid not null,
  code text not null,
  points_awarded integer not null default 500,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view referrals they participate in" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users create referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);

-- Stories (24h)
CREATE TABLE public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text,
  media_url text,
  media_type text,
  background text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stories" ON public.stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own stories" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Polls
CREATE TABLE public.polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid not null,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
CREATE TABLE public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id uuid not null,
  option_index integer not null,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);
GRANT SELECT, INSERT ON public.polls TO authenticated;
GRANT SELECT, INSERT ON public.poll_votes TO authenticated;
GRANT ALL ON public.polls TO service_role;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls visible to all" ON public.polls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create own polls" ON public.polls FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Votes visible to all" ON public.poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Vote as self" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Reports (safety & moderation)
CREATE TABLE public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  post_id uuid,
  reported_user_id uuid,
  reason text not null,
  details text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters and admins view reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users submit reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins update reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- New users get a referral code automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, referral_code)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1), SUBSTRING(MD5(NEW.id::text), 1, 8));

  INSERT INTO public.wallets (user_id, httn_points)
  VALUES (NEW.id, 100);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'participant');

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_tasks (user_id, task_type, title, description, reward, target)
  VALUES 
    (NEW.id, 'daily', 'Like 3 Posts', 'Engage with the community by liking posts', 10, 3),
    (NEW.id, 'daily', 'Share 1 Post', 'Amplify great content', 15, 1),
    (NEW.id, 'daily', 'Post Content', 'Create and share your own content', 25, 1),
    (NEW.id, 'weekly', 'Engage 20 Times', 'Be active in the community', 100, 20);

  RETURN NEW;
END;
$function$;