import duckdb from 'duckdb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data root is one level up from app/
const DATA_ROOT = path.resolve(__dirname, '../../..');

let db: duckdb.Database | null = null;
let conn: duckdb.Connection | null = null;

export function getDataPath(relative: string): string {
  return path.join(DATA_ROOT, relative).replace(/\\/g, '/');
}

export async function getConnection(): Promise<duckdb.Connection> {
  if (conn) return conn;

  const dbPath = path.resolve(__dirname, '../../data/phonebot.db');
  db = new duckdb.Database(dbPath);
  conn = db.connect();

  // Enable progress bars and other settings
  await runQuery("INSTALL json; LOAD json;");
  await runQuery("INSTALL fts; LOAD fts;");

  return conn;
}

// DuckDB returns DATE/TIMESTAMP as JS Date and INTEGER aggregates as BigInt.
// Both blow up on the client: tickFormatter `.slice` on Date throws, recharts can't do arithmetic on BigInt.
// Normalise once at the boundary so every endpoint returns JSON-friendly primitives.
function normaliseValue(v: any): any {
  if (v === null || v === undefined) return v;
  if (typeof v === 'bigint') return Number(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.map(normaliseValue);
  if (typeof v === 'object') {
    const out: any = {};
    for (const k in v) out[k] = normaliseValue(v[k]);
    return out;
  }
  return v;
}

export function runQuery<T = any>(sql: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (!conn) {
      reject(new Error('DuckDB not initialized'));
      return;
    }
    conn.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(normaliseValue(rows) as T[]);
    });
  });
}

