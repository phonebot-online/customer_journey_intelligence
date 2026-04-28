-- DuckDB-compatible. Run via:
--   duckdb app/data/phonebot.db < scripts/ltv_bidding/historical_ltv.sql > outputs/customer_ltv.csv
--
-- Computes per-customer LTV from your 12-month CMS data. Output is a CSV ready to chunk
-- into Customer Match list uploads.

COPY (
  WITH customer AS (
    SELECT
      LOWER(TRIM(Email)) as email,
      MIN(order_date) as first_order_date,
      MAX(order_date) as last_order_date,
      COUNT(DISTINCT order_id) as order_count,
      SUM(total) as ltv_revenue,
      SUM(gp_imputed) as ltv_gp,
      AVG(total) as avg_order_value,
      DATEDIFF('day', MIN(order_date), MAX(order_date)) as days_active,
      COUNT(DISTINCT CASE WHEN was_refunded THEN order_id END) as refunded_orders,
      LIST(DISTINCT Brand) as brands_purchased
    FROM fact_web_orders
    WHERE Email IS NOT NULL AND Email != ''
      AND total > 0
    GROUP BY LOWER(TRIM(Email))
  ),
  tiered AS (
    SELECT
      *,
      NTILE(5) OVER (ORDER BY ltv_revenue DESC) as ltv_quintile,
      CASE
        WHEN order_count = 1 THEN 'one_and_done'
        WHEN order_count BETWEEN 2 AND 3 THEN 'occasional'
        WHEN order_count BETWEEN 4 AND 6 THEN 'regular'
        ELSE 'loyal'
      END as cadence_segment
    FROM customer
  )
  SELECT
    email,
    -- For Customer Match upload, hash this with SHA-256 BEFORE upload (do it client-side, never log raw)
    -- e.g. in Python: hashlib.sha256(email.encode()).hexdigest()
    first_order_date,
    last_order_date,
    order_count,
    ltv_revenue,
    ltv_gp,
    avg_order_value,
    days_active,
    refunded_orders,
    cadence_segment,
    ltv_quintile,
    CASE ltv_quintile
      WHEN 1 THEN 'top_20'
      WHEN 2 THEN 'next_20'
      WHEN 3 THEN 'mid_20'
      WHEN 4 THEN 'low_20'
      WHEN 5 THEN 'bottom_20'
    END as ltv_tier,
    array_to_string(brands_purchased, '|') as brands_purchased
  FROM tiered
  ORDER BY ltv_revenue DESC
) TO 'scripts/ltv_bidding/outputs/customer_ltv.csv' (FORMAT CSV, HEADER);

-- Summary by tier — sanity-check the distribution
SELECT
  CASE NTILE(5) OVER (ORDER BY ltv_revenue DESC)
    WHEN 1 THEN 'top_20' WHEN 2 THEN 'next_20' WHEN 3 THEN 'mid_20' WHEN 4 THEN 'low_20' ELSE 'bottom_20'
  END as tier,
  COUNT(*) as customers,
  AVG(ltv_revenue)::DOUBLE as avg_ltv,
  SUM(ltv_revenue)::DOUBLE as total_ltv,
  AVG(order_count)::DOUBLE as avg_orders,
  AVG(ltv_gp)::DOUBLE as avg_gp
FROM (
  SELECT LOWER(TRIM(Email)) as email,
         COUNT(*) as order_count,
         SUM(total) as ltv_revenue,
         SUM(gp_imputed) as ltv_gp
  FROM fact_web_orders
  WHERE Email IS NOT NULL AND Email != '' AND total > 0
  GROUP BY 1
) c
GROUP BY tier
ORDER BY total_ltv DESC;
