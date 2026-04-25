# Step 10 — FB incrementality holdout test protocol
**Date written:** 2026-04-25
**Status:** Ready to execute. Decision is yours; this is the paste-ready protocol when you say go.
**Why this test:** Triangulation across 1m/3m/6m/12m windows shows FB real-GP-per-spend at 0.08-0.10× — i.e. for every A$1 of FB spend, ProfitMetrics attributes ~A$0.08 of GP. If that attribution is true, FB is a A$133k/year net loss. The ONLY way to know whether FB is delivering hidden incremental volume the pixel/utm chain isn't catching is a holdout test.

## What to pause

**Pause 100% (not 50%) of:** `Cold | TOF | 2 ad sets | DPA+Vids+image | Must creatives`
- Current spend: ~A$2,670 / 30d = **~A$89/day**
- Current platform-claimed purchases: 71/30d (almost certainly over-attributed)
- Cost of running test: A$89 × 14 = **A$1,246 of foregone spend** over 14 days

**Keep running at full budget:**
- `Retargeting new cost cap $45` — this campaign reaches people who've already engaged (warm audiences). Not the unknown we're testing. Cutting it would conflate signals.
- `whatsapp buyback`, `Engagement store +10km` — lead-gen, already produce zero online purchases, leave them alone.
- `UAE - Burjuman` — out of AU scope, not relevant.

**Why 100% not 50%:**
- 100% pause gives a clean, unambiguous signal in 14 days
- 50% pause would force you to disentangle "is the remaining 50% still doing something?" — you'd need 4-6 weeks of statistical work for ambiguous answers
- The total cost of going from 50% to 100% pause is A$623 over 14 days. Worth the clarity.

## Test design

| Parameter | Setting |
|---|---|
| Campaign paused | Cold \| TOF \| 2 ad sets \| DPA+Vids+image \| Must creatives |
| Pause method | Set status to "Off" in Meta Ads Manager (not delete) |
| Duration | **14 calendar days** |
| Other FB campaigns | Continue at current budget |
| AW spend | Hold at current ~A$637/day. Don't change AW concurrent — would muddy attribution. |
| Pricing / promotions | No promo changes during test window |
| Inventory | No major restocks of cold-traffic anchor SKUs (refurbished iPhones, refurbished iPads) during the 14 days if avoidable |

## Pre-test baseline (capture before you flip the switch)

Take a snapshot of the trailing 14 days at the moment you pause:

| Metric | Pre-test 14d value (capture day 0) |
|---|---|
| CMS web orders / day (avg) | _____ |
| CMS web revenue / day | _____ |
| CMS web GP / day | _____ |
| GA4 `facebook / cpc` sessions / day | _____ (likely near 0) |
| GA4 Direct sessions / day | _____ (FB pixel-broken traffic often shows here) |
| GA4 `(other) / (none)` sessions | _____ |
| GSC clicks / day on "phonebot" branded queries | _____ |
| FB cold campaign daily orders (platform-claimed) | _____ |

Use the dashboard's daily chart to read these straight off, or run a 14d Supermetrics pull on test day 0.

## What to watch (daily, in the dashboard)

The single most important number is **CMS web orders/day**. The dashboard shows this as the daily revenue line; orders/day will track closely.

Secondary watchpoints:
- **GSC branded "phonebot" clicks** — daily. The hypothesis is FB upper-funnel drives brand awareness → branded search. If the Cold campaign was doing this work, branded clicks should drop within 5-10 days of the pause.
- **GA4 Direct + Unassigned sessions** — daily. FB-driven traffic with broken pixel often falls here. Should drop modestly if FB Cold was driving any incremental.
- **AW PMax (Apple) iPad and PMax (Samsung) ROAS** — daily. If FB Cold was filling the upper funnel, AW retargeting and brand campaigns might see efficiency drop (fewer warm prospects). Watch for this; it's a second-order signal.

## Decision criteria — apply on day 14

Compare days 1-14 of the test to pre-test trailing 14d (NOT to year-ago — too noisy).

| Outcome | Daily CMS orders change | Action |
|---|---|---|
| **A. Non-incremental** | Within ±5% of baseline | **Cut FB Cold permanently.** Reallocate A$2,670/30d to PMax (Samsung) or Bing Shopping. Locks in ~+A$3-4k/mo net profit. |
| **B. Mild incremental** | -5% to -15% of baseline | **Restore at half budget** (~A$45/day = A$1,335/30d). Half the cost, half the contribution — still a net positive vs current full spend. |
| **C. Strong incremental** | -15% or worse | **Restore Cold at full budget.** Accept the platform attribution is undercounting reality. Refocus optimization on reducing cost-per-purchase within Cold. |
| **D. Confounded** | Drop concurrent with weather, AW change, inventory disruption, public holiday | **Re-run the test for another 14 days** with cleaner conditions. |

## Statistical sanity check (run on day 14)

You don't need formal stats — the effect either shows up clearly or it doesn't at this scale. But two robustness tests:

1. **Compare day-of-week patterns.** Tuesday traffic vs Tuesday traffic, etc. Eliminates weekly seasonality.
2. **Check the same period vs the period before the pre-test** (days -28 to -14). If pre-test was already softening, the apparent "incremental loss" could be background trend.

If both checks confirm a real drop, weight toward Outcome B or C.

## What this test does NOT answer

- Whether the Retargeting FB campaign is incremental. (Separate test, future.)
- Whether AW PMax campaigns are incremental. (Would require AW geo-holdout, not in scope now.)
- Long-term brand-equity effects. (14 days is too short to see brand decay.)

## Re-run cadence

Re-test every 6 months — ad platforms, audiences, and creative effectiveness drift. A test that says "cut" today may not say "cut" in a year if the FB algorithm or your creatives improve.

## Files / pointers
- Live dashboard for daily monitoring: Cowork artifact `phonebot-ceo-dashboard`
- Trailing baseline data: `3_month/MASTER_daily_3m.csv`
- Triangulation that motivated this test: `cross_checks/step7_LOCKED_multiwindow_triangulation.md`
- This protocol: `cross_checks/step10_FB_incrementality_holdout_protocol.md`

## Tracking template (paste into a sheet on day 0)

```
Day | Date | Status | CMS orders | CMS rev | GSC "phonebot" clicks | GA4 Direct sessions | Notes
0   | YYYY-MM-DD | PRE  | _____ | _____ | _____ | _____ | baseline 14d trailing
1   | YYYY-MM-DD | LIVE | _____ | _____ | _____ | _____ | first day Cold paused
2   | ...
...
14  | YYYY-MM-DD | END  | _____ | _____ | _____ | _____ | decision day
```

Fill in daily, calculate trailing-14 averages on day 14, apply decision criteria.
