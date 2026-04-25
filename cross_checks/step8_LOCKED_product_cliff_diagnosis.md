# Step 8 LOCKED — Product-category cliff diagnosis (web channel)
**Date locked:** 2026-04-25
**Source:** `12_month/cms_manual/cms_orders_v4_with_refunds.csv` (canonical CMS web orders, 17,659 rows)
**Method:** Sep 2025 (full month, 1,419 orders) vs Apr 2026 (1-24, 579 orders) pro-rated to 30 days for fair comparison.
**Question:** F's cliff factor #4 was "competitive product price pressures." Is that real, where, and what's actually moving — volume or price?

## TL;DR

Web revenue Sep 2025 → Apr 2026 30d-pro: **A$560k → A$377k (-33%)**. Orders **-49%**, GP only **-28%**. The reason GP held better than revenue: **GP margin actually improved** (26.5% → 28.5%) because mix shifted UP-market.

The "price pressure" story is **only clean on one category — iPhone Like New** (AOV -15% on flat volume). Everywhere else the volume is what fell, and AOV mostly rose. This is a demand-volume problem, not a margin-erosion problem.

## Top-line YoY (Sep 25 → Apr 26 30d-pro)

| Metric | Sep 2025 | Apr 2026 30d-pro | Δ |
|---|---|---|---|
| Web orders | 1,419 | 724 | **-49%** |
| Web revenue | A$560,257 | A$377,326 | **-33%** |
| Web imputed GP | A$148,571 | A$107,554 | **-28%** |
| Avg order value | A$395 | A$521 | **+32%** |
| Imputed GP margin | 26.5% | 28.5% | **+2.0 pts** |

Margin improved despite the revenue decline — that's the opposite of what "competitive price pressure" would produce. If Phonebot were being squeezed on price industry-wide, margin should be falling, not rising.

## By Brand — where the volume went

| Brand | Sep orders | Apr 30d-pro | Δ orders | Δ rev | Δ AOV | Margin Sep / Apr |
|---|---|---|---|---|---|---|
| **iPhone** | 475 | 273 | -43% | -16% | **+47%** | 22.1% / 23.4% |
| **Samsung** | 412 | 211 | -49% | -35% | +28% | 27.2% / 33.2% |
| **iPad** | 227 | 109 | **-52%** | **-55%** | -5.5% | 30.8% / 35.2% |
| **Google Pixel** | 89 | 53 | -41% | **+3%** | **+75%** | 21.5% / 32.3% |
| **Apple Watch** | 83 | 36 | -56% | -38% | +42% | 30.4% / 29.1% |
| **MacBook** | 21 | 3 | **-88%** | **-88%** | flat | 31.6% / 32.1% |
| Other | 42 | 21 | -49% | -51% | -3% | 37.9% / 44.0% |
| Motorola | 14 | 5 | -64% | -62% | +5% | 28.6% / 33.9% |
| OPPO | 18 | 10 | -44% | -31% | +24% | 44.6% / 23.7% |
| **Xiaomi / AirPods / Huawei** | 32 | **0** | **-100%** | **-100%** | — | — |

**The big stories:**

