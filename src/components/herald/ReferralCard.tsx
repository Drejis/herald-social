import { useEffect, useState } from 'react';
import { Users, Copy, Check, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function ReferralCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchReferral = async () => {
      const [profileRes, referralsRes] = await Promise.all([
        supabase.from('profiles').select('referral_code').eq('user_id', user.id).maybeSingle(),
        supabase.from('referrals').select('id').eq('referrer_id', user.id),
      ]);
      if (profileRes.data?.referral_code) setCode(profileRes.data.referral_code);
      setReferralCount(referralsRes.data?.length || 0);
    };

    fetchReferral();
  }, [user]);

  const referralLink = code ? `${window.location.origin}/auth?ref=${code}` : '';

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Link copied!', description: 'Share it with friends to earn 500 HTTN each' });
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  };

  return (
    <div className="herald-card p-4 space-y-3">
      <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        Invite & Earn
      </h3>
      <p className="text-sm text-muted-foreground">
        Share your link — you and your friend each get <span className="gold-text font-semibold">500 HTTN Points</span> when they join.
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground truncate font-mono">
          {code ? referralLink : '...'}
        </div>
        <Button variant="gold" size="icon" className="flex-shrink-0" onClick={handleCopy} disabled={!code}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Gift className="w-3 h-3 text-primary" />
        {referralCount} friend{referralCount === 1 ? '' : 's'} joined with your link
      </p>
    </div>
  );
}
