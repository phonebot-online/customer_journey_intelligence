# File Inventory — Phonebot Marketing Dashboard

> Generated: 2026-04-25
> Source root: `customer_journey_intelligence/`

---

## CMS Web Orders (Commercial Truth)

| File | Window | Rows | Columns | Key Fields | Caveats |
|------|--------|------|---------|------------|---------|
| `12_month/cms_manual/cms_orders_v4_with_refunds.csv` | Full history (Mar 2025–Apr 2026) | 17,659 | 20 | Order ID, Email, City, Postcode, State, Products, Brand, Condition, Total, Cost Price, Gross Profit, GP_imputed, Date Added, Payment Method, Platform, was_refunded | **Canonical web orders file.** 709 orders have imputed GP (GP_imputed column is the canonical GP figure). 50 Villawood fraud orders excluded. Jul–Nov 2025 gap in history. |
| `12_month/cms_manual/cms_orders_v4_clean.csv` | 12m | 15,684 | ~15 | Same as above (clean subset) | Excludes GP=0 outliers |
| `12_month/cms_manual/cms_orders_v3_full_history.csv` | Full history | — | — | Earlier version | Superseded by v4 |
| `12_month/cms_manual/cms_daily_full_history.csv` | Full history | ~420 | 3 | Date, orders, revenue, gp | Daily aggregate for fast trend queries |
| `12_month/cms_manual/cms_monthly_summary_net.csv` | 12m | 14 | ~6 | Month, orders, gross_rev, refunds, net_rev | Net of refunds |
| `12_month/cms_manual/combined_web_store_monthly.csv` | 12m | 14 | ~8 | Month, web_orders, web_rev, store_orders, store_rev | Combined monthly view |
| `12_month/cms_manual/cms_refunds_parsed.csv` | Full history | 1,155 | ~6 | Order ID, Date, Total, GP | Web refund records |
| `1_month/cms_manual/cms_orders_v4_clean.csv` | 1m | 763 | ~15 | Same as 12m | 30-day subset |
| `3_month/cms_manual/cms_orders_v4_clean.csv` | 3m | 2,700 | ~15 | Same as 12m | 90-day subset |
| `6_month/cms_manual/cms_orders_v4_clean.csv` | 6m | 6,875 | ~15 | Same as 12m | 180-day subset (partial — Nov 2025 missing) |

**Decision:** Use `cms_orders_v4_with_refunds.csv` as the canonical web orders source. The `_clean` files are subsets for specific windows; the full-history file contains all windows.

---

## Store POS Orders

| File | Window | Rows | Columns | Key Fields | Caveats |
|------|--------|------|---------|------------|---------|
| `12_month/melbourne_store_sales/store_orders_full_history.csv` | Full history | 4,522 | 15 | Order ID, Postcode, Products, Category, Total Quantity, Total, Cost Price, Gross Profit, Date Added, Payment Method, Platform | **Canonical store orders.** No Email column. 0 Order ID overlap with web. Category extracted from Products text (Device/Repair/Accessory/Other). Accessory/repair GP is upper bound (Cost Price not tracked for many SKUs). |
| `12_month/melbourne_store_sales/store_daily.csv` | Full history | ~413 | 3 | Date, orders, rev, gp | Daily aggregate |
| `12_month/melbourne_store_sales/store_monthly_summary.csv` | 12m | 14 | ~6 | Month, orders, gross_rev, refunds, net_rev | Net of refunds |
| `12_month/melbourne_store_sales/store_refunds_full_history.csv` | Full history | 187 | ~8 | Order ID, Email, Status, Total, GP | **Order IDs do NOT match store_orders.** Treat as aggregate adjustment only. ~50% have `walkin_customer@phonebot.com.au` placeholder email. |
| `1_month/melbourne_store_sales/store_orders_clean.csv` | 1m | ~300 | 15 | Same as full | 30-day subset |
| `3_month/melbourne_store_sales/store_orders_clean.csv` | 3m | ~900 | 15 | Same as full | 90-day subset |
| `6_month/melbourne_store_sales/store_orders_clean.csv` | 6m | ~2,200 | 15 | Same as full | 180-day subset |

**Decision:** Use `store_orders_full_history.csv` + `store_refunds_full_history.csv` as canonical store sources. Aggregate refunds; do not attempt order-level join.

---

## Google Ads (AW)

