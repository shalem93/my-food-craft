-- Fix critical RLS policies for orders table
-- Drop dangerous policies that allow anyone to insert/update orders
DROP POLICY IF EXISTS "orders_insert_any" ON public.orders;
DROP POLICY IF EXISTS "orders_update_any" ON public.orders;

-- Only authenticated users can insert their own orders
CREATE POLICY "orders_insert_authenticated"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only service role can update orders (via edge functions)
-- Regular users cannot update orders at all
CREATE POLICY "orders_update_service_only"
ON public.orders
FOR UPDATE
TO authenticated
USING (false);

-- Fix chef_profiles table - restrict sensitive data access
-- Drop overly permissive public SELECT policy
DROP POLICY IF EXISTS "chef_profiles_select_all" ON public.chef_profiles;

-- Allow users to view their own complete profile
CREATE POLICY "chef_profiles_select_own"
ON public.chef_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create limited public view with only safe fields
CREATE OR REPLACE VIEW public.public_chef_info AS
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