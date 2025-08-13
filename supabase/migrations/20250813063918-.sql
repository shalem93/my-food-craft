-- Add columns to support external demo IDs and relax chef_user_id requirement for reviews
ALTER TABLE public.reviews
  ALTER COLUMN chef_user_id DROP NOT NULL;

-- Link reviews to our static demo data
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS external_chef_slug text,
  ADD COLUMN IF NOT EXISTS external_menu_item_id text;

-- Helpful indexes for filtering
CREATE INDEX IF NOT EXISTS idx_reviews_external_chef_slug ON public.reviews (external_chef_slug);
CREATE INDEX IF NOT EXISTS idx_reviews_external_menu_item_id ON public.reviews (external_menu_item_id);
