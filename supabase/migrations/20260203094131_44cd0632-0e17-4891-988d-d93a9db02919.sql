-- Add portions_available column to menu_items table
ALTER TABLE public.menu_items
ADD COLUMN portions_available integer DEFAULT NULL;