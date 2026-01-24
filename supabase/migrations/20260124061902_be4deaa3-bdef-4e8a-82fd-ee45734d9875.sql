-- Drop the existing policy that doesn't work for anon users
DROP POLICY IF EXISTS "Anyone can view online chef profiles" ON public.chef_profiles;

-- Create a new policy that explicitly allows anonymous and authenticated users to view online chefs
CREATE POLICY "Public can view online chef profiles" 
ON public.chef_profiles 
FOR SELECT 
TO anon, authenticated
USING (is_online = true);