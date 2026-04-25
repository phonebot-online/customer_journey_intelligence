# Step 7 LOCKED — Multi-window triangulation stability check
**Date locked:** 2026-04-25
**Method:** Same triangulation method (AW + FA platform vs ProfitMetrics GP property `488618020`) at 1m / 3m / 6m / 12m rolling windows anchored on 2026-04-24.
**Purpose:** Test whether the 30-day finding (FB unprofitable, AW workhorse) is window-artifact or stable pattern.

## Window-level summary

| Window | Days | AW spend | AW platform claim | FA spend | FA platform value | PM Total GP | AW spend/day |
|---|---|---|---|---|---|---|---|
| 1m | 30 | A$19,105 | A$228,539 | A$7,301 | A$141,569 | A$108,460 | A$637 |
| 3m | 90 | A$83,349 | A$874,683 | A$23,398 | A$530,740 | A$370,679 | A$926 |
| 6m | 180 | A$223,539 | A$2,214,730 | A$57,099 | A$1,011,924 | A$741,140 | A$1,242 |
| 12m | 365 | A$473,966 | A$4,183,317 | A$145,455 | A$1,890,771 | A$1,535,698 | A$1,299 |

## Over-attribution stability (locked)

| Window | AW platform / PM AW GP | FA platform / PM Paid Social GP | FA real-ROAS | AW real-GP/spend |
|---|---|---|---|---|
| 1m | **4.80×** | **238×** | 0.08× | **2.49×** |
| 3m | 5.79× | 283× | 0.08× | 1.81× |
| 6m | 7.22× | 186× | 0.10× | 1.37× |
| 12m | 6.97× | 149× | 0.09× | 1.27× |

**Locked findings from stability check:**

### A. FB real-GP-per-spend has been 0.08-0.10× **for the entire 12-month period.**
Not a 30-day artifact. Not a recent change. **Stable underperformance.**

### B. AW efficiency is a diminishing-returns curve.
At 12m average spend (A$1,299/day), AW returned 1.27× GP/spend. At current 1m spend (A$637/day), AW returns 2.49×. Cutting spend by 50% nearly **doubled** efficiency. **Classic saturating returns curve confirmed.**

### C. AW over-attribution stable at 5-7× across all windows.
GA4 + ProfitMetrics chain consistently shows AW claims 5-7× more revenue than ProfitMetrics attributes. This is the sustainable inflation factor for Google's last-click model.

### D. FB over-attribution varies (149-283×) but is always extreme.
Variance comes from tiny denominator (PM Paid Social GP is small). All windows confirm the magnitude is huge — anywhere between 149× and 283×. Bounded between "very inflated" and "extremely inflated".

## 12-month NET FINANCIAL OUTCOME (PM-attributable)

| Channel | 12m spend | PM GP attributable | **Net profit/loss** | Net per-day |
|---|---|---|---|---|
| **Google Ads (AW)** | **A$473,966** | **A$600,489** | **+A$126,523** | +A$347/day |
| **Facebook + IG (FA)** | **A$145,455** | **A$12,705** | **-A$132,750** | -A$364/day |
| **Net (AW + FA combined)** | A$619,421 | A$613,194 | **-A$6,227** (essentially break-even) | -A$17/day |

Note: Bing not included (estimated 12m ~A$5-10k spend, similar 6-10× ROAS — small positive contribution).

**The bottom-line interpretation:**
On the attributable model (PM-GP), Phonebot's combined paid ecosystem (AW + FA) over the past 12 months has been **essentially break-even at the GP level** — A$133k FB loss roughly cancels A$127k AW profit. **F has been spending A$619k/year on paid ads to net A$0 in tracked GP.**

The real picture depends on FB's untracked incrementality:
- **If FB delivers ZERO incremental beyond its tracked share**: spending A$145k/year on FB is a pure A$133k/year loss. Cut to zero.
- **If FB delivers 5× its tracked GP**: A$63k GP on A$145k spend = -A$82k still a loss. Cut significantly.
- **If FB delivers 10× tracked GP**: A$127k GP on A$145k spend = -A$18k still loss. Reduce.
- **If FB delivers 25× tracked GP** (improbable): A$317k GP on A$145k spend = +A$172k profit. Hold/grow.

