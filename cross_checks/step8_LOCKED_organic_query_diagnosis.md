# Step 8 LOCKED — Organic Search query-level diagnosis
**Date locked:** 2026-04-25
**Source:** Google Search Console (`https://www.phonebot.com.au/`), Australia/Perth tz, AGGREGATE_LEVEL discrepancy correction.
**Question:** Did Phonebot lose organic search rankings between 2025 and 2026, as F hypothesized?
**Method:** Query-level pull for Sep 2025 (full month) vs Apr 2026 (1-24, pro-rated to 30d), filtered to clicks ≥ 3 to drop the long tail.

## TL;DR — F's hypothesis is HALF-TRUE

| Hypothesis component | Verdict | Evidence |
|---|---|---|
| "Lost organic rankings" — overall | **REJECTED** | Non-branded clicks held flat (9,620 → ~10,990 pro-rated). Avg non-branded position **improved dramatically**: 20.1 → 5.3. |
| "Lost rankings on money queries" (refurbished iphone variants) | **CONFIRMED** | "refurbished iphone" 330 clicks → 16 pro-rated (-95%). Position 12.1 → 16.6 (worse). 8 of top 12 Sep 2025 non-branded queries dropped >90% in clicks by Apr 2026. |
| "Branded demand declined" (not in original hypothesis but emerged) | **CONFIRMED** | "phonebot" 878 clicks → 478×30/24 = 597 (-32%). All branded variants -30 to -45%. Position unchanged at #1 — pure demand-side fall. |
| "Replaced by lower-intent traffic" | **CONFIRMED** | "best android phone 2026" 0 → 375 clicks/24d at pos 6.5. "best samsung phone 2026", "oppo vs samsung", "best phones 2026" — all big winners. Research-stage, not purchase-stage. |

## Aggregate monthly trend (12 months — refutes the simple "cliff" story)

Non-branded clicks per month (full year, AU site, Australia/Perth tz):

| Month | Branded clicks | Non-branded clicks | (unknown) | Total | NB avg position |
|---|---|---|---|---|---|
| 2025-05 | 1,849 | 12,004 | 10,127 | 23,980 | 16.79 |
| 2025-06 | 1,889 | 10,985 | 9,113 | 21,987 | 16.77 |
| 2025-07 | **2,453** | 7,341 | 6,936 | 16,730 | 19.99 |
| 2025-08 | 2,421 | 8,558 | 6,921 | 17,900 | 17.51 |
| 2025-09 | 1,822 | 9,620 | 7,840 | 19,282 | 20.12 |
| 2025-10 | 1,783 | 10,622 | 8,324 | 20,729 | **9.37** |
| 2025-11 | 1,807 | **16,208** | 11,704 | 29,719 | **7.73** |
| 2025-12 | 1,432 | 8,859 | 8,814 | 19,105 | 8.68 |
| 2026-01 | 1,329 | 7,812 | 8,214 | 17,355 | 8.45 |
| 2026-02 | 1,170 | 7,131 | 8,242 | 16,543 | 7.36 |
| 2026-03 | 1,092 | 11,009 | 10,572 | 22,673 | 6.21 |
| 2026-04 (24d) | 892 | 8,792 | 8,221 | 17,905 | **5.27** |

**The headline pattern:**
1. **Branded clicks dropped 64%** from peak (2,453 in Jul-25 → 892 in Apr-26 over 24 days = ~1,115 30d-pro-rated). Position unchanged at top of page → demand decline, not ranking loss.
2. **Non-branded clicks held flat** (9,000-12,000/month band most months). The Nov 2025 spike (16,208) was BFCM seasonality.
3. **Non-branded average position dramatically improved** in Oct 2025 (20 → 9) and continued improving through Apr 2026 (5.3). Pages are ranking BETTER overall.

## Where the rankings actually shifted (query-level forensics)

### Money queries that COLLAPSED (-90% to -99% click loss)

