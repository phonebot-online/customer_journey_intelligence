# STEP 2 — Pull plan
**Approach:** rolling-window relative dates (`last_N_days`) so every pull is precisely anchored. As-of date = today (2026-04-25 UTC).
**Windows:**
- 1m = last_30_days
- 3m = last_90_days
- 6m = last_180_days
- 12m = last_365_days
**Wave order:**
- Wave 1 (now): 1-month window across FA, AW, AC, GAWA AU, GW, SIB, GMB. Start with campaign/source-medium-level daily — that's the spine.
- Wave 2: Same sources, 3-month window, plus deeper FA breakdowns (placement × age × gender × ad).
- Wave 3: 6-month window. Note SIB has only data from 2025-10-27; AW PMax campaign-asset-level may need separate pulls.
- Wave 4: 12-month window. Aggregate to weekly where row counts threaten Supermetrics caps.

## Per-source pull templates

### FA (Facebook Ads — `act_14359173` only)
- Spine pull: Date × adcampaign_name × adset_name × ad_name → cost, impressions, Clicks, action_link_click, link_CTR, CPM, CPLC, offsite_conversions_fb_pixel_purchase, offsite_conversion_value_fb_pixel_purchase, website_purchase_roas, currency
- Placement breakdown: Date × publisher_platform × platform_position × adcampaign_name → cost, impressions, Clicks, link_CTR, action_link_click, offsite_conversions_fb_pixel_purchase, offsite_conversion_value_fb_pixel_purchase
- Demographic breakdown: Age × Gender × adcampaign_name → cost, impressions, link_CTR, action_link_click, offsite_conversions_fb_pixel_purchase, offsite_conversion_value_fb_pixel_purchase
- Geo: Country × adcampaign_name → cost, impressions, action_link_click, offsite_conversions_fb_pixel_purchase

### AW (Google Ads — 3900249467)
- Campaign daily: Date × CampaignName → Cost, Impressions, Clicks, Conversions, AllConversionsvalue, Cpc, Ctr, CurrencyCode (settings: asset_level=ASSET_LEVEL_CAMPAIGN; brand_keywords="phonebot")
- Ad group daily: Date × CampaignName × AdGroupName → same metrics (AdGroup level)
- Keyword: CampaignName × AdGroupName × Keyword → Cost, Impressions, Clicks, Conversions, AllConversionsvalue, QualityScore (where reported)
- Search query: CampaignName × AdGroupName × SearchQuery → Cost, Impressions, Clicks, Conversions, AllConversionsvalue
- Device: Date × CampaignName × Device → Cost, Impressions, Clicks, Conversions
- Branded vs non-branded: Date × branded_vs_nonbranded → Cost, Impressions, Clicks, Conversions

### AC (Microsoft/Bing — 180388397)
- Campaign daily: Date × CampaignName → Spend, Impressions, Clicks, Conversions, AllConversions, Revenue, AllRevenue, Cpc, CurrencyCode (CampaignPerformance report)
- Keyword: CampaignName × AdGroupName × Keyword → Spend, Impressions, Clicks, Conversions, Revenue (KeywordPerformance)
- Search query: CampaignName × AdGroupName × SearchQuery → Spend, Impressions, Clicks, Conversions, Revenue
- Geo: GeographicPerformance → State × Spend, Conversions
- Demographic: AgeGenderDemographic → Age × Gender × Spend, Conversions

### GAWA — main AU property `284223207`
- Channel × day: date × sessionDefaultChannelGrouping → sessions, totalUsers, newUsers, engagedSessions, engagementRate, ecommercePurchases, transactions, totalRevenue, addToCarts, checkouts
- Source/medium × day: date × sessionSourceMedium → sessions, totalUsers, newUsers, engagedSessions, ecommercePurchases, transactions, totalRevenue
- Landing × day: date × landingPagePlusQueryString → sessions, ecommercePurchases, totalRevenue
- Device × day: date × deviceCategory → sessions, totalUsers, ecommercePurchases, totalRevenue
- Country × day: date × country → sessions, ecommercePurchases, totalRevenue (filter to country=Australia for now)
- Funnel events × day: date × eventName (filter eventName in [add_to_cart, begin_checkout, purchase]) → eventCount

### GAWA — ProfitMetrics Revenue `488590631` and Gross Profit `488618020`
- Source/medium × day per property → totalRevenue/relevant metrics
- These are derived properties — verify field semantics by computing daily totals vs main GA4 main AU on overlapping period. If divergence is significant, use only as reference.

### GW (Search Console — phonebot.com.au only)
- Day × query × branded_vs_nonbranded → clicks, impressions, ctr, position (settings: brand_keywords="phonebot|phone bot|phonebot.com.au"; discrepancy_correction=AGGREGATE_LEVEL)
- Day × page → clicks, impressions, ctr, position
- Day × device → clicks, impressions, ctr, position

### SIB (Brevo)
- Send-day × campaign: email_campaigns__date × email_campaigns__campaign__name × email_campaigns__campaign__subject × email_campaigns__campaign__sender_name × email_campaigns__campaign_recipient_list__list_metadata__list_name → recipients, delivered, opens_unique, opens_total, clicks_unique, clicks_total, click_to_open_rate, soft_bounces, hard_bounces, unsubscribes, complaints (report_type=email_campaigns)
- Note: history only from 2025-10-27 → 6m and 12m queries will return partial data.

### GMB
- Location × day → views_total, views_search, views_maps, actions_total, actions_website, actions_phone, actions_driving_directions (Performance report)
- Search keywords (separate report, monthly): location × search_keywords → search_impressions

## Row-budget guardrails (Supermetrics max_rows ≤ 10,000 per pull)
- 12m daily × 30+ campaigns × ad-group × ad × placement is impossible in one pull. Tier order if a pull threatens overflow:
  1. drop ad-level granularity to ad-set level
  2. drop placement granularity to publisher_platform-only
  3. switch from daily to weekly
  4. split by campaign-tier (top-spend first)
