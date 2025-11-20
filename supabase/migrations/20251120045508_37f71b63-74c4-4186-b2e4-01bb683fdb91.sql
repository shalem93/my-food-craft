-- Grant table-level permissions on chef_profiles to authenticated users
-- RLS policies control row access, but we need table grants first
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chef_profiles TO authenticated;

-- Verify RLS is enabled (it should be, but let's ensure)
ALTER TABLE public.chef_profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure they're correct
DROP POLICY IF EXISTS chef_profiles_select_own ON public.chef_profiles;
DROP POLICY IF EXISTS chef_profiles_insert_own ON public.chef_profiles;
DROP POLICY IF EXISTS chef_profiles_update_own ON public.chef_profiles;
DROP POLICY IF EXISTS chef_profiles_delete_own ON public.chef_profiles;

-- Allow chefs to SELECT their own profile
CREATE POLICY chef_profiles_select_own ON public.chef_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow chefs to INSERT their own profile
CREATE POLICY chef_profiles_insert_own ON public.chef_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow chefs to UPDATE their own profile
CREATE POLICY chef_profiles_update_own ON public.chef_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow chefs to DELETE their own profile
CREATE POLICY chef_profiles_delete_own ON public.chef_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);