| Query | Sep 2025 clicks | Apr 2026 30d-pro-rated clicks | Δ | Sep position | Apr position |
|---|---|---|---|---|---|
| **refurbished iphone** | 330 | ~16 | **-95%** | 12.1 | 16.6 |
| refurbished iphones | 232 | <4 | **-99%** | 8.7 | dropped out |
| refurbished ipad | 199 | <4 | **-99%** | 14.6 | dropped out |
| iphone refurbished | 118 | <4 | **-97%** | 9.2 | dropped out |
| ipad refurbished | 87 | <4 | **-97%** | 14.5 | dropped out |
| ipad tablet refurbished | 86 | <4 | **-97%** | 14.3 | dropped out |
| refurbished iphone australia | 57 | <4 | **-94%** | 10.5 | dropped out |
| refurbished iphone 14 | 55 | <4 | **-95%** | 12.3 | dropped out |
| iphone 17 air price in australia | 50 | <4 | **-94%** | 5.7 | dropped out |
| iphone 14 pro refurbished | 47 | <4 | **-94%** | 20.1 | dropped out |
| samsung refurbished phones | 53 | ~16 | -69% | 14.7 | 9.1 (improved!) |

These are the **purchase-intent queries**. Total Sep 2025 click-volume across these 11: ~1,266. Apr 2026 30d-pro-rated: <120. **A loss of ~1,150 high-intent monthly clicks** that exactly matches the YoY web-order decline trajectory.

### Queries that GREW dramatically (research/comparison-stage)

| Query | Sep 2025 clicks | Apr 2026 30d-pro-rated clicks | Apr position |
|---|---|---|---|
| **best android phone 2026** | <3 | ~469 | 6.5 |
| best samsung phone | 11 | ~140 | 5.9 |
| best samsung phone 2026 | <3 | ~105 | 6.5 |
| oppo vs samsung | 31 | ~116 | 2.7 |
| best phones 2026 | <3 | ~105 | 6.8 |
| best android phones 2026 | <3 | ~81 | 8.7 |
| top 10 android phones 2026 | <3 | ~56 | 5.6 |
| best samsung phone 2025 | <3 | ~33 | 5.4 |
| samsung vs oppo | <3 | ~50 | 2.5 |
| best phone under 500 aud | 22 | ~21 | 1.1 (improved!) |

**Net effect:** The blog/comparison content is doing better than ever. But these queries don't convert at the same rate as "refurbished iphone."

### Branded query trajectory (demand-side, not ranking)

