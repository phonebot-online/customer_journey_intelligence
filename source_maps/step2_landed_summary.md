# Step 2 — landed-data summary (as of mid-Wave-3)

## On disk (cleaned CSVs ready for analysis)

### CMS (commercial truth)
- 1m: cms_orders_v4_clean.csv (763 orders)
- 3m: cms_orders_v4_clean.csv (2,700 orders)
- 6m: cms_orders_v4_clean.csv (6,875 orders)
- 12m: cms_orders_v4_clean.csv (15,684 orders)
- Full history: cms_orders_v4_with_refunds.csv (17,659 orders, 14 months)
- Refunds parsed: cms_refunds_parsed.csv (1,155 refunds)
- Monthly summary: cms_monthly_summary_net.csv

### Bing (AC)
- 1m: bing_ads/campaign_daily_1m.csv (119 rows = 30d × 4 campaigns)
- 6m: pending (re-submitted leaner schema)
- 12m: pending (re-submitted leaner schema)

### FB Ads (FA, act_14359173)
- 1m: facebook_ads/campaign_summary_30d_act14359173.csv (5 campaigns aggregated)
- 1m: facebook_ads/placement_summary_30d_act14359173.csv (56 placements, A$7,300 total)
- 6m: pending (re-submitted after timeout)
- 12m: schedule_id 264d791f5f7cc912c1a0b4e5ea80b15347a976a94da189fe4c9a26c429fa2cde — landed but persisted, save pending

### Google Ads (AW)
- 1m: 487 rows in Supermetrics cache (schedule a059b9d5...) — save pending
- 3m: schedule dc2d41fe... — save pending
- 6m: schedule 67b44548... — save pending
- 12m: schedule 214616ce... — save pending

### GA4 main AU (284223207)
- 1m: 333 rows in cache (fa552436...) — save pending
- 3m: schedule 1c25e96d...
- 6m: schedule 0361b731... (in cache — save pending)
- 12m: schedule 75c07045... (likely persisted)

### GA4 ProfitMetrics
- Revenue 488590631 3m: schedule 3a2e28a7...
- GP 488618020 3m: schedule cf0a84448...
- 6m + 12m for both: pending

### Search Console (GW, AU only)
- 1m: search_console/branded_daily_1m.csv (90 rows)
- 3m: 271 rows in cache (f7438c77...) — save pending
- 6m: 540 rows in cache (17ac255d...) — landed in chat
- 12m: schedule 41189f7593... (likely persisted)

### Brevo (SIB)
- 1m: brevo/campaigns_1m.csv (3 campaigns)
- 6m: brevo/campaigns_6m.csv (33 campaigns)
- 12m: brevo/campaigns_12m.csv (33 campaigns — Brevo data only since 2025-10-27)
- Monthly: brevo/brevo_monthly_summary.csv

### GMB (Phonebot AU)
- 1m: gmb/locations_daily_1m.csv (60 rows)
- 6m: 180 rows in chat — save pending
- 12m: 365 rows in chat — save pending

## Critical observations from Wave 3
- **GW 6m confirms** the Feb-Mar 2026 organic position degradation (non-branded position 12 → 22-31 → recovery)
- **GMB 12m confirms** the Jan 17 visibility cliff (430-540 views/day → 166-275/day for ~6 weeks then partial recovery)
- **Brevo open rates halved** Nov-Dec 2025 (BFCM saturation 12-13%) → recovered to 24-26% Mar-Apr (better list)

## Still in flight
- FA 6m (re-submitted, was timeout)
- AW 6m + 12m (still running last poll)
- GAWA AU 6m + 12m (large persisted)
- GW 12m, ProfitMetrics 6m + 12m (pending submission)
