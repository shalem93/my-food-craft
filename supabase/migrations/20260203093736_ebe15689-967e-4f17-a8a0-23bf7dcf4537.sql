-- Add tags column to menu_items table for storing item tags like 'spicy', 'vegan', etc.
ALTER TABLE public.menu_items
ADD COLUMN tags text[] DEFAULT '{}'::text[];