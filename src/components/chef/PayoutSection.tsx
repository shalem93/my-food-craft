import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Zap, CreditCard, DollarSign, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface PayoutData {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  failure_reason?: string;
}

interface BalanceData {
  available_cents: number;
  pending_cents: number;
  instant_available_cents: number;
  currency: string;
  payouts: PayoutData[];
}

interface PayoutSectionProps {
  onboardingComplete: boolean;
}

export const PayoutSection = ({ onboardingComplete }: PayoutSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [useInstant, setUseInstant] = useState(true);
  const { toast } = useToast();

  const dollars = (cents: number) => (cents / 100).toFixed(2);

  const fetchBalance = async () => {
    if (!onboardingComplete) {
      setBalanceLoading(false);
      return;
    }
    
    setBalanceLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chef-payout", {
        body: { action: "get-balance" }
      });

      if (error) {
        console.error("Balance fetch error:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch balance",
          variant: "destructive"
        });
      } else if (data) {
        setBalance(data);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
    setBalanceLoading(false);
  };

  useEffect(() => {
    fetchBalance();
  }, [onboardingComplete]);

  const handleCashout = async () => {
    const amountDollars = parseFloat(cashoutAmount);
    if (isNaN(amountDollars) || amountDollars < 1) {
      toast({
        title: "Invalid amount",
        description: "Minimum cashout is $1.00",
        variant: "destructive"
      });
      return;
    }

    const amountCents = Math.round(amountDollars * 100);
    const maxAvailable = useInstant ? (balance?.instant_available_cents || 0) : (balance?.available_cents || 0);

    if (amountCents > maxAvailable) {
      toast({
        title: "Insufficient balance",
        description: `You can only cash out up to $${dollars(maxAvailable)}${useInstant ? ' instantly' : ''}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chef-payout", {
        body: { 
          action: "request-payout", 
          amount_cents: amountCents,
          instant: useInstant
        }
      });

      if (error) {
        toast({
          title: "Cashout failed",
          description: error.message || "Failed to process cashout",
          variant: "destructive"
        });
      } else if (data?.error) {
        toast({
          title: "Cashout failed",
          description: data.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Cashout successful! 🎉",
          description: useInstant 
            ? `$${amountDollars.toFixed(2)} is on its way to your debit card!`
            : `$${amountDollars.toFixed(2)} will arrive in 1-2 business days.`,
        });
        setCashoutAmount("");
        fetchBalance();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const setMaxAmount = () => {
    const max = useInstant ? (balance?.instant_available_cents || 0) : (balance?.available_cents || 0);
    setCashoutAmount((max / 100).toFixed(2));
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return <Badge className="bg-primary text-primary-foreground">Completed</Badge>;
      case "processing":
      case "pending":
      case "in_transit":
        return <Badge variant="secondary">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!onboardingComplete) {
    return (
        <Card className="border-dashed border-muted">
        <CardContent className="py-8 text-center text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Set up Stripe to view your balance and cash out</p>
          <p className="text-sm mt-1">Complete Stripe onboarding above to enable payouts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Available Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">${dollars(balance?.available_cents || 0)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-primary">
              <Zap className="h-4 w-4" />
              Instant Cash Out
            </CardDescription>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <p className="text-2xl font-bold text-primary">${dollars(balance?.instant_available_cents || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Available now to debit card</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <p className="text-2xl font-bold">${dollars(balance?.pending_cents || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Clears in 1-2 days</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cashout Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cash Out
          </CardTitle>
          <CardDescription>
            Transfer your earnings to your bank account or debit card
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Zap className={`h-5 w-5 ${useInstant ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium">Instant Payout</p>
                <p className="text-sm text-muted-foreground">
                  {useInstant ? "Arrives in minutes (1% fee)" : "Standard payout (1-2 business days, no fee)"}
                </p>
              </div>
            </div>
            <Switch 
              checked={useInstant} 
              onCheckedChange={setUseInstant}
              aria-label="Toggle instant payout"
            />
          </div>

          {useInstant && (balance?.instant_available_cents === 0) && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent text-accent-foreground">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Instant payout requires a debit card</p>
                <p className="text-muted-foreground">Add a debit card in your Stripe dashboard to enable instant payouts.</p>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input 
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
              <Button variant="outline" onClick={setMaxAmount} type="button">
                Max
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {useInstant 
                ? `Max instant: $${dollars(balance?.instant_available_cents || 0)} (1% fee applies)`
                : `Max available: $${dollars(balance?.available_cents || 0)}`
              }
            </p>
          </div>

          <Button 
            onClick={handleCashout} 
            disabled={loading || !cashoutAmount || parseFloat(cashoutAmount) < 1}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {useInstant && <Zap className="mr-2 h-4 w-4" />}
                Cash Out {cashoutAmount ? `$${parseFloat(cashoutAmount).toFixed(2)}` : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Payout History */}
      {balance?.payouts && balance.payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {balance.payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">${dollars(payout.amount_cents)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payout.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    {payout.failure_reason && (
                      <p className="text-xs text-destructive/80 mt-1">{payout.failure_reason}</p>
                    )}
                  </div>
                  {statusBadge(payout.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={fetchBalance} disabled={balanceLoading} className="w-full">
        {balanceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Refresh Balance
      </Button>
    </div>
  );
};