### MacBook is effectively gone
21 → 3 orders/month, A$20.7k → A$2.4k revenue. **-88% on both**. AOV unchanged at ~A$985, so this is pure volume disappearance, not pricing. Worth a direct check: is this an inventory/buying issue (couldn't source units), a deliberate category de-prioritisation, or a competitive loss? Because A$18k/mo × 12 = ~A$216k/yr of lost top-line.

### iPad is the worst-hit "real" category
-52% volume, -55% revenue, -5.5% AOV. The only major category where AOV dropped meaningfully — small but real. Margin actually improved (30.8 → 35.2%) so it's not COGS pressure; it's slightly lower selling prices on lower volume. **A$53k/mo of lost iPad revenue is the largest dollar gap of any category.**

### iPhone is the strongest survivor
Volume -43% but revenue only -16% because AOV climbed 47% (A$447 → A$658). Mix shifted dramatically toward higher-end iPhones — flagship 14/15/16 Pro and Pro Max. Margin holding at ~22-23%.

### Samsung and Google Pixel are mix-shifting up-market
- Samsung volume -49% but margin jumped 27.2% → 33.2% (+6 pts) — Phonebot is selling fewer Samsungs but at much better margins
- Google Pixel volume -41% but **revenue +3% and AOV +75%** (A$346 → A$605) — pure mix shift to Pixel flagships

### Categories you've apparently exited
- Xiaomi: 11 orders in Sep → 0 in Apr
- AirPods: 18 → 0
- Huawei: 3 → 0
- Case/Cover: 3 → 0

## By Condition — volume crash, not price crash

| Condition | Sep orders | Apr 30d-pro | Δ orders | Δ rev | Δ AOV |
|---|---|---|---|---|---|
| **Like New** | 350 | 290 | **-17%** | -19% | -2% |
| **Grade A** | 456 | 264 | -42% | -39% | +6% |
| **Grade B** | 101 | 44 | -57% | -49% | +18% |
| **Brand New** | 78 | 15 | -81% | -57% | +121% |
| **Open Box** | 37 | 29 | -22% | -18% | +6% |
| Unknown (low-AOV) | 397 | 83 | -79% | -79% | +2% |

Like New is your most resilient grade. Grade B and Brand New had the steepest volume drops, but in both cases AOV rose so the customers who DID buy spent much more.

The "Unknown" condition is mostly accessories/repair-style low-AOV entries (A$42 average) and they took a -79% hit — suggests the long-tail / low-ticket business has dropped off (consistent with the "phonebot" branded search collapse — those were probably walk-in-style web orders).

## The single clean "price pressure" signal — iPhone Like New

| | Sep 2025 | Apr 2026 30d-pro | Δ |
|---|---|---|---|
| Orders | 130 | 144 | **+11%** |
| Revenue | A$103,083 | A$96,542 | -6% |
| **AOV** | A$793 | A$672 | **-15%** |

iPhone Like New is the **only major category where volume held (or grew) while AOV fell meaningfully**. That's the textbook signature of competitive price pressure:
- Demand is steady (volume not falling)
- You're selling units at lower prices to win them
- Customers are buying same volume at -15% lower per-unit

This is consistent with Reebelo and similar competitors entering Phonebot's keyword space (we saw "reebelo" appear at 19 clicks/24d in the GW Apr 2026 pull). They're competing in the Like New iPhone segment specifically.

A second weaker signal in the same direction is iPad Grade A (AOV -12% on -39% volume) but the volume drop muddies it.

## Apr 2026 absolute revenue gaps by category — what's worth fighting for

| Category | Sep 2025 rev | Apr 2026 30d-pro rev | Monthly $ gap | Annual $ gap |
|---|---|---|---|---|
| iPhone | 212,547 | 179,193 | -33,354 | **-A$400k/yr** |
| Samsung | 137,532 | 90,070 | -47,462 | **-A$570k/yr** |
| iPad | 97,567 | 44,186 | -53,381 | **-A$641k/yr** |
| Apple Watch | 21,402 | 13,268 | -8,134 | -A$98k/yr |
| MacBook | 20,700 | 2,439 | -18,261 | **-A$219k/yr** |
| Other | 12,346 | 6,058 | -6,288 | -A$75k/yr |
| Motorola | 10,143 | 3,813 | -6,330 | -A$76k/yr |
| Xiaomi | 5,964 | 0 | -5,964 | -A$72k/yr |
| **Total web gap** | | | **-A$182k/mo** | **-A$2.18M/yr** |

Note: this is web channel only. Store is growing and partially offsetting.

The **three categories that contain almost the entire gap are iPad, Samsung, and iPhone** (combined -A$134k/mo of A$182k total = 73%). MacBook is meaningful but smaller in absolute dollars.

## Cross-check against the organic search finding

The query-level Search Console finding (`step8_LOCKED_organic_query_diagnosis.md`) said Phonebot lost ~1,150 monthly clicks on "refurbished iphone/ipad/etc." purchase queries. At ~3% CR and AOV that varies by category, that organic loss roughly maps:

| Lost organic query | Category | Implied monthly revenue if recovered |
|---|---|---|
| "refurbished iphone" + variants (~600 lost clicks) | iPhone | ~A$11k @ 3% × A$595 AOV |
| "refurbished ipad" + variants (~300 lost clicks) | iPad | ~A$5k @ 3% × A$520 AOV |
| Branded "phonebot" loss (~600 clicks) | Mixed (commerce mix) | ~A$30k+ @ 10-15% CR |

**Roughly A$45-55k/mo** of the A$182k/mo gap is plausibly the organic+branded search loss — about a third. The other two thirds are likely the AW spend pull-back (consistent with the multi-window triangulation showing AW peak A$1,558/day → A$637/day = -A$28k/mo in profitable Google Ads spend that was driving incremental volume).

## What's actionable from this

### Decision-grade findings

1. **Margin held** — this is **not** a competitive-pricing crisis at the business level. Don't drop prices industry-wide. The margin trend is positive.
2. **iPhone Like New is the one segment where price pressure is real.** A$103k → A$97k revenue is small absolute dollars (-A$6k/mo), but the AOV drop suggests Reebelo-class competitors are eating share at the entry-level Like New iPhone tier. Worth a price-position check there specifically.
3. **iPad is the single biggest dollar gap (-A$53k/mo).** Both volume and price down. Worth diagnosing what changed: pricing, inventory mix, or organic visibility (the organic data showed `/apple-refurbished-ipad` lost 94% of its search clicks).
4. **MacBook went from a A$20k/mo line to a A$2k/mo line.** That's worth a direct decision — keep, exit, or fix.
5. **Up-market mix shift is a feature, not a bug** — fewer customers, but higher-AOV ones, with better margin. Suggests Phonebot's demand base has compressed to a more premium / higher-intent buyer cohort. Consistent with the loss of low-end "cheap iphones" search and walk-in-style brand traffic.

### Less-confident findings (need follow-up)

- Xiaomi/AirPods/Huawei went to zero — is this an active decision, an inventory issue, or invisible attrition? Easy clarification.
- The Brand New AOV +121% (A$453 → A$1,003) on -81% volume is a striking signature — only Brand New flagships still selling.

## Files
- `cross_checks/product_cliff_brand_yoy.csv` — full Brand-level YoY
- `cross_checks/product_cliff_condition_yoy.csv` — full Condition-level YoY
- `cross_checks/product_cliff_brand_x_condition_yoy.csv` — top Brand × Condition combos (rev_sep ≥ A$5k filter)

## Caveats
- Web channel only. Store is growing — would change the picture if a category (especially MacBook, iPad accessories) is being absorbed by store walk-ins.
- "Sep 2025" and "Apr 2026" are not perfectly seasonally matched — Apr is post-tax, Sep is pre-school spring. A true Apr 2025 vs Apr 2026 comparison would isolate seasonality but Apr 2025 CMS data is partial.
- Brand × Condition extraction is regex-based on free-text Products field. Some misclassifications likely; the order-of-magnitude trends are robust.
- Imputed GP uses Brand × Condition median margin lookup for GP=0 outliers. Margin numbers reflect imputed GP, not raw.
