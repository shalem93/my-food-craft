-- Add lat/lng columns to menu_items for location-based queries
ALTER TABLE public.menu_items
ADD COLUMN lat double precision DEFAULT NULL,
ADD COLUMN lng double precision DEFAULT NULL;

-- Create a function to auto-populate lat/lng from chef_profiles
CREATE OR REPLACE FUNCTION public.set_menu_item_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the chef's location from chef_profiles
  SELECT lat, lng INTO NEW.lat, NEW.lng
  FROM public.chef_profiles
  WHERE user_id = NEW.chef_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-set location on insert
CREATE TRIGGER set_menu_item_location_trigger
BEFORE INSERT ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.set_menu_item_location();

-- Also update on chef_user_id change (if dish is reassigned)
CREATE TRIGGER update_menu_item_location_trigger
BEFORE UPDATE OF chef_user_id ON public.menu_items
FOR EACH ROW
WHEN (OLD.chef_user_id IS DISTINCT FROM NEW.chef_user_id)
EXECUTE FUNCTION public.set_menu_item_location();

-- Backfill existing menu_items with chef locations
UPDATE public.menu_items mi
SET lat = cp.lat, lng = cp.lng
FROM public.chef_profiles cp
WHERE mi.chef_user_id = cp.user_id
AND mi.lat IS NULL;