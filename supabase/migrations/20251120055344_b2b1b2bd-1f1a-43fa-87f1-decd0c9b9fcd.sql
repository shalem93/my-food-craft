-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-items', 'menu-items', true);

-- Allow authenticated users to upload their own menu item images
CREATE POLICY "Chefs can upload menu item images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view menu item images
CREATE POLICY "Menu item images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-items');

-- Allow chefs to update their own menu item images
CREATE POLICY "Chefs can update their own menu item images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow chefs to delete their own menu item images
CREATE POLICY "Chefs can delete their own menu item images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);