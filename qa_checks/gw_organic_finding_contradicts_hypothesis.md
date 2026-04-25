# Search Console organic finding — needs validation before action
**Source:** `12_month/search_console/branded_weekly_12m.csv` (53 weeks weekly, AU site)
**Date:** 2026-04-25
**STATUS UPDATE 2026-04-25 (later same day):** Validation complete. See `cross_checks/step8_LOCKED_organic_query_diagnosis.md` for the resolved finding. Short version: aggregate finding here was correct but missed the mix shift. Phonebot DID lose rankings on a tight set of high-intent purchase queries ("refurbished iphone" -95%, others -90 to -99%) while gaining on lower-intent research queries ("best android phone 2026" 0 → 469/mo). Aggregate clicks held flat; commercial value of clicks dropped sharply. F's hypothesis is half-true on the dimension that matters most.

## Summary
F's stated cliff diagnosis included "lost organic search rankings" as one of 4 contributing factors. The aggregate Search Console data **does not show** lost rankings at average-position level. In fact:

- Non-branded average position: **16.3 (Apr-May 2025) → 7.2 (Jan-Apr 2026)** — improved
- Non-branded clicks: **12.4k (5 weeks Apr-May) → 35.5k (17 weeks Jan-Apr 26)** — roughly 3x weekly run rate
- Branded position: **9.3 → 1.9** (now top spot)
- Branded clicks: held ~4-5k weekly across periods

## Caveats — three reasons average-position may mislead
1. **Average is impressions-weighted across thousands of queries.** Phonebot could lose rank on the 20 highest-revenue commercial queries (e.g., "refurbished iphone 15 sydney") while gaining rank on thousands of long-tail queries (e.g., "phonebot review", "iphone repair near me"). Aggregate position improves; commercial traffic falls.
2. **CTR pattern is suspicious.** Non-branded CTR was 0.4% in Apr 2025 (position 16) and is 1.6% in Apr 2026 (position 7). CTR doubled, position doubled. But absolute conversions are still down YoY. So either traffic mix shifted toward less-purchase-intent queries, or the click-to-purchase conversion rate dropped on-site.
3. **Impressions ballooned in 2026** (1M+/week) — algo may have served the site for many speculative non-commercial queries.

## What I need to validate before acting on "fix organic rankings"
1. Pull GW with `query` dimension for top 100 highest-impression queries — see which specific terms LOST position between Q2-Q3 2025 vs now.
2. Pull GW × `page` to see if any high-revenue landing pages lost ranking.
3. Cross-check GA4 Organic Search session counts vs Search Console clicks (same period) — should reconcile within 5-10%.
4. Compute on-site conversion rate (Organic Search sessions → ecommercePurchases) by month, look for a drop coinciding with the order cliff.

## Implication for the cliff diagnosis
F gave 4 factors. Confidence levels by available data:
- ✅ **Xmas→Jan seasonal** — true, well-documented
- ⚠️ **"Lost organic search rankings"** — NOT yet confirmed at aggregate; possibly true only on specific commercial queries. Need query-level pull.
- ✅ **"Scaled-back Google Ads spend"** — confirmed (visible in AW weekly data, December was peak then large pull-back)
- ⚠️ **"Competitive product price pressures"** — not directly visible in this data; would need ProfitMetrics SKU-level data + competitor scraping to confirm

## Recommendation
Don't deploy SEO recovery effort or organic content investment until query-level Search Console data confirms specific commercial-keyword loss. If it's actually a CR / on-site issue, that's a totally different (and faster) lever.
