-- Grant SELECT permission on chef_profiles to anon and authenticated roles
GRANT SELECT ON public.chef_profiles TO anon, authenticated;

-- Also ensure menu_items and chef_ratings are accessible (they use public role which may not include anon)
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT SELECT ON public.chef_ratings TO anon, authenticated;