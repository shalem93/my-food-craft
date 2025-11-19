-- Fix chef_profiles RLS policies to allow chefs to read their own data
-- Drop existing restrictive policies
DROP POLICY IF EXISTS chef_profiles_public_select ON chef_profiles;

-- Create proper permissive policies
CREATE POLICY "Chefs can view all profiles"
  ON chef_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view all profiles"
  ON chef_profiles
  FOR SELECT
  TO anon
  USING (true);