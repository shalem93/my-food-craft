-- Make price_cents nullable since we're standardizing on price (decimal)
ALTER TABLE public.menu_items
ALTER COLUMN price_cents DROP NOT NULL;

-- Set a default so existing inserts without price_cents don't fail
ALTER TABLE public.menu_items
ALTER COLUMN price_cents SET DEFAULT NULL;