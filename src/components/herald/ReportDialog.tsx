import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const REASONS = [
  'Spam or scam',
  'Hate speech or harassment',
  'Violence or dangerous content',
  'Nudity or sexual content',
  'False information',
  'Other',
];

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  postId?: string;
  reportedUserId?: string;
}

export function ReportDialog({ open, onClose, postId, reportedUserId }: ReportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        post_id: postId || null,
        reported_user_id: reportedUserId || null,
        reason,
        details: details.trim() || null,
      });
      if (error) throw error;
      toast({ title: 'Report submitted', description: 'Our moderation team will review it shortly' });
      setDetails('');
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not submit report',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report Content
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Why are you reporting this?</Label>
            <div className="space-y-1">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    reason === r
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Additional details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="bg-input border-border resize-none min-h-[70px]"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1 gap-2" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
