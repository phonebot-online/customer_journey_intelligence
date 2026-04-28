-- BigQuery — once GA4 BQ + CMS join is established (see bq_ga4_to_cms_join.sql),
-- compute LTV by first-touch channel.
--
-- Prerequisites:
-- 1. GA4 BQ events tables have ≥90 days of data
-- 2. CMS orders are in BQ as a table (export your CMS data nightly to a BQ dataset)
-- 3. transaction_id is set on GA4 purchase events to match CMS order_id
--
-- This query assumes you've created `phonebot_cms.orders` table in BQ. If you haven't:
--   bq mk --table phonebot_cms.orders order_id:INT64,email:STRING,order_date:DATE,total:FLOAT64,gp:FLOAT64
--   bq load phonebot_cms.orders 1_month/cms_manual/cms_orders_v4_with_refunds.csv  # nightly via cron

WITH first_touch_per_customer AS (
  -- For each user_pseudo_id, find the first session's source/medium/campaign
  SELECT
    user_pseudo_id,
    ARRAY_AGG(
      STRUCT(
        traffic_source.source AS source,
        traffic_source.medium AS medium,
        traffic_source.name AS campaign
      )
      ORDER BY user_first_touch_timestamp ASC LIMIT 1
    )[OFFSET(0)] AS first_touch
  FROM `bigquery-api-494711.analytics_2765078625.events_*`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
  GROUP BY user_pseudo_id
),

-- Map user_pseudo_id → CMS email/order via the transaction_id bridge
user_to_email AS (
  SELECT DISTINCT
    e.user_pseudo_id,
    o.email
  FROM `bigquery-api-494711.analytics_2765078625.events_*` e
  JOIN `phonebot_cms.orders` o
    ON SAFE_CAST(
        (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'transaction_id')
        AS INT64) = o.order_id
  WHERE e.event_name = 'purchase'
    AND _TABLE_SUFFIX BETWEEN
      FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY))
      AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
),

-- Per-customer LTV from CMS (12-month rolling)
customer_ltv AS (
  SELECT
    email,
    COUNT(*) AS lifetime_orders,
    SUM(total) AS lifetime_revenue,
    SUM(gp) AS lifetime_gp,
    MIN(order_date) AS first_order_date,
    MAX(order_date) AS last_order_date
  FROM `phonebot_cms.orders`
  WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)
  GROUP BY email
)

-- Roll up by first-touch acquisition channel
SELECT
  ft.first_touch.source,
  ft.first_touch.medium,
  ft.first_touch.campaign,
  COUNT(DISTINCT ute.email) AS customers_acquired,
  AVG(cl.lifetime_revenue) AS avg_ltv_revenue,
  AVG(cl.lifetime_gp) AS avg_ltv_gp,
  AVG(cl.lifetime_orders) AS avg_lifetime_orders,
  -- Repeat rate within window
  COUNTIF(cl.lifetime_orders > 1) / COUNT(*) AS repeat_rate
FROM first_touch_per_customer ft
JOIN user_to_email ute ON ft.user_pseudo_id = ute.user_pseudo_id
JOIN customer_ltv cl ON ute.email = cl.email
GROUP BY 1, 2, 3
HAVING customers_acquired >= 10
ORDER BY avg_ltv_gp DESC;

-- This is your gold output: tells you which acquisition channels bring high-LTV customers.
-- Use it to set Smart Bidding value rules in Google Ads:
--   - Channels in the top quartile by avg_ltv_gp → +30% bid modifier
--   - Bottom quartile → -20% modifier (or pause)
