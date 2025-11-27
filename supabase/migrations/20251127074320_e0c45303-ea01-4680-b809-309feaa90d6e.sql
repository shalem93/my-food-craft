-- Add profile and banner image URLs to chef_profiles table
ALTER TABLE public.chef_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url text,
ADD COLUMN IF NOT EXISTS banner_image_url text;