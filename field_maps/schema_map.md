# Schema Map — Source-by-Source Field Definitions
**As-of:** 2026-04-25
**Used by:** Kimi (dashboard build), downstream cross-channel logic.

## CMS Web Orders (`cms_manual/cms_orders_v4_with_refunds.csv` is canonical)
| Field | Type | Source | Meaning | Caveats |
|---|---|---|---|---|
| `Order ID` | int | CMS | Unique web order identifier | 0 overlap with store. 50 Villawood fraud excluded. |
| `Email` | str | CMS | Customer email | Empty for ~12% of orders (walk-ins?). Use for repeat-customer detection. |
| `City` | str | CMS | Customer city | Missing in feb 2026 file (schema delta). Don't rely. |
| `Postcode` | int | CMS | Customer postcode | Reliable. Used for AU state validation. |
| `State` | str | CMS | Customer state | 8 AU states + 3 NZ orders + a few nulls. |
| `Products` | str | CMS | Free-text product description | Format: `<Brand> <Model> (<Storage>) [<Condition>] - (ID : <id>, Qty : <n>) ...`. Parseable but messy. |
| `Brand`, `Condition` | str | derived | Extracted from Products text | Brand: iPhone/iPad/MacBook/Apple Watch/AirPods/Samsung/Google Pixel/OnePlus/Motorola/Nokia/Huawei/OPPO/Xiaomi/Other. Condition: Brand New/Open Box/Like New/Grade A/Grade B/Refurbished/Unknown. |
| `Total Quantity` | int | CMS | Items in order | Usually 1, occasionally 2-3. |
| `Total` | str | CMS | Order revenue | `A$1,299` format. Parsed to `Total_num` (float). |
| `Cost Price` | str | CMS | Order COGS | Same A$ string. **Missing for some accessories/repairs (per F)**. |
| `Gross Profit` | str | CMS | Order GP (raw from CMS) | A$ string. **Zero for 709 orders with implausibly low Cost Price**. |
| `GP_imputed` | float | derived | GP after Method B imputation | For GP=0 high-value orders, imputed via Brand × Condition median margin lookup (`qa_checks/cms_margin_lookup_by_brand_condition.csv`). |
| `Date Added` | str | CMS | Order timestamp | Format: `DD/MM/YYYY h:MM:SS am/pm`. Parsed to `Date Added_parsed` (datetime). Australia/Perth tz assumed. |
| `Payment Method` | str | CMS | Payment processor | cybersource (50%), paypal (34%), afterpay (13%), zipmoney (3%), Free Checkout (1 case). |
| `Platform` | str | CMS | Source platform | Web (47%), Mobile-Web (52%). NEVER "Store" (separate file). |
| `was_refunded` | bool | derived | Joined to refund file | True if Order ID appears in `cms_refunds_parsed.csv`. 6.52% of orders. |
| `__source_file` | str | derived | Origin xlsx file | For traceability. |

## CMS Web Refunds (`cms_manual/cms_refunds_parsed.csv`)
| Field | Type | Source | Meaning |
|---|---|---|---|
| `Order ID` | int | CMS refund file | Original order being refunded — joinable to web orders ✓ |
| `Status` | str | CMS | Always "Returned & refunded" |
| Other fields | same as orders | | Schema mostly matches order file |

## Store Orders (`melbourne_store_sales/store_orders_full_history.csv`)
| Field | Type | Source | Meaning | Caveats |
|---|---|---|---|---|
| `Order ID` | int | Store CMS | Unique store order ID | 0 overlap with web. Independent ID space. |
| `Postcode` | int | Store | Customer postcode | 90% are 3073 (Reservoir VIC). |
| `Products`, `Total Quantity`, `Total`, `Cost Price`, `Gross Profit`, `Date Added`, `Payment Method` | as web | | |
| `Platform` | str | always "Store" | clean differentiator from web |
| `Category` | str | derived | Device / Repair Service / Accessory / Other | Repair = "screen replacement"/"battery"/etc. Accessory = case/cover/protector/cable/glass. |