| File | Window | Rows | Columns | Key Fields | Caveats |
|------|--------|------|---------|------------|---------|
| `1_month/google_ads/account_daily_1m.csv` | 1m | 30 | 7 | Date, Cost, Clicks, Conversions, AllConversions, Conversionsvalue, AllConversionsvalue | Account-level daily. Cost in AUD. `Conversionsvalue` = conversion value (likely includes view-through). `AllConversionsvalue` includes all conversion actions. |
| `1_month/google_ads/campaign_summary_30d.csv` | 1m | ~50 | ~12 | Campaign, Cost, Clicks, Conversions, ConvValue | Campaign-level aggregate |

**Decision:** Use `account_daily_1m.csv` for daily spend trend. 3m/6m/12m files are "save pending" per `step2_landed_summary.md` — only 1m is confirmed on disk.

---

## Facebook Ads (FA)

| File | Window | Rows | Columns | Key Fields | Caveats |
|------|--------|------|---------|------------|---------|
| `1_month/facebook_ads/account_daily_1m.csv` | 1m | 30 | 7 | Date, Cost, Impressions, Clicks_all, Link_clicks, Purchases, Purchase_value | Account-level daily. `act_14359173` Phonebot only (personal account `act_1141970792623135` EXCLUDED). |
| `1_month/facebook_ads/campaign_summary_30d_act14359173.csv` | 1m | 5 | ~12 | Campaign, Cost, Impressions, Clicks, Purchases, Purchase_value | Campaign-level |
| `1_month/facebook_ads/placement_summary_30d_act14359173.csv` | 1m | 56 | ~10 | Placement, Cost, Impressions, Clicks, Purchases | Placement-level (FB vs IG vs Audience Network) |

**Decision:** Use `account_daily_1m.csv` for daily spend. Platform-reported Purchases/Purchase_value are heavily over-attributed (65× per triangulation). Use for spend/impressions/CTR truth only; surface conversions with explicit caveat.

---

## Bing Ads (AC)

| File | Window | Rows | Columns | Key Fields | Caveats |
|------|--------|------|---------|------------|---------|
| `1_month/bing_ads/campaign_daily_1m.csv` | 1m | ~120 | 12 | Date, Campaign name, Currency code, Cost, Impressions, Clicks, CTR, CPC, Conversions, All conversions, Revenue, All revenue | Campaign-level daily. Small footprint (~A$1,700/month). |
| `1_month/bing_ads/campaign_summary_30d.csv` | 1m | 4 | ~12 | Campaign, Cost, Impressions, Clicks, Conversions, Revenue | Campaign aggregate |

**Decision:** Use `campaign_daily_1m.csv`. Aggregate to account daily for consistency with AW/FA.

---

## GA4 Main AU (284223207)

