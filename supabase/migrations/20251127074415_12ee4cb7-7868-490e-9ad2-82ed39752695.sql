-- Create storage bucket for chef profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chef-profiles', 'chef-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Chefs can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Chefs can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Chef profile images are publicly accessible" ON storage.objects;

-- Create storage policies for chef profile images
CREATE POLICY "Chefs can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chef-profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Chefs can update their own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chef-profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Chef profile images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chef-profiles');