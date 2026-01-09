import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/herald/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft,
  Sparkles,
  RefreshCw,
  Send,
  History,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface WalletData {
  httn_points: number;
  httn_tokens: number;
  espees: number;
  pending_rewards: number;
}

export default function Wallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [convertAmount, setConvertAmount] = useState('');

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setWallet(data);
  };

  const handleConvertPoints = async () => {
    if (!wallet || !user) return;
    const amount = parseInt(convertAmount);
    if (isNaN(amount) || amount < 100 || amount > wallet.httn_points) return;

    const tokensToAdd = amount / 1000;
    await supabase.from('wallets').update({
      httn_points: wallet.httn_points - amount,
      httn_tokens: Number(wallet.httn_tokens) + tokensToAdd,
    }).eq('user_id', user.id);

    fetchWallet();
    setConvertAmount('');
  };

  const transactions = [
    { type: 'earned', description: 'Content reward', amount: 50, date: 'Today' },
    { type: 'earned', description: 'Task completed', amount: 25, date: 'Today' },
    { type: 'sent', description: 'Tip to @creator', amount: -10, date: 'Yesterday' },
    { type: 'converted', description: 'Points to Tokens', amount: -1000, date: '2 days ago' },
    { type: 'earned', description: 'Engagement bonus', amount: 100, date: '3 days ago' },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Wallet</h1>
          <p className="text-muted-foreground">Manage your HTTN Points, Tokens, and Espees</p>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Off-chain</span>
              </div>
              <p className="text-3xl font-display font-bold gold-text">
                {wallet?.httn_points.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-muted-foreground">HTTN Points</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">On-chain</span>
              </div>
              <p className="text-3xl font-display font-bold text-foreground">
                {Number(wallet?.httn_tokens || 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">HTTN Tokens</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <span className="text-xs text-muted-foreground">Redeemable</span>
              </div>
              <p className="text-3xl font-display font-bold text-foreground">
                ₦{Number(wallet?.espees || 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Espees</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Rewards */}
        {wallet && wallet.pending_rewards > 0 && (
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">
                    {wallet.pending_rewards} HTTN Points Pending
                  </p>
                  <p className="text-sm text-muted-foreground">Complete tasks to claim</p>
                </div>
              </div>
              <Button variant="gold" size="sm">
                View Tasks
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="convert" className="w-full">
          <TabsList>
            <TabsTrigger value="convert" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Convert
            </TabsTrigger>
            <TabsTrigger value="send" className="gap-2">
              <Send className="w-4 h-4" />
              Send
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="convert" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  Convert Points to Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Conversion Rate</p>
                  <p className="font-display font-semibold text-foreground">
                    1,000 HTTN Points = 1 HTTN Token
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Amount to Convert</label>
                  <Input
                    type="number"
                    placeholder="Enter points amount"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="bg-input"
                    min={100}
                    max={wallet?.httn_points || 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: 100 points | Available: {wallet?.httn_points.toLocaleString() || 0} points
                  </p>
                </div>

                {convertAmount && parseInt(convertAmount) >= 100 && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">You will receive</p>
                    <p className="font-display font-bold text-xl gold-text">
                      {(parseInt(convertAmount) / 1000).toFixed(3)} HTTN Tokens
                    </p>
                  </div>
                )}

                <Button 
                  variant="gold" 
                  className="w-full"
                  onClick={handleConvertPoints}
                  disabled={!convertAmount || parseInt(convertAmount) < 100}
                >
                  Convert Points
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Send HTTN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Recipient Username</label>
                  <Input
                    placeholder="@username"
                    className="bg-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Amount</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    className="bg-input"
                  />
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border flex items-center gap-3">
                  <Shield className="w-5 h-5 text-success" />
                  <p className="text-sm text-muted-foreground">
                    Transactions are secured and verified on-chain
                  </p>
                </div>

                <Button variant="gold" className="w-full">
                  Send HTTN
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'earned' ? 'bg-success/20' : 
                          tx.type === 'sent' ? 'bg-destructive/20' : 'bg-primary/20'
                        }`}>
                          {tx.type === 'earned' ? (
                            <ArrowDownLeft className="w-5 h-5 text-success" />
                          ) : tx.type === 'sent' ? (
                            <ArrowUpRight className="w-5 h-5 text-destructive" />
                          ) : (
                            <RefreshCw className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <span className={`font-display font-semibold ${
                        tx.amount > 0 ? 'text-success' : 'text-foreground'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} HTTN
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
