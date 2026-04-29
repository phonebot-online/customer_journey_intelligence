-- vw_sessions: one row per GA4 session.
--
-- Why this exists: GA4 only writes click IDs (gclid/fbclid/msclkid) on the
-- session_start / first_visit events, NOT on subsequent events including
-- purchase. So per-event attribution looks broken when really it's just a
-- naming convention. This view rolls events up to the session level so each
-- session has its landing click IDs + UTMs propagated, even when the session
-- ended in a purchase event hours/clicks later.
--
-- Use this view (not vw_events_flat) for:
--   - Channel-mix attribution by purchase
--   - Joining CMS orders back to the ad click via transaction_id
--   - Counting sessions per channel / source / medium / campaign
--
-- Run in BigQuery SQL editor against project bigquery-api-494711.

CREATE OR REPLACE VIEW `bigquery-api-494711.analytics_284223207.vw_sessions` AS
WITH events AS (
  SELECT
    user_pseudo_id,
    ga_session_id,
    event_name,
    event_timestamp_utc,
    event_date,
    page_location,
    page_referrer,
    -- Click IDs: prefer session-level, then param, then URL fallback
    COALESCE(session_gclid, gclid_param, gclid_from_url)    AS gclid,
    COALESCE(fbclid_param, fbclid_from_url)                  AS fbclid,
    COALESCE(msclkid_param, msclkid_from_url)                AS msclkid,
    -- Source / medium / campaign: prefer session-level (collected_traffic_source)
    -- which is what GA4 uses for last-click attribution
    COALESCE(session_source, event_source, first_touch_source)        AS source,
    COALESCE(session_medium, event_medium, first_touch_medium)        AS medium,
    COALESCE(session_campaign, event_campaign, first_touch_campaign)  AS campaign,
    session_term     AS term,
    session_content  AS content,
    transaction_id,
    purchase_revenue,
    refund_value,
    device_category,
    device_brand,
    browser,
    country,
    region,
    city
  FROM `bigquery-api-494711.analytics_284223207.vw_events_flat`
  WHERE ga_session_id IS NOT NULL
),
landing AS (
  -- The event that opens the session — landing page + click IDs live here
  SELECT
    user_pseudo_id,
    ga_session_id,
    ANY_VALUE(page_location HAVING MIN event_timestamp_utc)  AS landing_page,
    ANY_VALUE(page_referrer HAVING MIN event_timestamp_utc)  AS landing_referrer,
    ANY_VALUE(device_category HAVING MIN event_timestamp_utc) AS device_category,
    ANY_VALUE(device_brand HAVING MIN event_timestamp_utc)    AS device_brand,
    ANY_VALUE(browser HAVING MIN event_timestamp_utc)         AS browser,
    ANY_VALUE(country HAVING MIN event_timestamp_utc)         AS country,
    ANY_VALUE(region HAVING MIN event_timestamp_utc)          AS region,
    ANY_VALUE(city HAVING MIN event_timestamp_utc)            AS city
  FROM events
  GROUP BY user_pseudo_id, ga_session_id
),
attribution AS (
  -- Propagate click IDs / source / medium across all events in the session.
  -- Click IDs only fire on session_start, but we want them attached to the session row.
  SELECT
    user_pseudo_id,
    ga_session_id,
    MAX(gclid)    AS gclid,
    MAX(fbclid)   AS fbclid,
    MAX(msclkid)  AS msclkid,
    MAX(source)   AS source,
    MAX(medium)   AS medium,
    MAX(campaign) AS campaign,
    MAX(term)     AS term,
    MAX(content)  AS content
  FROM events
  GROUP BY user_pseudo_id, ga_session_id
),
events_agg AS (
  SELECT
    user_pseudo_id,
    ga_session_id,
    MIN(event_date)                                        AS session_date,
    MIN(event_timestamp_utc)                               AS session_start,
    MAX(event_timestamp_utc)                               AS session_end,
    TIMESTAMP_DIFF(MAX(event_timestamp_utc), MIN(event_timestamp_utc), SECOND) AS session_duration_sec,
    COUNT(*)                                               AS event_count,
    COUNTIF(event_name = 'page_view')                      AS pageviews,
    COUNTIF(event_name = 'view_item')                      AS view_item_count,
    COUNTIF(event_name = 'add_to_cart')                    AS add_to_cart_count,
    COUNTIF(event_name = 'begin_checkout')                 AS begin_checkout_count,
    COUNTIF(event_name = 'purchase')                       AS purchase_count,
    SUM(IF(event_name = 'purchase', purchase_revenue, 0))  AS purchase_revenue,
    SUM(IF(event_name = 'purchase', refund_value, 0))      AS refund_value,
    ARRAY_AGG(DISTINCT transaction_id IGNORE NULLS LIMIT 10) AS transaction_ids
  FROM events
  GROUP BY user_pseudo_id, ga_session_id
)
SELECT
  e.user_pseudo_id,
  e.ga_session_id,
  e.session_date,
  e.session_start,
  e.session_end,
  e.session_duration_sec,
  e.event_count,
  e.pageviews,
  e.view_item_count,
  e.add_to_cart_count,
  e.begin_checkout_count,
  e.purchase_count,
  (e.purchase_count > 0)            AS converted,
  e.purchase_revenue,
  e.refund_value,
  e.transaction_ids,

  -- Attribution (the load-bearing fields)
  a.gclid,
  a.fbclid,
  a.msclkid,
  a.source,
  a.medium,
  a.campaign,
  a.term,
  a.content,

  -- Channel grouping (computed from source+medium, mirrors GA4's default channel grouping rules)
  CASE
    WHEN a.gclid IS NOT NULL OR (a.source = 'google' AND a.medium = 'cpc') THEN 'Paid Search (Google)'
    WHEN a.fbclid IS NOT NULL OR a.medium IN ('paid_social', 'cpc_fb') OR a.source IN ('facebook', 'fb', 'instagram', 'ig') THEN 'Paid Social'
    WHEN a.msclkid IS NOT NULL OR (a.source = 'bing' AND a.medium = 'cpc') THEN 'Paid Search (Bing)'
    WHEN a.medium = 'organic' OR a.source IN ('google', 'bing', 'duckduckgo', 'yahoo', 'ecosia') AND a.medium IS NULL THEN 'Organic Search'
    WHEN a.medium = 'email' OR a.source IN ('brevo', 'klaviyo') THEN 'Email'
    WHEN a.medium = 'referral' THEN 'Referral'
    WHEN a.source IS NULL AND a.medium IS NULL THEN 'Direct'
    ELSE 'Other'
  END AS channel,

  -- Landing context
  l.landing_page,
  l.landing_referrer,
  l.device_category,
  l.device_brand,
  l.browser,
  l.country,
  l.region,
  l.city
FROM events_agg  e
JOIN attribution a USING (user_pseudo_id, ga_session_id)
JOIN landing     l USING (user_pseudo_id, ga_session_id);
