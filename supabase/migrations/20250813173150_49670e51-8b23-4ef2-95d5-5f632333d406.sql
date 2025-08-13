-- Restrict reviews insert to users with at least one completed order (proxy: delivery_status is not null)
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;

CREATE POLICY "reviews_insert_after_completed_order"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.user_id = auth.uid()
      AND o.delivery_status IS NOT NULL
  )
);

-- Helpful index for permission check
CREATE INDEX IF NOT EXISTS idx_orders_user_delivery_status ON public.orders (user_id, delivery_status);
