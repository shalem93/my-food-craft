-- Add prep_time_minutes column to menu_items table (optional)
ALTER TABLE public.menu_items
ADD COLUMN prep_time_minutes integer DEFAULT NULL;