-- Create menu items table for chefs
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Policies for menu_items
DO $$ BEGIN
  CREATE POLICY menu_items_public_select ON public.menu_items
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY menu_items_insert_own ON public.menu_items
    FOR INSERT WITH CHECK (auth.uid() = chef_user_id AND public.has_role(auth.uid(), 'chef'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY menu_items_update_own ON public.menu_items
    FOR UPDATE USING (auth.uid() = chef_user_id) WITH CHECK (auth.uid() = chef_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY menu_items_delete_own ON public.menu_items
    FOR DELETE USING (auth.uid() = chef_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger to update updated_at
DO $$ BEGIN
  CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_chef_user_id ON public.menu_items (chef_user_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items (available);


-- Create reviews table supporting taste/looks/price criteria
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_user_id UUID NOT NULL,
  user_id UUID NOT NULL,
  order_id UUID,
  taste INTEGER NOT NULL CHECK (taste BETWEEN 1 AND 5),
  looks INTEGER NOT NULL CHECK (looks BETWEEN 1 AND 5),
  price INTEGER NOT NULL CHECK (price BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
DO $$ BEGIN
  CREATE POLICY reviews_public_select ON public.reviews
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY reviews_insert_own ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY reviews_update_own ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY reviews_delete_own ON public.reviews
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger to update updated_at
DO $$ BEGIN
  CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_reviews_chef_user_id ON public.reviews (chef_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews (order_id);

-- Aggregated ratings view for quick access
CREATE OR REPLACE VIEW public.chef_ratings AS
SELECT
  chef_user_id,
  COUNT(*)::bigint AS review_count,
  AVG(taste)::float AS avg_taste,
  AVG(looks)::float AS avg_looks,
  AVG(price)::float AS avg_price,
  AVG((taste + looks + price) / 3.0)::float AS avg_overall
FROM public.reviews
GROUP BY chef_user_id;