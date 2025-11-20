-- Drop and recreate public_chef_info view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.public_chef_info;

-- Create view with explicit SECURITY INVOKER to make security model clear
-- This ensures the view runs with the permissions of the querying user
CREATE VIEW public.public_chef_info 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  display_name,
  bio,
  city,
  onboarding_complete,
  created_at
FROM public.chef_profiles
WHERE onboarding_complete = true;

-- Grant public access to the safe view
GRANT SELECT ON public.public_chef_info TO anon, authenticated;

COMMENT ON VIEW public.public_chef_info IS 'Public view of chef profiles showing only non-sensitive information for completed onboarding. Uses SECURITY INVOKER to ensure RLS policies are respected.';