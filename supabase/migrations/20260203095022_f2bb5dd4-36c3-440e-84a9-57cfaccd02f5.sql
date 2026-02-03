-- Add price column (decimal) for mobile app compatibility
-- The web app uses price_cents, mobile app uses price
ALTER TABLE public.menu_items
ADD COLUMN price numeric DEFAULT NULL;