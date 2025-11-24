-- Drop the restrictive update policy
DROP POLICY IF EXISTS orders_update_service_only ON orders;

-- Create new policy allowing users to update delivery details on their own orders
CREATE POLICY orders_update_delivery_info 
ON orders 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);