| File | Window | Rows | Columns | Key Fields | Caveats |
|------|--------|------|---------|------------|---------|
| `1_month/ga4/channel_summary_30d_AU.csv` | 1m | ~11 | 8 | Channel, Sessions, Total_users, New_users, Purchases, Revenue, AddToCarts, Checkouts | Channel-level 30-day aggregate. "Cross-network" = Google PMax. "Paid Search" = Google + Bing (can't isolate Bing). |
| `1_month/ga4/campaign_x_sourcemedium_30d_AU.csv` | 1m | ~50 | ~10 | Campaign, Source, Medium, Sessions, Purchases, Revenue | Campaign × source/medium drill |

**Decision:** Use `channel_summary_30d_AU.csv` for channel mix. GA4 purchase revenue undercounts CMS by ~20% (server-side/bot filter). Use for session/funnel metrics, not revenue truth.

---

## ProfitMetrics (via GA4 properties)

| File | Window | Rows | Columns | Key Fields | Caveats |
|------|--------|------|---------|------------|---------|
| `1_month/profit_metrics/channel_gp_30d.csv` | 1m | ~10 | 3 | Channel, Sessions, Purchases, GP | **Canonical net contribution per channel.** Reconciles to CMS within 6%. |
| `1_month/profit_metrics/channel_revenue_30d.csv` | 1m | ~10 | 3 | Channel, Sessions, Purchases, Revenue | Revenue by channel per ProfitMetrics |
| `1_month/profit_metrics/campaign_x_sourcemedium_gp_30d.csv` | 1m | ~50 | ~6 | Campaign, Source, Medium, Sessions, Purchases, GP | Campaign-level GP |
| `1_month/profit_metrics/campaign_x_sourcemedium_revenue_30d.csv` | 1m | ~50 | ~6 | Campaign, Source, Medium, Sessions, Purchases, Revenue | Campaign-level revenue |

**Decision:** Use `channel_gp_30d.csv` and `channel_revenue_30d.csv` as the canonical channel-level profit/revenue source for the 1m window. 3m/6m/12m files are pending.

---

## Search Console (GW)

| File | Window | Rows | Columns | Key Fields | Caveats |
|------|--------|------|---------|------------|---------|
| `1_month/search_console/branded_daily_1m.csv` | 1m | 90 | 6 | Date, Branded, Clicks, Impressions, CTR, Position | 90 rows = 30 days × 2 (branded + unknown). |
| `12_month/search_console/branded_weekly_12m.csv` | 12m | 53 | 6 | Week, Branded, Clicks, Impressions, CTR, Position | Weekly aggregate. 53 weeks. Aggregate position improved; query-level not available. |

**Decision:** Use `branded_daily_1m.csv` for daily organic metrics. Use `branded_weekly_12m.csv` for long-term trend.

---

## GMB (Google My Business)

| File | Window | Rows | Columns | Key Fields | Caveats |
|------|--------|------|---------|------------|---------|
| `1_month/gmb/locations_daily_1m.csv` | 1m | 60 | 11 | Date, Location name, Location ID, Total views, Views on Search, Views on Maps, Total actions, Website visits, Phone calls, Directions requests, Messages | 2 locations: Phonebot AU + BurJuman Mall Dubai. **Filter to AU only** (Dubai is AE, out of scope). |

**Decision:** Use `locations_daily_1m.csv`, filter to `Location name = "Phonebot"` (AU only). 6m/12m files are "save pending".

---

## Brevo (SIB)

| File | Window | Rows | Columns | Key Fields | Caveats |
|------|--------|------|---------|------------|---------|
| `1_month/brevo/campaigns_1m.csv` | 1m | 3 | 14 | Date, Campaign name, Subject, Sender name, Recipients, Delivered, Opens_unique, Opens_total, Clicks_unique, Clicks_total, Click_to_open_rate, Soft_bounces, Hard_bounces, Unsubscribes | 3 campaigns in last 30d. |
| `6_month/brevo/campaigns_6m.csv` | 6m | 33 | 14 | Same as above | 33 campaigns. |
| `12_month/brevo/campaigns_12m.csv` | 12m | 33 | 14 | Same as above | Full history (Brevo only since 2025-10-27). |
| `12_month/brevo/brevo_monthly_summary.csv` | 12m | 7 | ~10 | Month, campaigns, sends, opens, clicks | Monthly aggregate |

**Decision:** Use `campaigns_12m.csv` for full history. No revenue attached — use GA4 Email channel or CMS same-day inference for revenue attribution.

---

## Cross-Check Files (Pre-computed)

| File | Rows | Columns | Purpose |
|------|------|---------|---------|
| `cross_checks/MASTER_daily_1m.csv` | ~30 | ~25 | Daily cube: CMS orders/rev/GP + AW spend/conv + FA spend/purchases + Bing + GMB + SC |
| `cross_checks/daily_cross_source_1m.csv` | ~30 | ~20 | Alternate daily merge |
| `cross_checks/daily_paid_vs_cms_1m.csv` | ~30 | ~12 | Paid vs CMS daily |
| `cross_checks/campaign_triangulation_30d.csv` | ~10 | ~15 | Campaign-level triangulation |

**Decision:** Use as validation reference, not as primary source. Build from raw files independently.

---

## QA / Reference Files

| File | Purpose |
|------|---------|
| `qa_checks/cms_fraud_excluded_villawood.csv` | 50 excluded fraud orders |
| `qa_checks/cms_gp_zero_orders_to_review.csv` | 709 orders with imputed GP |
| `qa_checks/cms_margin_lookup_by_brand_condition.csv` | Brand×condition median margins used for imputation |
| `qa_checks/cms_gp_zero_with_calculated_gp_options.csv` | GP imputation options comparison |

---

## Gaps & Pending Files

| Gap | Impact | Status |
|-----|--------|--------|
| AW 3m/6m/12m daily | Can't show paid trend beyond 30d for AW | Save pending |
| FA 6m/12m daily | Can't show FB trend beyond 30d | Save pending |
| AC 3m/6m/12m daily | Bing is small; 1m is sufficient for now | Save pending |
| GA4 3m/6m/12m channel summary | Funnel/journey beyond 30d limited | Save pending |
| ProfitMetrics 3m/6m/12m | Net contribution beyond 30d unavailable | Save pending |
| GMB 3m/6m/12m | Local trend beyond 30d unavailable | Save pending |
| CMS Jul–Nov 2025 | 6m/12m YoY comparisons are partial | Missing in source export |
