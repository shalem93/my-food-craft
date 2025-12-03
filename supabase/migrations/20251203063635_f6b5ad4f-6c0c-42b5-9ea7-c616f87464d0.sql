-- Add policy to allow anyone to view online chef profiles
CREATE POLICY "Anyone can view online chef profiles" 
ON public.chef_profiles 
FOR SELECT 
USING (is_online = true);