# Canonical Metric Definitions — Phonebot Customer Journey Intelligence
**As-of:** 2026-04-25
**Purpose:** Resolve cross-source semantic differences. When two sources both report "Revenue" or "Conversions", the values diverge wildly. This doc defines what each truly measures.

## Revenue / Sales

| Metric name | Definition | Source | Trust |
|---|---|---|---|
| **CMS web revenue** | Sum of `Total` field on web order rows (excludes Villawood fraud) | `cms_orders_v4_with_refunds.csv` | **TRUTH** ✓ |
| **CMS web net revenue** | CMS web revenue minus refund rev | computed | TRUTH ✓ |
| **CMS store revenue** | Sum of `Total` on store order rows | `store_orders_full_history.csv` | **TRUTH** for online store sales ✓ |
| CMS store net revenue | Store revenue minus separate refund file aggregate | computed | TRUTH ✓ |
| **Combined web+store gross** | Sum of CMS web + CMS store | `combined_web_store_monthly.csv` | TRUTH (use this for "business YoY") |
| AW platform revenue | `Conversionsvalue` from AW | Supermetrics AW | INFLATED 5-7× vs PM-attributed |
| AW all-conv value | `AllConversionsvalue` | AW | INFLATED — incl view-through + store-visit. Don't use for ROAS comparisons. |
| FA platform revenue | `offsite_conversion_value_fb_pixel_purchase` | FA | EXTREMELY INFLATED 65-238× vs PM-attributed |
| Bing platform revenue | `Revenue` | AC | Less inflated; small footprint |
| **GA4 last-click revenue** | `totalRevenue` for GAWA `284223207` AU | GA4 main | Captures ~80% of CMS truth (under-tracks server-side) |
| **PM revenue** | `totalRevenue` for GAWA `488590631` | PM Rev property | ~101% of CMS — **closest to truth** ✓ |
| **PM GP** | `totalRevenue` field on GAWA `488618020` (note: misnamed — actually GP) | PM GP property | **CANONICAL GP attribution** — within 6% of CMS imputed GP ✓ |

## Gross Profit

| Metric name | Definition | Notes |
|---|---|---|
| **CMS imputed GP** | Sum of `GP_imputed` on web orders (Method B imputation for GP=0 outliers) | TRUTH for web ✓ |
| **CMS raw GP** | Sum of `Gross Profit` raw — without imputation | Underestimates by ~5-6% (GP=0 outliers) |
| **PM GP attributed to channel** | `totalRevenue` field on GAWA `488618020` per channel | TRUTH-equivalent for paid attribution ✓ |
| Store GP raw | Sum of store `Gross Profit` | UPPER BOUND — accessory/repair Cost Price=0 inflates margin to 78-91% |
| Combined business GP | Web imputed GP + Store GP raw | Use the upper-bound on store side cautiously |

## Conversions

| Metric name | Definition | Caveats |
|---|---|---|
| **CMS web orders** | Order count in CMS file | TRUTH ✓ — minus 50 Villawood fraud |
| **CMS store orders** | Order count in store file | TRUTH ✓ |
| AW Conversions | `Conversions` (data-driven, can be fractional) | Last-click model |
| AW AllConversions | Includes view-through + store-visit | 5× higher than Conversions typically |
| FA Website purchases | `offsite_conversions_fb_pixel_purchase` | Massively inflated vs CMS truth |
| Bing Conversions | Standard | OK at small scale |
| **GA4 ecommercePurchases** | Last-click pixel-fired purchases | Captures ~80% of CMS |
| **PM Purchases** | `ecommercePurchases` on PM properties | ~106% of CMS web (includes some store/server-side) |

## ROAS (Return on Ad Spend) — at the channel level

| Definition | Formula | Use case |
|---|---|---|
| **Platform-claimed ROAS** | platform revenue / spend | Misleading — over-attributes 1.4-238× |
| **GA4 last-click ROAS** | GA4 channel revenue / spend | Better but still over-attributes for AW (5-7×) |
| **PM-attributed ROAS** | PM revenue per channel / spend | Best paid-attribution measure ✓ |
| **PM-GP ROAS (real GP/spend)** | PM GP per channel / spend | **CANONICAL** for "is this campaign profitable?" ✓ |
| Net profit | PM GP per channel - spend | Decision-grade "is it earning more than it costs" |

## Refund rate

| Metric | Formula | Current (full 14m) |
|---|---|---|
| **Web refund rate (count)** | refunded orders / total orders | 6.52% |
| **Web refund rate (revenue)** | refunded revenue / gross revenue | 5.66% |
| **Web refund rate (GP)** | imputed GP refunded / total imputed GP | 5.67% |
| **Store refund rate** | store refund file revenue / store gross revenue | 14.4% (cannot link to specific orders) |
| **Combined refund rate (revenue)** | combined refunds / combined gross revenue | 7.71% |

## Channel mapping table — semantic alignment

| Source channel | Maps to AW campaigns | Maps to FA campaigns | Maps to Bing campaigns |
|---|---|---|---|
| `Cross-network` (GA4) | All PMax campaigns (CJ - PMax (Apple), CJ - PMax (Samsung), etc.) | — | — |
| `Paid Search` (GA4) | Search campaigns (CJ - Refurbished Phones, brand campaigns) | — | All Bing campaigns lumped here |
| `Paid Shopping` (GA4) | Standard Shopping campaigns | — | Sometimes Bing Shopping lumped here |
| `Paid Social` (GA4) | — | All FA campaigns (when utm-tagged correctly) | — |
| `Organic Search` (GA4) | — | — | — (Search Console) |
| `Direct` (GA4) | (could include any channel where utm broken) | (likely includes much FA where pixel broken) | |

**Key assumption flagged in QA:** GA4 lumps Bing's CPC traffic into "Paid Search" alongside Google. Cannot separate Bing-specific contribution from GA4 channel-level data. To isolate, use sessionSourceMedium = "bing / cpc".

## Time / window definitions

| Window | Definition | Anchor |
|---|---|---|
| 1m | last 30 days | 2026-04-24 (most recent CMS date) |
| 3m | last 90 days | 2026-04-24 |
| 6m | last 180 days | 2026-04-24 |
| 12m | last 365 days | 2026-04-24 |
| Full history | All available CMS | 2025-03-01 → 2026-04-24 (420 days) |

All windows are ROLLING N-day, not calendar months.

## Currency / TZ

- All monetary values: **AUD** unless specifically labeled USD/GBP/EUR. AW data has 5+ currency-converted spend fields; only `Cost` (AUD) is canonical for Phonebot.
- All timestamps: **Australia/Perth** timezone for CMS, AW, AC, FA, GW, GMB pulls.
- GAWA pulls also use Australia/Perth timezone setting.
- Brevo (SIB) timestamps: UTC (no tz setting in pulls).

## Aggregation conventions

- **Daily**: every metric should be sum-aggregable across days for sources with daily granularity.
- **Weekly**: ISO week (Mon-Sun) used for GW and AW weekly. Source-of-truth is `YearWeekIso` field.
- **Monthly**: calendar month. Apr 2026 always partial (only 1-24 in CMS).
- **Channel × campaign**: only via `sessionCampaignName` or `sessionGoogleAdsCampaignName` joined to AW `Campaign`. Some misses on join (campaign renames over time).
