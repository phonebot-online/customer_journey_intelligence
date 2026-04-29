-- Flattened GA4 events views for Supermetrics + dashboard consumption.
-- Hoists the most-used event_params keys (gclid/fbclid/utm/page/transaction)
-- to top-level columns so downstream tools don't have to UNNEST.
--
-- View names use vw_ prefix so they DON'T match the events_* wildcard pattern
-- (BigQuery refuses to wildcard-match views, which would break re-running this script).
--
-- Run in BigQuery SQL editor (project bigquery-api-494711). Re-run anytime.

-- Drop previously-created `events_flat` if it exists (from earlier run)
DROP VIEW IF EXISTS `bigquery-api-494711.analytics_284223207.events_flat`;
DROP VIEW IF EXISTS `bigquery-api-494711.analytics_284223207.events_items_flat`;

-- ────────────────────────────────────────────────────────────────────
-- vw_events_flat: one row per GA4 event, flat columns
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW `bigquery-api-494711.analytics_284223207.vw_events_flat` AS
SELECT
  -- ── Time ──────────────────────────────────────────────────────────
  PARSE_DATE('%Y%m%d', event_date)       AS event_date,
  TIMESTAMP_MICROS(event_timestamp)      AS event_timestamp_utc,
  event_name,

  -- ── User ──────────────────────────────────────────────────────────
  user_id,
  user_pseudo_id,
  user_first_touch_timestamp,

  -- ── Session ──────────────────────────────────────────────────────
  (SELECT value.int_value    FROM UNNEST(event_params) WHERE key = 'ga_session_id')      AS ga_session_id,
  (SELECT value.int_value    FROM UNNEST(event_params) WHERE key = 'ga_session_number')  AS ga_session_number,
  (SELECT value.int_value    FROM UNNEST(event_params) WHERE key = 'engagement_time_msec') AS engagement_time_msec,
  (SELECT value.int_value    FROM UNNEST(event_params) WHERE key = 'session_engaged')    AS session_engaged,

  -- ── Page ─────────────────────────────────────────────────────────
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location')      AS page_location,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title')         AS page_title,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_referrer')      AS page_referrer,

  -- ── UTM (per-event) ──────────────────────────────────────────────
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'source')             AS event_source,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'medium')             AS event_medium,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'campaign')           AS event_campaign,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'term')               AS event_term,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'content')            AS event_content,

  -- ── Click IDs (this is the prize — closes attribution gap) ───────
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'gclid')              AS gclid_param,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'fbclid')             AS fbclid_param,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'msclkid')            AS msclkid_param,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'dclid')              AS dclid_param,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'srsltid')            AS srsltid_param,

  -- Fallback: extract click IDs from page_location querystring
  REGEXP_EXTRACT(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
    r'[?&]gclid=([^&]+)'
  ) AS gclid_from_url,
  REGEXP_EXTRACT(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
    r'[?&]fbclid=([^&]+)'
  ) AS fbclid_from_url,
  REGEXP_EXTRACT(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
    r'[?&]msclkid=([^&]+)'
  ) AS msclkid_from_url,

  -- ── First-touch (user-level, set on first visit) ─────────────────
  traffic_source.source                  AS first_touch_source,
  traffic_source.medium                  AS first_touch_medium,
  traffic_source.name                    AS first_touch_campaign,

  -- ── Last-touch (session-level, GA4 collected_traffic_source) ─────
  collected_traffic_source.manual_source         AS session_source,
  collected_traffic_source.manual_medium         AS session_medium,
  collected_traffic_source.manual_campaign_name  AS session_campaign,
  collected_traffic_source.manual_term           AS session_term,
  collected_traffic_source.manual_content        AS session_content,
  collected_traffic_source.gclid                 AS session_gclid,
  collected_traffic_source.dclid                 AS session_dclid,
  collected_traffic_source.srsltid               AS session_srsltid,

  -- ── Ecommerce (purchase / refund) ────────────────────────────────
  ecommerce.transaction_id               AS transaction_id,
  ecommerce.purchase_revenue             AS purchase_revenue,
  ecommerce.purchase_revenue_in_usd      AS purchase_revenue_usd,
  ecommerce.refund_value                 AS refund_value,
  ecommerce.shipping_value               AS shipping_value,
  ecommerce.tax_value                    AS tax_value,
  ecommerce.unique_items                 AS unique_items,
  ecommerce.total_item_quantity          AS total_item_quantity,

  event_value_in_usd,
  (SELECT value.double_value FROM UNNEST(event_params) WHERE key = 'value')              AS event_value,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'currency')           AS event_currency,

  -- ── Device ───────────────────────────────────────────────────────
  device.category                        AS device_category,
  device.mobile_brand_name               AS device_brand,
  device.mobile_model_name               AS device_model,
  device.operating_system                AS device_os,
  device.operating_system_version        AS device_os_version,
  device.web_info.browser                AS browser,
  device.web_info.browser_version        AS browser_version,
  device.language                        AS device_language,

  -- ── Geo ──────────────────────────────────────────────────────────
  geo.country                            AS country,
  geo.region                             AS region,
  geo.city                               AS city,
  geo.metro                              AS metro,
  geo.continent                          AS continent,

  -- ── Stream / platform ────────────────────────────────────────────
  stream_id,
  platform,

  -- ── Items array kept intact for the items_flat view ──────────────
  items
FROM `bigquery-api-494711.analytics_284223207.events_*`
WHERE _TABLE_SUFFIX NOT LIKE 'intraday_%';

-- ────────────────────────────────────────────────────────────────────
-- vw_events_items_flat: one row per LINE ITEM on a purchase event.
-- Use this for SKU-level analysis (revenue/quantity by item_id, brand, etc).
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW `bigquery-api-494711.analytics_284223207.vw_events_items_flat` AS
SELECT
  PARSE_DATE('%Y%m%d', event_date)       AS event_date,
  TIMESTAMP_MICROS(event_timestamp)      AS event_timestamp_utc,
  event_name,
  user_pseudo_id,
  ecommerce.transaction_id               AS transaction_id,

  item.item_id,
  item.item_name,
  item.item_brand,
  item.item_category,
  item.item_category2,
  item.item_category3,
  item.item_variant,
  item.price,
  item.price_in_usd,
  item.quantity,
  item.item_revenue,
  item.item_revenue_in_usd,
  item.item_refund,
  item.coupon,
  item.affiliation,
  item.location_id,
  item.item_list_id,
  item.item_list_name,
  item.item_list_index,
  item.promotion_id,
  item.promotion_name,
  item.creative_name,
  item.creative_slot
FROM `bigquery-api-494711.analytics_284223207.events_*`,
  UNNEST(items) AS item
WHERE _TABLE_SUFFIX NOT LIKE 'intraday_%'
  AND event_name = 'purchase';
