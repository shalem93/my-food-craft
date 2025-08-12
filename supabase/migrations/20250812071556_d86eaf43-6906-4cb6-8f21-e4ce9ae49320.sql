-- Ensure required extensions
create extension if not exists pgcrypto;

-- MENU ITEMS TABLE
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  chef_user_id uuid not null,
  name text not null,
  description text,
  price_cents integer not null,
  image_url text,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

-- Create indexes (idempotent)
create index if not exists idx_menu_items_chef_created_at on public.menu_items (chef_user_id, created_at desc);
create index if not exists idx_menu_items_available on public.menu_items (available);

-- Update trigger for updated_at (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'menu_items_update_updated_at'
      AND c.relname = 'menu_items'
  ) THEN
    CREATE TRIGGER menu_items_update_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'menu_items' AND policyname = 'menu_items_public_select') THEN
    CREATE POLICY "menu_items_public_select"
    ON public.menu_items
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'menu_items' AND policyname = 'menu_items_insert_own') THEN
    CREATE POLICY "menu_items_insert_own"
    ON public.menu_items
    FOR INSERT
    WITH CHECK ((auth.uid() = chef_user_id) AND has_role(auth.uid(), 'chef'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'menu_items' AND policyname = 'menu_items_update_own') THEN
    CREATE POLICY "menu_items_update_own"
    ON public.menu_items
    FOR UPDATE
    USING (auth.uid() = chef_user_id)
    WITH CHECK (auth.uid() = chef_user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'menu_items' AND policyname = 'menu_items_delete_own') THEN
    CREATE POLICY "menu_items_delete_own"
    ON public.menu_items
    FOR DELETE
    USING (auth.uid() = chef_user_id);
  END IF;
END $$;

-- REVIEWS TABLE
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_id uuid,
  chef_user_id uuid not null,
  taste integer not null check (taste between 1 and 5),
  looks integer not null check (looks between 1 and 5),
  price integer not null check (price between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Indexes for reviews
create index if not exists idx_reviews_chef_created_at on public.reviews (chef_user_id, created_at desc);
create index if not exists idx_reviews_user on public.reviews (user_id);

-- Update trigger for reviews.updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'reviews_update_updated_at'
      AND c.relname = 'reviews'
  ) THEN
    CREATE TRIGGER reviews_update_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Policies for reviews
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_public_select') THEN
    CREATE POLICY "reviews_public_select"
    ON public.reviews
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_insert_own') THEN
    CREATE POLICY "reviews_insert_own"
    ON public.reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_update_own') THEN
    CREATE POLICY "reviews_update_own"
    ON public.reviews
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_delete_own') THEN
    CREATE POLICY "reviews_delete_own"
    ON public.reviews
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Aggregated ratings view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'chef_ratings' AND n.nspname = 'public'
  ) THEN
    CREATE VIEW public.chef_ratings AS
    SELECT
      r.chef_user_id,
      COUNT(*)::bigint AS review_count,
      AVG((r.taste + r.looks + r.price) / 3.0)::float8 AS avg_overall,
      AVG(r.taste)::float8 AS avg_taste,
      AVG(r.looks)::float8 AS avg_looks,
      AVG(r.price)::float8 AS avg_price
    FROM public.reviews r
    GROUP BY r.chef_user_id;
  END IF;
END $$;