| Branded query | Sep 2025 clicks | Apr 2026 30d-pro-rated | Δ | Position then/now |
|---|---|---|---|---|
| phonebot | 878 | ~597 | -32% | 1.32 / 1.49 (essentially same #1) |
| phonebot reservoir | 307 | ~211 | -31% | 1.05 / 1.01 |
| phone bot | 218 | ~129 | -41% | 2.62 / 2.53 |
| phonebot australia | 103 | ~60 | -42% | 1.02 / 1.03 |
| phonebot melbourne | 45 | ~25 | -44% | 1.0 / 1.01 |
| phonebot discount code | 28 | ~16 | -43% | 1.09 / 1.0 |

Position unchanged → this is **fewer people searching for "phonebot" by name**, not lost rankings. Brand-awareness decline. Likely linked to the FB ad pull-back (FB drives upper-funnel brand search) and the Google Ads pull-back (less retargeting → less brand recall).

## Diagnosis — why this matters commercially

The combined picture explains the YoY web-revenue decline more precisely than the "lost rankings" narrative did:

1. **Loss of ~1,150 monthly high-intent clicks** on "refurbished X" queries. At a ~3% conversion rate and ~A$564 AOV, that's a loss of roughly **A$19,500/month in expected revenue** from organic alone — close to the A$20-25k/month decline seen in CMS web data Sep 2025 → Apr 2026.
2. **Loss of ~600 monthly branded clicks** on "phonebot" variants. Branded clicks convert at much higher rates (10-20%) → another **A$13,000-20,000/month** in expected lost revenue.
3. **Compensating gain in research-stage clicks** — but at a much lower conversion rate, plus likely AI Overview cannibalization (impressions doubled while clicks held → CTR collapsed across the site).

These three stories combined approximate the entire YoY web-channel revenue gap, without needing to invoke pricing pressure or competitive issues alone.

## Why the rankings shifted — hypotheses (not data, evidence-grade A vs B vs C)

### A. AI Overviews are eating refurbished-product CTR (high confidence)
Evidence: total impressions are climbing while clicks are flat. Avg position improving while click volume plateaus or declines. This pattern is the canonical signature of Google's AI Overview rollout for product/transactional queries.

### B. Algorithm ranking change on "refurbished iphone" specifically (medium confidence)
Evidence: Phonebot's position on "refurbished iphone" went from 12 → 16, and many similar queries dropped out of top-ranking entirely. Could be:
  - Helpful Content Update / Reviews Update penalizing thin product-listing pages
  - Competitor entry/strengthening (Reebelo appears at clicks 19 in Apr 2026 — they weren't ranked on Phonebot's terms in Sep 2025)
  - A specific URL Phonebot used to rank on lost authority (page de-indexed, redirected, etc.)

### C. Site-side technical issue (low-medium confidence — should be checked)
Evidence: hard click drops on a coherent group of queries suggests something specific to "refurbished X" landing pages may have broken. Worth a manual check of:
  - phonebot.com.au/refurbished-iphone (does it exist? is it noindex'd? was it merged into a category?)
  - Internal linking from category pages
  - Schema markup / product schema on these pages

## Recommended next moves

1. **Manual check of refurbished landing pages** (15 min) — pull the top 5 "refurbished X" URLs that ranked in Sep 2025 and verify they still exist, are indexable, and have unchanged content. Use Search Console URL Inspection.
2. **Page-level GW pull** — pull `page` × `clicks` for Sep 2025 vs Apr 2026 to see exactly which URLs lost traffic. This is the diagnostic step that closes the loop on hypothesis B vs C.
3. **AI Overview audit** — search the top 10 "refurbished X" queries in incognito and check whether AI Overviews now appear. If yes, the click loss is structural (Google search behavior change) and partially unrecoverable.
4. **Reverse the branded decline** — branded search is downstream of brand awareness. The 32-44% branded click drop is concurrent with the FB cold-prospecting pull-back. The FB incrementality holdout test (recommended in Step 9) directly tests whether FB upper-funnel was driving this.

## Updates to other locked docs

This finding amends `qa_checks/gw_organic_finding_contradicts_hypothesis.md` (which used aggregate-only data and rejected the cliff hypothesis). The aggregate finding is correct; the query-level finding here adds the missing nuance:

> "Phonebot did not lose overall rankings — Phonebot lost rankings on a tight set of high-intent purchase queries while gaining rankings on lower-intent research queries. The aggregate net click-count looks stable; the commercial value of those clicks dropped sharply."

This finding should be incorporated into Step 9 conclusions section "Growth drivers / decline drivers."

## Files
- `12_month/search_console/gw_monthly_branded_12m.csv` — full 12-month branded/non-branded/(unknown) monthly trend
- `12_month/search_console/gw_top_queries_sep2025.csv` — Sep 2025 query-level top 60+ (clicks ≥ 3)
- `12_month/search_console/gw_top_queries_apr2026.csv` — Apr 2026 (24d) query-level top 60+ (clicks ≥ 3)

## Caveats
- "(unknown)" bucket from `discrepancy_correction = AGGREGATE_LEVEL` represents 30-50% of all clicks each month; cannot be split branded vs. non-branded. Trends within the (unknown) bucket are similar to non-branded, which suggests most of it is non-branded.
- The clicks ≥ 3 filter drops queries with 1-2 clicks; long-tail trends not captured.
- "Apr 2026 dropped out" entries are queries that received fewer than 3 clicks in Apr 2026. They may have received 1-2 clicks. The "<4 pro-rated" estimate is conservative.
- Sep 2025 vs Apr 2026 spans 7 months — not a clean YoY. A true Apr 2025 vs Apr 2026 comparison would isolate seasonality but Apr 2025 GW data is limited (only 6 days available pre-2025-04-25 anchor).
