-- Drop existing conflicting SELECT policies on chef_profiles
DROP POLICY IF EXISTS "Anyone can view all profiles" ON public.chef_profiles;
DROP POLICY IF EXISTS "Chefs can view all profiles" ON public.chef_profiles;

-- Create a clear policy allowing authenticated users to view all chef profiles
CREATE POLICY "authenticated_can_view_chef_profiles"
ON public.chef_profiles
FOR SELECT
TO authenticated
USING (true);

-- Also allow anonymous users to view chef profiles (for public storefront)
CREATE POLICY "anon_can_view_chef_profiles"
ON public.chef_profiles
FOR SELECT
TO anon
USING (true);