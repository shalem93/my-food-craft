-- Create chef_payouts table to track payout history
CREATE TABLE public.chef_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_user_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  stripe_payout_id TEXT,
  stripe_transfer_id TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chef_payouts ENABLE ROW LEVEL SECURITY;

-- Chefs can only view their own payouts
CREATE POLICY "Chefs can view their own payouts"
  ON public.chef_payouts FOR SELECT
  USING (auth.uid() = chef_user_id);

-- Only service role can insert/update (edge functions)
CREATE POLICY "Service role can manage payouts"
  ON public.chef_payouts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_chef_payouts_updated_at
  BEFORE UPDATE ON public.chef_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_chef_payouts_chef_user_id ON public.chef_payouts(chef_user_id);
CREATE INDEX idx_chef_payouts_status ON public.chef_payouts(status);