export async function initSchema(): Promise<void> {
  await getConnection();

  // CMS Web Orders - canonical full history with refunds
  await runQuery(`
    CREATE OR REPLACE TABLE fact_web_orders AS
    SELECT
      "Order ID"::INTEGER as order_id,
      Email,
      City,
      TRY_CAST("Postcode" AS INTEGER)::VARCHAR as postcode,
      State,
      Products,
      Brand,
      Condition,
      "Total Quantity"::INTEGER as total_quantity,
      TRY_CAST(REPLACE(REPLACE(Total, 'A$', ''), ',', '') AS DOUBLE) as total,
      TRY_CAST(REPLACE(REPLACE("Cost Price", 'A$', ''), ',', '') AS DOUBLE) as cost_price,
      TRY_CAST(REPLACE(REPLACE("Gross Profit", 'A$', ''), ',', '') AS DOUBLE) as gross_profit,
      GP_imputed as gp_imputed,
      "Date Added_parsed"::TIMESTAMP as order_date,
      "Payment Method" as payment_method,
      Platform,
      CASE WHEN was_refunded = 'True' THEN true ELSE false END as was_refunded,
      "__source_file" as source_file
    FROM read_csv_auto('${getDataPath('12_month/cms_manual/cms_orders_v4_with_refunds.csv')}', header=true, auto_detect=true)
  `);

  // Store Orders
  await runQuery(`
    CREATE OR REPLACE TABLE fact_store_orders AS
    SELECT
      "Order ID"::INTEGER as order_id,
      TRY_CAST("Postcode" AS INTEGER)::VARCHAR as postcode,
      Products,
      Category,
      "Total Quantity"::INTEGER as total_quantity,
      TRY_CAST(REPLACE(REPLACE(Total, 'A$', ''), ',', '') AS DOUBLE) as total,
      TRY_CAST(REPLACE(REPLACE("Cost Price", 'A$', ''), ',', '') AS DOUBLE) as cost_price,
      TRY_CAST(REPLACE(REPLACE("Gross Profit", 'A$', ''), ',', '') AS DOUBLE) as gross_profit,
      __date::TIMESTAMP as order_date,
      "Payment Method" as payment_method,
      Platform
    FROM read_csv_auto('${getDataPath('12_month/melbourne_store_sales/store_orders_full_history.csv')}', header=true, auto_detect=true)
  `);

  // Store Refunds
  await runQuery(`
    CREATE OR REPLACE TABLE fact_store_refunds AS
    SELECT
      "Order ID"::INTEGER as order_id,
      Email,
      Status,
      TRY_CAST(REPLACE(REPLACE(Total, 'A$', ''), ',', '') AS DOUBLE) as total,
      TRY_CAST(REPLACE(REPLACE("Gross Profit", 'A$', ''), ',', '') AS DOUBLE) as gross_profit,
      __date::TIMESTAMP as refund_date
    FROM read_csv_auto('${getDataPath('12_month/melbourne_store_sales/store_refunds_full_history.csv')}', header=true, auto_detect=true)
  `);

  // Google Ads daily
  await runQuery(`
    CREATE OR REPLACE TABLE fact_google_ads_daily AS
    SELECT
      Date::DATE as date,
      TRY_CAST(Cost AS DOUBLE) as cost,
      Clicks::INTEGER as clicks,
      TRY_CAST(Conversions AS DOUBLE) as conversions,
      TRY_CAST(AllConversions AS DOUBLE) as all_conversions,
      TRY_CAST(Conversionsvalue AS DOUBLE) as conversions_value,
      TRY_CAST(AllConversionsvalue AS DOUBLE) as all_conversions_value
    FROM read_csv_auto('${getDataPath('1_month/google_ads/account_daily_1m.csv')}', header=true, auto_detect=true)
  `);

  // Facebook Ads daily
  await runQuery(`
    CREATE OR REPLACE TABLE fact_facebook_ads_daily AS
    SELECT
      Date::DATE as date,
      TRY_CAST(Cost AS DOUBLE) as cost,
      Impressions::INTEGER as impressions,
      Clicks_all::INTEGER as clicks,
      Link_clicks::INTEGER as link_clicks,
      Purchases::INTEGER as purchases,
      TRY_CAST(Purchase_value AS DOUBLE) as purchase_value
    FROM read_csv_auto('${getDataPath('1_month/facebook_ads/account_daily_1m.csv')}', header=true, auto_detect=true)
  `);

  // Bing Ads daily
  await runQuery(`
    CREATE OR REPLACE TABLE fact_bing_ads_daily AS
    SELECT
      Date::DATE as date,
      "Campaign name" as campaign_name,
      TRY_CAST(Cost AS DOUBLE) as cost,
      Impressions::INTEGER as impressions,
      Clicks::INTEGER as clicks,
      TRY_CAST(CTR AS DOUBLE) as ctr,
      TRY_CAST(CPC AS DOUBLE) as cpc,
      TRY_CAST(Conversions AS DOUBLE) as conversions,
      TRY_CAST("All conversions" AS DOUBLE) as all_conversions,
      TRY_CAST(Revenue AS DOUBLE) as revenue,
      TRY_CAST("All revenue" AS DOUBLE) as all_revenue
    FROM read_csv_auto('${getDataPath('1_month/bing_ads/campaign_daily_1m.csv')}', header=true, auto_detect=true)
  `);

  // GA4 Channel Summary
  await runQuery(`
    CREATE OR REPLACE TABLE fact_ga4_channel AS
    SELECT
      Channel as channel,
      Sessions::INTEGER as sessions,
      "Total_users"::INTEGER as total_users,
      "New_users"::INTEGER as new_users,
      Purchases::INTEGER as purchases,
      TRY_CAST(Revenue AS DOUBLE) as revenue,
      "AddToCarts"::INTEGER as add_to_carts,
      Checkouts::INTEGER as checkouts
    FROM read_csv_auto('${getDataPath('1_month/ga4/channel_summary_30d_AU.csv')}', header=true, auto_detect=true)
  `);

  // Search Console daily
  await runQuery(`
    CREATE OR REPLACE TABLE fact_search_console_daily AS
    SELECT
      Date::DATE as date,
      Branded as branded,
      Clicks::INTEGER as clicks,
      Impressions::INTEGER as impressions,
      TRY_CAST(CTR AS DOUBLE) as ctr,
      TRY_CAST(Position AS DOUBLE) as position
    FROM read_csv_auto('${getDataPath('1_month/search_console/branded_daily_1m.csv')}', header=true, auto_detect=true)
  `);

  // GMB daily (filter AU only)
  await runQuery(`
    CREATE OR REPLACE TABLE fact_gmb_daily AS
    SELECT
      Date::DATE as date,
      "Location name" as location_name,
      "Total views"::INTEGER as total_views,
      "Views on Search"::INTEGER as views_on_search,
      "Views on Maps"::INTEGER as views_on_maps,
      "Total actions"::INTEGER as total_actions,
      "Website visits"::INTEGER as website_visits,
      "Phone calls"::INTEGER as phone_calls,
      "Directions requests"::INTEGER as directions_requests,
      Messages::INTEGER as messages
    FROM read_csv_auto('${getDataPath('1_month/gmb/locations_daily_1m.csv')}', header=true, auto_detect=true)
    WHERE "Location name" NOT LIKE '%Dubai%'
  `);

  // Brevo campaigns
  await runQuery(`
    CREATE OR REPLACE TABLE fact_brevo_campaigns AS
    SELECT
      Date::DATE as date,
      "Campaign name" as campaign_name,
      Subject,
      Recipients::INTEGER as recipients,
      Delivered::INTEGER as delivered,
      Opens_unique::INTEGER as opens_unique,
      Clicks_unique::INTEGER as clicks_unique,
      Unsubscribes::INTEGER as unsubscribes,
      Hard_bounces::INTEGER as hard_bounces,
      Soft_bounces::INTEGER as soft_bounces
    FROM read_csv_auto('${getDataPath('12_month/brevo/campaigns_12m.csv')}', header=true, auto_detect=true)
  `);

  // Google Ads Shopping — SKU-level performance (last 30d, all SKUs with cost > 0)
  await runQuery(`
    CREATE OR REPLACE TABLE fact_aw_shopping_sku AS
    SELECT
      "Campaign name" as campaign_name,
      "OfferId" as offer_id,
      "ProductTitle" as title,
      "Brand" as brand,
      TRY_CAST(Cost AS DOUBLE) as cost,
      TRY_CAST(Clicks AS INTEGER) as clicks,
      TRY_CAST(Impressions AS INTEGER) as impressions,
      TRY_CAST(Conversions AS DOUBLE) as conversions,
      TRY_CAST(ConversionValue AS DOUBLE) as conversion_value
    FROM read_csv_auto('${getDataPath('1_month/google_ads/shopping_sku_30d.csv')}', header=true, auto_detect=true)
  `);

  // Last 7 days SKU performance — for "act now" recommendations vs the 30d strategic view
  await runQuery(`
    CREATE OR REPLACE TABLE fact_aw_shopping_sku_7d AS
    SELECT
      "Campaign name" as campaign_name,
      "OfferId" as offer_id,
      "ProductTitle" as title,
      "Brand" as brand,
      TRY_CAST(Cost AS DOUBLE) as cost,
      TRY_CAST(Clicks AS INTEGER) as clicks,
      TRY_CAST(Impressions AS INTEGER) as impressions,
      TRY_CAST(Conversions AS DOUBLE) as conversions,
      TRY_CAST(ConversionValue AS DOUBLE) as conversion_value
    FROM read_csv_auto('${getDataPath('1_month/google_ads/shopping_sku_7d.csv')}', header=true, auto_detect=true)
  `);

  // Google Merchant Center — product catalog snapshot (1,494 SKUs Apr 2026)
  // Validates the "PMax spend follows stock availability" hypothesis.
  await runQuery(`
    CREATE OR REPLACE TABLE fact_gmc_products AS
    SELECT
      snapshot_date::DATE as snapshot_date,
      Brand as brand,
      Availability as availability,
      TRY_CAST(Price AS DOUBLE) as price,
      Currency as currency
    FROM read_csv_auto('${getDataPath('1_month/google_merchant_center/products_snapshot.csv')}', header=true, auto_detect=true)
  `);

  // ProfitMetrics channel GP
  await runQuery(`
    CREATE OR REPLACE TABLE fact_pm_channel_gp AS
    SELECT
      Channel as channel,
      Sessions::INTEGER as sessions,
      Purchases::INTEGER as purchases,
      TRY_CAST(GP AS DOUBLE) as gp
    FROM read_csv_auto('${getDataPath('1_month/profit_metrics/channel_gp_30d.csv')}', header=true, auto_detect=true)
  `);

  // ProfitMetrics channel revenue
  await runQuery(`
    CREATE OR REPLACE TABLE fact_pm_channel_revenue AS
    SELECT
      Channel as channel,
      Sessions::INTEGER as sessions,
      Purchases::INTEGER as purchases,
      TRY_CAST(Revenue AS DOUBLE) as revenue
    FROM read_csv_auto('${getDataPath('1_month/profit_metrics/channel_revenue_30d.csv')}', header=true, auto_detect=true)
  `);

  // CMS daily aggregate
  await runQuery(`
    CREATE OR REPLACE TABLE agg_cms_daily AS
    SELECT
      Date::DATE as date,
      orders::INTEGER as orders,
      revenue::DOUBLE as revenue,
      gp::DOUBLE as gp
    FROM read_csv_auto('${getDataPath('12_month/cms_manual/cms_daily_full_history.csv')}', header=true, auto_detect=true)
  `);

  // Store daily aggregate
  await runQuery(`
    CREATE OR REPLACE TABLE agg_store_daily AS
    SELECT
      Date::DATE as date,
      orders::INTEGER as orders,
      rev::DOUBLE as revenue,
      gp::DOUBLE as gp
    FROM read_csv_auto('${getDataPath('12_month/melbourne_store_sales/store_daily.csv')}', header=true, auto_detect=true)
  `);

  // Combined web+store monthly
  await runQuery(`
    CREATE OR REPLACE TABLE agg_combined_monthly AS
    SELECT
      __ym as month,
      web_orders::INTEGER as web_orders,
      web_rev::DOUBLE as web_revenue,
      store_orders::INTEGER as store_orders,
      store_rev::DOUBLE as store_revenue
    FROM read_csv_auto('${getDataPath('12_month/cms_manual/combined_web_store_monthly.csv')}', header=true, auto_detect=true)
  `);

  // === Profit Ops tables (added 2026-04 for branded cannibalization, MMM, anomaly detection) ===

  // 3m daily ad spend per platform — needed for MMM and anomaly detection trend baselines
  await runQuery(`
    CREATE OR REPLACE TABLE fact_google_ads_daily_3m AS
    SELECT
      Date::DATE as date,
      TRY_CAST(Cost AS DOUBLE) as cost,
      TRY_CAST(Conversions AS DOUBLE) as conversions,
      TRY_CAST(Conversionsvalue AS DOUBLE) as conversions_value
    FROM read_csv_auto('${getDataPath('3_month/google_ads/account_daily_3m.csv')}', header=true, auto_detect=true)
  `);

  await runQuery(`
    CREATE OR REPLACE TABLE fact_facebook_ads_daily_3m AS
    SELECT
      Date::DATE as date,
      TRY_CAST(Cost AS DOUBLE) as cost,
      TRY_CAST(Website_purchases AS INTEGER) as purchases,
      TRY_CAST(Purchase_value AS DOUBLE) as purchase_value
    FROM read_csv_auto('${getDataPath('3_month/facebook_ads/account_daily_3m.csv')}', header=true, auto_detect=true)
  `);

  await runQuery(`
    CREATE OR REPLACE TABLE fact_bing_ads_daily_3m AS
    SELECT
      Date::DATE as date,
      TRY_CAST(Spend AS DOUBLE) as cost,
      TRY_CAST(Conversions AS DOUBLE) as conversions,
      TRY_CAST(Revenue AS DOUBLE) as revenue
    FROM read_csv_auto('${getDataPath('3_month/bing_ads/account_daily_3m.csv')}', header=true, auto_detect=true)
  `);

  // ProfitMetrics campaign × source/medium GP (for branded vs non-branded paid attribution)
  await runQuery(`
    CREATE OR REPLACE TABLE fact_pm_campaign_gp AS
    SELECT
      Source_medium as source_medium,
      Campaign as campaign,
      Sessions::INTEGER as sessions,
      Purchases::INTEGER as purchases,
      TRY_CAST(GP AS DOUBLE) as gp
    FROM read_csv_auto('${getDataPath('1_month/profit_metrics/campaign_x_sourcemedium_gp_30d.csv')}', header=true, auto_detect=true)
  `);

  await runQuery(`
    CREATE OR REPLACE TABLE fact_pm_campaign_revenue AS
    SELECT
      Source_medium as source_medium,
      Campaign as campaign,
      Sessions::INTEGER as sessions,
      Purchases::INTEGER as purchases,
      TRY_CAST(Revenue AS DOUBLE) as revenue
    FROM read_csv_auto('${getDataPath('1_month/profit_metrics/campaign_x_sourcemedium_revenue_30d.csv')}', header=true, auto_detect=true)
  `);

  // GA4 campaign × source/medium 30d
  // Explicit delim/quote because some campaign names contain quoted commas which auto-detect mishandles.
  await runQuery(`
    CREATE OR REPLACE TABLE fact_ga4_campaign AS
    SELECT
      Source_medium as source_medium,
      Campaign as campaign,
      TRY_CAST(Sessions AS INTEGER) as sessions,
      TRY_CAST(Purchases AS INTEGER) as purchases,
      TRY_CAST(Revenue AS DOUBLE) as revenue
    FROM read_csv('${getDataPath('1_month/ga4/campaign_x_sourcemedium_30d_AU.csv')}', header=true, delim=',', quote='"', escape='"', columns={'Source_medium':'VARCHAR','Campaign':'VARCHAR','Sessions':'VARCHAR','Purchases':'VARCHAR','Revenue':'VARCHAR'})
  `);

  // Search Console top queries (24d window) — for branded query-level analysis
  await runQuery(`
    CREATE OR REPLACE TABLE fact_sc_top_queries AS
    SELECT
      query,
      branded,
      clicks_24d::INTEGER as clicks,
      impressions::INTEGER as impressions,
      TRY_CAST(position AS DOUBLE) as position
    FROM read_csv_auto('${getDataPath('12_month/search_console/gw_top_queries_apr2026.csv')}', header=true, auto_detect=true)
  `);

  // GMC product catalog with offer_id (Item ID) — fetched via Supermetrics MCP 2026-04-29.
  // Each product has 2 rows in the source CSV (online + local channel); dedupe on item_id.
  await runQuery(`
    CREATE OR REPLACE TABLE fact_gmc_products_full AS
    SELECT
      "Item ID"::VARCHAR as offer_id,
      "Title" as title,
      LOWER("Brand") as brand,
      "Condition" as condition,
      "Availability" as availability,
      TRY_CAST("Price" AS DOUBLE) as price,
      "Currency" as currency,
      "Product type" as product_type,
      "Custom label 0" as custom_label_0,
      "Custom label 1" as custom_label_1,
      "Channel" as channel,
      "Product link" as product_link,
      ROW_NUMBER() OVER (PARTITION BY "Item ID" ORDER BY CASE WHEN "Channel" = 'online' THEN 0 ELSE 1 END) as rn
    FROM read_csv_auto('${getDataPath('1_month/google_merchant_center/products_full_with_offer_id.csv')}', header=true, auto_detect=true)
  `);
  // Pick one row per offer_id (prefer online channel, since that's what Shopping ads serve from)
  await runQuery(`
    CREATE OR REPLACE TABLE fact_gmc_products_unique AS
    SELECT * EXCLUDE rn FROM fact_gmc_products_full WHERE rn = 1
  `);

  // Google Ads search terms 30d — fetched via Supermetrics MCP 2026-04-29.
  // Branded vs non-branded classification using brand_keywords = "phonebot|phone bot|phonebot.com.au"
  await runQuery(`
    CREATE OR REPLACE TABLE fact_aw_search_terms AS
    SELECT
      "Matched search term" as search_term,
      "Campaign name" as campaign_name,
      "Ad group name" as ad_group_name,
      "Branded vs. non-branded search queries" as branded,
      TRY_CAST(Cost AS DOUBLE) as cost,
      TRY_CAST(Clicks AS INTEGER) as clicks,
      TRY_CAST(Impressions AS INTEGER) as impressions,
      TRY_CAST(Conversions AS DOUBLE) as conversions,
      TRY_CAST("Total conversion value" AS DOUBLE) as conversion_value
    FROM read_csv_auto('${getDataPath('1_month/google_ads/search_terms_30d.csv')}', header=true, auto_detect=true)
  `);

  // Per-brand margin% from web orders — used to estimate SKU GP from Shopping conversion_value
  await runQuery(`
    CREATE OR REPLACE TABLE agg_brand_margin AS
    SELECT
      LOWER(COALESCE(Brand, 'unknown')) as brand,
      COUNT(*)::INTEGER as orders,
      SUM(total)::DOUBLE as revenue,
      SUM(gp_imputed)::DOUBLE as gp,
      CASE WHEN SUM(total) > 0 THEN SUM(gp_imputed) / SUM(total) ELSE NULL END as margin_pct
    FROM fact_web_orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '180 days'
      AND total > 0
      AND NOT was_refunded
    GROUP BY brand
    HAVING orders >= 10
  `);

  console.log('DuckDB schema initialized successfully');
}
