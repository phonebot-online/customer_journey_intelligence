-- BigQuery — once GA4 BQ has accumulated 14+ days of data AND you've started pushing
-- transaction_id (CMS order_id) or hashed email as user_id into GA4's purchase event.
--
-- Run in BigQuery console: console.cloud.google.com/bigquery?project=bigquery-api-494711

-- =====================================================================
-- Step 1: Pull GA4 purchase events with attribution (first_touch source/medium)
-- =====================================================================
WITH purchase_events AS (
  SELECT
    user_pseudo_id,
    user_id,  -- if you set this, it's the email hash
    event_timestamp,
    event_date,
    -- Standard ecommerce param: transaction_id (set this to CMS order_id in your tag)
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'transaction_id') AS cms_order_id,
    ecommerce.purchase_revenue_in_usd AS purchase_revenue,
    ecommerce.transaction_id AS ga_transaction_id,  -- alternative location
    -- Attribution at event time (Google's "session source/medium")
    collected_traffic_source.manual_source AS source,
    collected_traffic_source.manual_medium AS medium,
    collected_traffic_source.manual_campaign_name AS campaign,
    geo.country,
    geo.region
  FROM `bigquery-api-494711.analytics_2765078625.events_*`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    AND event_name = 'purchase'
),

-- =====================================================================
-- Step 2: First-touch attribution per user
-- =====================================================================
first_touch AS (
  SELECT
    user_pseudo_id,
    ARRAY_AGG(STRUCT(source, medium, campaign) ORDER BY event_timestamp ASC LIMIT 1)[OFFSET(0)] AS first_touch
  FROM `bigquery-api-494711.analytics_2765078625.events_*`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
  GROUP BY user_pseudo_id
)

SELECT
  pe.event_date,
  pe.cms_order_id,
  pe.purchase_revenue,
  ft.first_touch.source AS first_touch_source,
  ft.first_touch.medium AS first_touch_medium,
  ft.first_touch.campaign AS first_touch_campaign,
  pe.source AS last_touch_source,
  pe.medium AS last_touch_medium,
  pe.campaign AS last_touch_campaign,
  pe.country,
  pe.region
FROM purchase_events pe
LEFT JOIN first_touch ft ON pe.user_pseudo_id = ft.user_pseudo_id
WHERE pe.cms_order_id IS NOT NULL
ORDER BY pe.event_date DESC;
