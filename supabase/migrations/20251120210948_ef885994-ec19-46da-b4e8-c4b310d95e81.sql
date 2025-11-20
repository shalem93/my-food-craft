-- Drop the incorrect unique constraint on user_id
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

-- Ensure we have the correct unique constraint on (user_id, role)
-- This allows users to have multiple roles
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_user_id_role_key 
UNIQUE (user_id, role);

-- Now add customer role for the existing user
INSERT INTO user_roles (user_id, role)
SELECT '89a542ee-b062-46c5-b3be-631e8cdcd939'::uuid, 'customer'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = '89a542ee-b062-46c5-b3be-631e8cdcd939'::uuid
  AND role = 'customer'
);