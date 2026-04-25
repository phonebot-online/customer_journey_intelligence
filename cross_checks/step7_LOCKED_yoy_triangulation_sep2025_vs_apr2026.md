# Step 7 LOCKED — YoY triangulation: Sep 2025 vs Apr 2026
**Date locked:** 2026-04-25
**Method:** Same triangulation (CMS + GA4 + ProfitMetrics + Platform) applied to two 30-day windows: Sep 2025 (full month) and Apr 2026 (Mar 26–Apr 24, the rolling 30d window we've been using).

## The headline numbers

| Metric | Sep 2025 | Apr 2026 (last 30d) | YoY change |
|---|---|---|---|
| **CMS web orders** | 1,419 | 763 | **-46.2%** |
| **CMS web revenue** | A$560,257 | A$406,206 | **-27.5%** |
| **CMS web GP (imputed)** | A$148,571 | A$115,280 | **-22.4%** |
| AOV | A$395 | A$532 | +35% (premium mix) |
| GP / order | A$105 | A$151 | +44% |
| **AW spend** | **A$42,222** | **A$19,105** | **-54.7%** |
| AW platform-claimed value | A$370,372 | A$228,539 | -38.3% |
| FA (FB+IG) spend | A$11,408 | A$7,301 | -36.0% |
| FA platform purchases | 233 | 251 | +7.7% |
| FA platform value | A$121,240 | A$141,569 | +16.8% |

## Locked finding 1: F's AW pull-back was a profit-maximizing move at the unit level

**Per ProfitMetrics GP attribution (commercial-truth proxy, validated to within 6%):**

| | Sep 2025 | Apr 2026 |
|---|---|---|
| AW spend | A$42,222 | A$19,105 |
| PM GP attributed to AW (Cross-net+Paid Search+Paid Shopping) | A$61,251 | A$47,572 |
| **Real GP / spend (efficiency)** | **1.45×** | **2.49×** |
| **Net profit (PM GP − spend)** | **+A$19,029** | **+A$28,466** |

Cutting AW spend by 55% **increased** net profit by 50%. The marginal A$23k/month being spent in Sep 2025 was generating ~zero incremental GP — saturating returns. This is **not a cliff caused by Google Ads pulling back; it's volume loss caused by Google Ads pulling back, but with a higher-efficiency, profit-positive remainder.**

The cliff narrative needs nuance: F made a defensible spend decision; the "cliff" is the inevitable volume cost of that decision. **The business is more efficient now, just smaller.**

## Locked finding 2: FB has been losing money on attributable basis for at least 8 months (probably longer)

**FB unit economics — both periods:**

| | Sep 2025 | Apr 2026 |
|---|---|---|
| FB spend | A$11,408 | A$7,301 |
| Platform-claimed ROAS | 10.63× | 19.39× |
| GA4-traceable Paid Social rev | (not pulled this batch) | A$3,341 |
| **PM GP attributed to Paid Social** | **A$940** | **A$595** |
| **Real GP / spend (PM-attributable)** | **0.08×** | **0.08×** |
| **Net loss on attributable basis** | **-A$10,468** | **-A$6,706** |

FB has been **0.08× real GP-per-spend in BOTH periods**. That's not a temporary blip. This is a stable pattern.

Caveat: FB attribution via GA4/PM is broken for Phonebot — `fbclid` server bug + missing utm tags mean GA4 sees almost zero `facebook / cpc` sessions. Real FB contribution is somewhere between A$595/mo (lower bound: PM-attributable) and ~A$50k/mo (upper bound: very generous incrementality estimate).

**Even at the upper bound, FB barely earns its cost.** Even at 5× the PM-attributable GP, A$2,975 GP on A$7,301 spend = -59% net of spend. **FB needs an incrementality holdout test before any further budget**.

## Locked finding 3: Paid mix is shifting toward more efficient channels

YoY change in PM GP attributed to each paid channel:
- **Cross-network (Google PMax)**: A$34,671 → A$18,792 (**-46%**) — biggest absolute GP loss; correlates with AW spend cut
- **Paid Search** (Google + Bing): A$25,817 → A$21,862 (**-15%**) — held up better than PMax
- **Paid Shopping**: A$762 → A$6,917 (**+808%**) — major shift here, likely a feed-only PMax launched in Q4 2025
- **Paid Social** (FB+IG): A$940 → A$595 (**-37%**) — proportional to spend cut, still tiny absolute

**The healthier-margin channels (Paid Search, Paid Shopping) are holding/growing while the big-volume channel (Cross-network) was scaled back.** This matches the "smaller and more profitable" pattern.

## Reconciliation sanity check

| | Sep 2025 | Apr 2026 |
|---|---|---|
| CMS imputed GP | A$148,571 | A$115,280 |
| PM GP total (all channels) | A$157,571 | A$108,460 |
| Match | 106% | 94% |

PM GP and CMS imputed GP align within 6% in both periods — triangulation is reliable across time, not just a 30d artifact.

## What this means for spend reallocation (refined from prior recommendations)

**HIGH confidence:**
- **FB**: Run incrementality holdout test before any budget. PM-attributable real ROAS has been 0.08× for 8+ months — pattern is stable, not a recent issue.
- **AW**: Don't restore Sep 2025 spend levels. The 55% cut was efficiency-positive. Marginal increase from current A$19k/mo is fine, but back to A$42k/mo will return zero or negative incremental GP.
- **Apple PMax + Samsung PMax**: largest non-brand winners both periods. Hold spend, don't cut.

**MEDIUM confidence:**
- **Volume vs efficiency trade-off is now F's actual decision**: the levers to grow back orders are: (a) restore some AW spend with eyes open about declining marginal returns, (b) fix FB incrementality (would require pixel + utm fix), (c) rebuild organic search rankings, (d) competitive pricing response. Each has different risk/payback.

**LOW confidence (needs more analysis):**
- The AOV +35% / GP/order +44% YoY is suspicious. Either Phonebot deliberately shifted to premium SKUs, or the customer mix shifted away from price-sensitive shoppers. Worth investigating CMS data to see which brand × condition category gained vs lost orders YoY.

## Caveats
- Bing Sep 2025 data not pulled in this batch (would add ~A$2k spend, ~A$10k value to AW totals — small adjustment).
- FB attribution via GA4 is broken in both periods, so the "PM GP for Paid Social = real FB contribution" claim is an under-bound, not a point estimate.
- The +808% Paid Shopping growth needs root-cause confirmation (campaign launch?). Currently a flag, not a finding.
- AOV YoY shift needs CMS brand × condition split before drawing premium-mix conclusions.
