-- Performance indexes for orders
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_chef_user_id on public.orders(chef_user_id);
create index if not exists idx_orders_status on public.orders(status);

-- Ensure each Stripe PaymentIntent is only associated once (allowing NULLs)
create unique index if not exists orders_stripe_payment_intent_id_unique
  on public.orders(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- Updated_at triggers (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at'
  ) THEN
    CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_chef_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_chef_profiles_updated_at
    BEFORE UPDATE ON public.chef_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;