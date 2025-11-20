-- Add availability fields to chef_profiles
ALTER TABLE chef_profiles
ADD COLUMN is_online boolean DEFAULT false,
ADD COLUMN schedule jsonb DEFAULT '{
  "monday": {"open": "09:00", "close": "21:00", "enabled": true},
  "tuesday": {"open": "09:00", "close": "21:00", "enabled": true},
  "wednesday": {"open": "09:00", "close": "21:00", "enabled": true},
  "thursday": {"open": "09:00", "close": "21:00", "enabled": true},
  "friday": {"open": "09:00", "close": "21:00", "enabled": true},
  "saturday": {"open": "09:00", "close": "21:00", "enabled": true},
  "sunday": {"open": "09:00", "close": "21:00", "enabled": true}
}'::jsonb;