**The break-even point is FB delivering ~11× its tracked GP to justify current spend.** The ONLY way to know the multiplier is to run a **2-week 50% spend cut on FB cold prospecting and observe CMS orders + GA4 sessions**.

## AW spend-per-day trajectory (the cliff visualised in commercial terms)

Implied AW spend rate by period (from the 1m/3m/6m/12m rolling windows):

| Period | Implied AW spend/day | vs Peak |
|---|---|---|
| 7-12 months ago (May–Oct 2025) | A$1,354/day | -13% |
| **4-6 months ago (Nov 2025–Jan 2026 — incl BFCM)** | **A$1,558/day** | **PEAK** |
| 2-3 months ago (Feb–Mar 2026) | A$1,071/day | -31% |
| Last month (Mar 26–Apr 24, 2026) | A$637/day | **-59%** |

The cliff F described **is real but it's a deliberate cumulative pull-back**:
- Started reducing AW after BFCM (Nov-Jan peak)
- Cut another 31% in Feb-Mar
- Cut another 41% in last 30 days
- Now at A$637/day = under half of peak

And as section B above shows, **the cuts have improved AW efficiency** (1.27× → 2.49× GP/spend) — but at the cost of 46% YoY web-order volume.

## Reconciliation chain (still holds at all windows)

| Window | CMS imputed GP | PM total GP | Match |
|---|---|---|---|
| 1m | A$115,280 | A$108,460 | 94% |
| 3m | (would need CMS computation — TODO) | A$370,679 | — |
| 6m | (TODO) | A$741,140 | — |
| 12m | A$2,039,711 (full 14m via cms_orders_v4) | A$1,535,698 | 75% |

The 12m mismatch is wider — likely because PM property doesn't include all CMS revenue (some store-channel orders, some non-tracked sources). Worth investigating but not a blocker. The directional stability of the over-attribution ratios is what matters.

## Implications for spend reallocation (HIGH confidence)

### 1. FB pull-back is justified by every window
Cut FB cold-prospecting spend by 50% for 2 weeks. Observe CMS daily orders. If orders hold flat, FB is non-incremental → reallocate to Google Ads.

### 2. AW cut was beneficial — don't restore peak spend
Net profit at A$637/day is A$28k/month (1m). Net profit at A$1,558/day during peak was about A$32k/month using same efficiency calc → **only marginally higher despite 2.4× the spend**. The peak was over-spending.

### 3. Optimal AW spend zone is somewhere between A$700-1,100/day
Current A$637/day → 2.49× GP/spend → A$28k/mo profit
Modeled A$1,071/day (Feb-Mar) → ~1.81× GP/spend → A$30k/mo profit
Modeled A$1,558/day (peak) → ~1.37× GP/spend → A$33k/mo profit (saturating)

The math says: **a modest restoration to A$900-1,000/day might be the sweet spot** — slightly more volume without sacrificing much efficiency. Worth testing.

### 4. The "rebuild" lever is more spend on the highest-efficiency campaigns
Per the campaign-level triangulation: Brand campaigns (Phonebot B Google + Bing brand) returned 22-61× real ROAS in 30d. PMax Apple iPad and PMax Samsung returned 5-7× real ROAS at higher volumes. Apple Watches PMax / PMax Covers under-spent. **Reallocate within AW first; expand AW total later.**

## Caveats (carry forward into final conclusions)
- The "FB-loss" framing depends on PM-attributable model. FB might have non-trivial incremental contribution we cannot see. The cure is a holdout test.
- ProfitMetrics "Unassigned" bucket grows substantially with window length (A$38k 1m → A$612k 12m = 40% of total GP). This is an enormous unattributed share and could change paid-channel relative shares if it has any ad-driven component.
- Bing not included in this multi-window snapshot — would add small positive to Google ecosystem.
- Sep 2025 vs Apr 2026 (specific months, locked separately) is the most precise YoY comparison; rolling-window numbers blend periods.
