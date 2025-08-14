-- Add address fields to chef_profiles table for pickup location
ALTER TABLE public.chef_profiles 
ADD COLUMN pickup_address TEXT,
ADD COLUMN pickup_phone TEXT,
ADD COLUMN pickup_business_name TEXT,
ADD COLUMN city TEXT,
ADD COLUMN zip TEXT;