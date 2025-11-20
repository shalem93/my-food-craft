-- Fix chef_ratings view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.chef_ratings;

CREATE VIEW public.chef_ratings
WITH (security_invoker = true)
AS
SELECT 
  chef_user_id,
  count(*) AS review_count,
  avg(taste)::double precision AS avg_taste,
  avg(looks)::double precision AS avg_looks,
  avg(price)::double precision AS avg_price,
  avg((taste + looks + price)::numeric / 3.0)::double precision AS avg_overall
FROM reviews
GROUP BY chef_user_id;

-- Grant public access since this aggregates publicly viewable review data
GRANT SELECT ON public.chef_ratings TO anon, authenticated;

COMMENT ON VIEW public.chef_ratings IS 'Aggregated ratings by chef from public reviews. Uses SECURITY INVOKER to respect RLS policies.';