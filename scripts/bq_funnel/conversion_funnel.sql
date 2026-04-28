-- BigQuery — Phonebot conversion funnel from GA4 BQ events
-- Run in: console.cloud.google.com/bigquery?project=bigquery-api-494711
--
-- Data starts arriving from 2026-04-29. First useful run: 2026-04-30 (need at least one full day).
-- Meaningful trend analysis: from ~2026-05-13 (2 weeks of data).

-- =====================================================================
-- 1. Standard ecommerce funnel: view_item → add_to_cart → begin_checkout → purchase
-- =====================================================================
WITH events AS (
  SELECT
    event_date,
    event_name,
    user_pseudo_id,
    event_timestamp,
    -- Acquisition channel from session
    traffic_source.source AS source,
    traffic_source.medium AS medium,
    traffic_source.name AS campaign,
    -- Item details from ecommerce events
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'item_brand') AS item_brand,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'item_category') AS item_category,
    ecommerce.purchase_revenue_in_usd AS revenue
  FROM `bigquery-api-494711.analytics_2765078625.events_*`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    AND event_name IN ('view_item', 'add_to_cart', 'begin_checkout', 'purchase')
),
-- Per-user funnel progression
user_funnel AS (
  SELECT
    user_pseudo_id,
    MAX(IF(event_name = 'view_item', 1, 0)) AS reached_view,
    MAX(IF(event_name = 'add_to_cart', 1, 0)) AS reached_atc,
    MAX(IF(event_name = 'begin_checkout', 1, 0)) AS reached_checkout,
    MAX(IF(event_name = 'purchase', 1, 0)) AS reached_purchase,
    -- First-seen acquisition channel
    ANY_VALUE(source) AS source,
    ANY_VALUE(medium) AS medium
  FROM events
  GROUP BY user_pseudo_id
)
SELECT
  source, medium,
  COUNT(*) AS users,
  SUM(reached_view) AS view_item,
  SUM(reached_atc) AS add_to_cart,
  SUM(reached_checkout) AS begin_checkout,
  SUM(reached_purchase) AS purchase,
  SAFE_DIVIDE(SUM(reached_atc), SUM(reached_view)) AS view_to_atc_rate,
  SAFE_DIVIDE(SUM(reached_checkout), SUM(reached_atc)) AS atc_to_checkout_rate,
  SAFE_DIVIDE(SUM(reached_purchase), SUM(reached_checkout)) AS checkout_to_purchase_rate,
  SAFE_DIVIDE(SUM(reached_purchase), SUM(reached_view)) AS overall_view_to_purchase_rate
FROM user_funnel
WHERE reached_view = 1  -- ignore users who never saw a product
GROUP BY source, medium
HAVING users >= 50
ORDER BY users DESC;

-- =====================================================================
-- 2. Daily funnel trend (run after above; use for ProfitOps anomaly detection)
-- =====================================================================
-- SELECT
--   event_date,
--   COUNT(DISTINCT IF(event_name = 'view_item', user_pseudo_id, NULL)) AS view_users,
--   COUNT(DISTINCT IF(event_name = 'add_to_cart', user_pseudo_id, NULL)) AS atc_users,
--   COUNT(DISTINCT IF(event_name = 'begin_checkout', user_pseudo_id, NULL)) AS checkout_users,
--   COUNT(DISTINCT IF(event_name = 'purchase', user_pseudo_id, NULL)) AS purchase_users
-- FROM `bigquery-api-494711.analytics_2765078625.events_*`
-- WHERE _TABLE_SUFFIX BETWEEN
--   FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
--   AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
-- GROUP BY event_date ORDER BY event_date DESC;

-- =====================================================================
-- 3. SKU-level "viewed but didn't buy" — the highest-value funnel insight for Phonebot
-- =====================================================================
-- Once you start passing item_id (your CMS SKU id) into ecommerce events:
-- WITH item_events AS (
--   SELECT
--     user_pseudo_id, event_name, event_timestamp,
--     ANY_VALUE(items)[OFFSET(0)].item_id AS item_id,
--     ANY_VALUE(items)[OFFSET(0)].item_name AS item_name,
--     ANY_VALUE(items)[OFFSET(0)].item_brand AS item_brand
--   FROM `bigquery-api-494711.analytics_2765078625.events_*`
--   WHERE _TABLE_SUFFIX BETWEEN
--     FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
--     AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
--     AND event_name IN ('view_item', 'add_to_cart', 'purchase')
--   GROUP BY user_pseudo_id, event_name, event_timestamp
-- )
-- SELECT
--   item_id, item_name, item_brand,
--   COUNT(DISTINCT IF(event_name = 'view_item', user_pseudo_id, NULL)) AS viewers,
--   COUNT(DISTINCT IF(event_name = 'add_to_cart', user_pseudo_id, NULL)) AS atc_users,
--   COUNT(DISTINCT IF(event_name = 'purchase', user_pseudo_id, NULL)) AS purchasers,
--   SAFE_DIVIDE(COUNT(DISTINCT IF(event_name = 'purchase', user_pseudo_id, NULL)),
--               COUNT(DISTINCT IF(event_name = 'view_item', user_pseudo_id, NULL))) AS view_to_buy_rate
-- FROM item_events
-- GROUP BY 1, 2, 3
-- HAVING viewers >= 30
-- ORDER BY viewers DESC LIMIT 100;
--
-- The "viewed but didn't buy" SKUs at high volume are your top opportunities for:
--   - Targeted retargeting ads
--   - Email cart abandonment triggers
--   - On-site UX improvements (price, urgency, trust signals)
