# Memory snapshot — after CMS ingest + UK drop
**Timestamp:** 2026-04-25 ~10:50 UTC
**Where in lockstep:** Step 1 complete (folders + CMS placed). Step 2 starting next (API pulls for FA/AW/GAWA/GW/AC/SIB/GMB).

## New material facts (since snapshot 001)

### Scope changes
- **UK out of scope.** `sc-domain:phonebot.co.uk` removed from Search Console scope per user direction. Search Console is **AU only** (`https://www.phonebot.com.au/`). AE Search Console exists but also held out for now (consistent with AU-only direction; can be added back if AE comes into scope).

### CMS confirmed
- **Source:** mounted folder `/Users/mic/Downloads/cms order data/` (3 xlsx files).
- **Coverage:** 2026-02-01 → 2026-04-24 (83 days, ~3 months).
- **Fits 1m and 3m windows. Not 6m or 12m.**
- Cleaned to **2,551 unique orders** (32 boundary dups removed).
- **Total revenue: A$1,328,680. Total GP: A$334,543. Margin: 25.18%.** Matches user's 25–28% band.
- **AOV: A$520.85** (lower than memory's A$564 which was an FB-attributed subset).
- **Within-window repeat rate: 3.75%** (NOT lifetime).

### Critical CMS data-quality flags
1. **70 orders (2.74%) have GP=0 with implausibly low Cost Price** on premium SKUs. Likely COGS-not-yet-set. Must exclude or impute before any margin ranking. Need user to confirm the cause.
2. **No order-level channel attribution fields** (no utm/gclid/fbclid). Cross-checks vs CMS will be aggregate daily/weekly, not order-level join.
3. **No refund / returned flag.** Revenue is gross of returns. Refurb refund rates of 5–10% can flip channel verdicts — flag for the user.

### Carry-forward rules from prior memory (still valid)
- Margin band 25–28% blended; CPA ceiling A$80 green / A$100 caution / A$140 absolute breakeven.
- AUD currency, Australia/Perth tz.
- FB self-attribution is 42x GA4 last-click — treat platform conversions as platform-reported only.
- Strip seasonal months (BFCM/EOFY/Jan) before any "scale to X CPA" claim.
- On Google Ads automated bidding, keyword max CPC fields are inactive metadata — don't interpret.

## Open questions to user (still outstanding before Step 7 can lock)
1. **70 orders with GP=0 + tiny Cost Price** — intentional placeholder for sealed/new SKUs, or data export bug?
2. **Older CMS history** (pre-Feb 2026) — will user attach to enable 6m and 12m commercial-truth cross-checks, or proceed with GA4+ProfitMetrics-GA4 at those windows?
3. **GA4 AE duplicate** (`434168263` vs `433775991`) — held; AE held out for now per UK-out direction.
4. **FB personal account `act_1141970792623135`** — confirmed to exclude (proceeding with that assumption).

## What I am doing next (Step 2)
For each authenticated source, pull 1m / 3m / 6m / 12m extracts at the right granularity. Specifically:
- FA (act_14359173 only) — campaign × ad-set × ad × placement × age × gender × day
- AW (3900249467) — campaign × ad-group × keyword/query × day; PMax asset-group where exposed
- GAWA (284223207 main AU; 488590631 / 488618020 ProfitMetrics) — source/medium × campaign × landing × device × day; e-commerce funnel events
- GW (phonebot.com.au only) — query × page × day, plus brand vs non-brand split
- AC (180388397) — campaign × ad-group × keyword × day
- SIB — campaign × day, sends/opens/clicks/unsubs (only from 2025-10-27 onwards)
- GMB — locations × day metrics (search views, direction requests, calls)

## Anomalies/conflicts noted but not yet investigated
- 3 NZ orders in CMS (Canterbury, Otago) — international footprint. Tiny but log it.
- City missing on 32 feb-file orders — schema delta, non-material.