**Store data quality:** GP=0 only on 7 orders. But Cost Price=0 (and thus GP=Total) on most accessories and repair-service orders → margin reads as 78-91% which is artefact, not real. Per F, COGS not actively tracked for accessories/repairs.

## Store Refunds (`melbourne_store_sales/store_refunds_full_history.csv`)
**Has Email column (web orders don't!)**. Order IDs do NOT match the store orders file (export-side filter). Treat as aggregate revenue adjustment, not order-level join.

## Facebook Ads (FA, `act_14359173`)
| Field (canonical) | Supermetrics field | Type | Meaning |
|---|---|---|---|
| Date | `Date` | date | Day in account TZ |
| Campaign | `adcampaign_name` | str | Active campaigns: "Cold \| TOF \| 2 ad sets...", "Retargeting new cost cap $45", "UAE - Burjuman...", "whatsapp buyback", "Engagement store +10km radius" |
| Ad set | `adset_name` | str | |
| Ad | `ad_name` | str | |
| Spend | `cost` | float | AUD |
| Impressions | `impressions` | int | |
| Clicks (all) | `Clicks` | int | All clicks incl non-link |
| Link clicks | `action_link_click` | int | Outbound link clicks only |
| Website purchases | `offsite_conversions_fb_pixel_purchase` | int | Pixel-attributed purchases |
| Website purchase value | `offsite_conversion_value_fb_pixel_purchase` | float | Pixel-attributed revenue |
| ROAS | `website_purchase_roas` | float | platform-computed (inflated — see triangulation) |
| Placement | `publisher_platform`, `platform_position` | str | facebook/instagram + feed/reels/stories/etc. |

**FA caveat:** Phonebot's pixel + utm tagging is broken (memory: `fbclid` server bug, 62% of purchase events affected). GA4 attributes nearly zero `facebook / cpc` sessions. Platform-claimed revenue is 65-238× over-stated vs ProfitMetrics-attributable.

## Google Ads (AW, `3900249467`)
| Field (canonical) | Supermetrics field | Type | Meaning |
|---|---|---|---|
| Date | `Date` | date | |
| Campaign | `Campaign` | str | Active: "CJ - PMax (Apple) iPad", "CJ - PMax (Samsung)", "CJ - Phonebot (B)" [BRAND], etc. |
| Ad group | `AdGroupName` | str | |
| Spend | `Cost` | float | AUD |
| Conversions | `Conversions` | float (fractional!) | Last-click conversions (data-driven attribution allows fractional credit) |
| All conversions | `AllConversions` | float | Includes view-through + store-visit — bigger number |
| Conversion value | `Conversionsvalue` | float | Last-click revenue |
| All conversion value | `AllConversionsvalue` | float | All-conv revenue (heavily inflated — 4-5× over PM truth) |

**AW caveat:** Use `Conversionsvalue` (last-click) not `AllConversionsvalue` for ROAS comparisons — the latter inflates by including view-through. Even last-click is ~5-7× PM-attributable per multi-window triangulation.

## Bing/Microsoft Advertising (AC, `180388397`)
| Field | Supermetrics field | Type | Meaning |
|---|---|---|---|
| Date | `Date` | date | |
| Campaign | `CampaignName` | str | "CJ - Bing Shopping (All Products)", "CJ - Refurbished Phones", "CJ - Phonebot (B)", "Standard Shopping (Apple) - iPads" |
| Spend | `Spend` | float | AUD |
| Impressions, Clicks, CTR, Cpc | as named | | |
| Conversions | `Conversions` | int | Standard conversions |
| All conversions | `AllConversions` | int | Includes assisted |
| Revenue | `Revenue` | float | platform-claimed |
| All revenue | `AllRevenue` | float | platform incl assisted |

## GA4 (GAWA, `284223207` main AU)
**Critical scoping rule:** session-scoped metrics (sessions, ecommercePurchases, totalRevenue) are compatible only with session-scoped dimensions (sessionSourceMedium, sessionDefaultChannelGrouping, sessionCampaignName, sessionGoogleAdsCampaignName, etc.). The event-scoped `campaignName` and metrics like `eventCount` are a separate combinable set.

| Field | Type | Meaning | Use |
|---|---|---|---|
| `date` | date | | Day in property TZ |
| `sessionDefaultChannelGrouping` | str | Cross-network / Direct / Organic Search / Paid Search / Paid Shopping / Paid Social / Organic Social / Referral / Organic Shopping / Unassigned / Paid Other | Top-level channel allocation |
| `sessionSourceMedium` | str | "google / cpc", "bing / cpc", "(direct) / (none)", "facebook / referral" etc. | Source attribution |
| `sessionCampaignName` | str | Session-level UTM campaign | Joinable to AW's `Campaign` field for Google paid; FB campaigns mostly absent due to broken pixel |
| `sessionGoogleAdsCampaignName` | str | Google Ads-specific campaign attribution | Cleaner than `sessionCampaignName` for AW. |
| `sessions` | int | Session count | |
| `totalUsers`, `newUsers` | int | User counts | |
| `ecommercePurchases` | int | Purchase events | |
| `totalRevenue` | float | Last-click attributed revenue | This is GA4's last-click model — different from platform-reported. |
| `addToCarts`, `checkouts` | int | Funnel events | |

**Filter:** all AU-scoped pulls use `country == Australia` to exclude UAE/UK noise.

## ProfitMetrics — accessed via 2 GA4 properties
- **`488590631` Phonebot - ProfitMetrics Revenue**: same dimensions as main GA4 but `totalRevenue` is PM-attributed revenue (different model). Includes the big "Unassigned" bucket of server-side conversions.
- **`488618020` Phonebot - ProfitMetrics Gross Profit**: `totalRevenue` field actually contains GP (margin), not revenue. **This is the commercial truth proxy** — reconciles to CMS imputed GP within 6%.

**No country filter applied to PM properties** (they're set up to capture all conversions, including server-side). PM totals are slightly higher than CMS web totals because they may include some store-channel orders flowing through GA4.

## Search Console (GW, `https://www.phonebot.com.au/`)
| Field | Type | Meaning |
|---|---|---|
| `Date` | date | |
| `query` | str | Search query (only some queries returned — Google's privacy threshold) |
| `branded_vs_nonbranded` | str | "branded" / "non-branded" / "(unknown)" — "(unknown)" is the discrepancy-correction bucket (~46% of clicks) |
| `page` | str | Landing page |
| `clicks`, `impressions`, `ctr`, `position` | as named | Standard SC metrics |
| `device` | str | desktop/mobile/tablet |

**Setting:** `discrepancy_correction = AGGREGATE_LEVEL` ensures the 3-bucket totals reconcile to the GSC UI.

## Brevo (SIB)
**History only since 2025-10-27.** No revenue or order $ — only campaign send/engagement metrics.
| Field | Supermetrics field | Type |
|---|---|---|
| Date | `email_campaigns__date` | date |
| Campaign | `email_campaigns__campaign__name` | str |
| Subject | `email_campaigns__campaign__subject` | str |
| Recipients | `email_campaigns__campaign_recipient_list__recipients` | int |
| Delivered | `email_campaigns__campaign_recipient_list__delivered` | int |
| Opens (unique) | `email_campaigns__campaign_recipient_list__opens_unique` | int |
| Clicks (unique) | `email_campaigns__campaign_recipient_list__clicks_unique` | int |
| Unsubscribes, Bounces, etc. | as named | int |

## GMB (`Phonebot` location ID `5809529935256628290`)
| Field | Type | Meaning |
|---|---|---|
| `date` | date | |
| `location_name` | str | "Phonebot" or "Phonebot – BurJuman Mall Dubai" (AE — out of scope) |
| `views_total`, `views_search`, `views_maps` | int | Profile impressions |
| `actions_total`, `actions_website`, `actions_phone`, `actions_driving_directions` | int | User actions taken |

**GMB caveat:** Last 2-3 days typically zero / partial due to GMB reporting lag. Always trim trailing 3 days before comparison.
