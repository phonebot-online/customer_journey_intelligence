# Step 7 LOCKED — Campaign-level triangulation, last 30 days
**Window:** 2026-03-26 → 2026-04-24 (30 days)
**Date locked:** 2026-04-25
**Sources:** AW + AC platforms + GA4 main AU + ProfitMetrics Revenue + ProfitMetrics GP
**Note:** FB campaigns are entirely missing from GA4 — Phonebot's FB ads do not utm-tag or are blocked by the `fbclid` server bug. Cannot triangulate FB at campaign level from current data.

## Locked numbers per campaign (30d)

| Source | Campaign | Spend | Platform Rev | GA4 Rev | PM Rev | PM GP | Platform ROAS | Real ROAS | Over-attrib | **Net Profit** |
|---|---|---|---|---|---|---|---|---|---|---|
| google | **CJ - Phonebot (B)** | A$2,577 | A$72,012 | A$67,725 | A$57,240 | **A$14,833** | 27.95× | 22.21× | 1.3× | **+A$12,256** ★ |
| google | CJ - PMax (Samsung) | A$2,876 | A$30,804 | A$24,274 | A$19,619 | A$5,722 | 10.71× | 6.82× | 1.6× | +A$2,846 |
| google | CJ - PMax (Apple) iPad | A$3,644 | A$30,919 | A$22,263 | A$20,186 | A$6,278 | 8.48× | 5.54× | 1.5× | +A$2,634 |
| google | **Phonebot (B) Standard Shopping** | A$336 | A$11,130 | A$12,389 | A$9,012 | A$2,146 | 33.14× | 26.83× | 1.2× | **+A$1,810** ★ |
| bing | CJ - Refurbished Phones | A$763 | A$4,184 | A$5,637 | A$7,494 | A$2,426 | 5.49× | 9.83× | 0.6× | +A$1,664 |
| bing | **CJ - Phonebot (B)** | A$121 | A$10,547 | A$7,101 | A$7,376 | A$1,667 | 87.10× | 60.91× | 1.4× | **+A$1,546** ★ |
| bing | CJ - Bing Shopping (All Products) | A$792 | A$6,071 | A$4,927 | A$4,402 | A$2,050 | 7.67× | 5.56× | 1.4× | +A$1,259 |
| google | CJ - PMax (Google) | A$991 | A$9,950 | A$8,970 | A$5,797 | A$1,545 | 10.04× | 5.85× | 1.7× | +A$554 |
| google | PMax - Covers - Excl.Products | A$81 | A$4,681 | A$1,889 | A$1,521 | A$514 | 57.84× | 18.80× | 3.1× | +A$433 |
| google | CJ - Refurbished Phones | A$1,233 | A$12,687 | A$7,040 | A$5,821 | A$1,644 | 10.29× | 4.72× | 2.2× | +A$411 |
| google | SS - Excluded Products - >$100 | A$430 | A$3,375 | A$4,282 | A$2,925 | A$799 | 7.86× | 6.81× | 1.2× | +A$369 |
| google | CJ - PMax (< $100 / Accessories) (PB) | A$198 | A$1,112 | A$964 | A$883 | A$496 | 5.61× | 4.46× | 1.3× | +A$298 |
| google | CJ - PMax (Apple) [non-iPad] | A$1,654 | A$15,825 | A$10,270 | A$7,504 | A$1,874 | 9.57× | 4.54× | 2.1× | +A$220 |
| google | SS - All Products >$1000 | A$1,719 | A$16,025 | A$7,855 | A$5,525 | A$1,922 | 9.32× | 3.21× | 2.9× | +A$203 |
| google | PMax - Apple Watches | A$751 | A$5,987 | A$5,122 | A$2,897 | A$884 | 7.97× | 3.86× | 2.1× | +A$133 |
| google | CJ - Phonebot (B) - Lower ROAS | A$1,002 | A$7,237 | A$4,336 | A$4,944 | A$1,086 | 7.22× | 4.93× | 1.5× | +A$83 |
| google | **CJ - PMax (Everything Else)** | A$887 | A$5,889 | A$5,273 | A$2,020 | A$786 | 6.64× | 2.28× | 2.9× | **-A$101** |
| google | CJ - DSA (All Pages) | A$96 | A$830 | A$708 | A$0 | A$0 | 8.61× | 0.00× | 830× | -A$96 |
| google | **PMax - iPhone 17** | A$104 | A$75 | A$0 | A$0 | A$0 | 0.72× | 0.00× | 75× | **-A$104** |
| google | CJ - Sell Phone For Cash (AU) | A$181 | A$0 | A$0 | A$0 | A$0 | 0.00× | 0.00× | — | -A$181 (lead-gen, expected) |
| bing | Standard Shopping (Apple) - iPads | A$25 | A$0 | A$0 | A$0 | A$0 | 0.00× | 0.00× | — | -A$25 |
| google | **Standard Shopping - iPhone 17** | A$343 | A$0 | A$0 | A$0 | A$0 | 0.00× | 0.00× | — | **-A$343** |

**Bottom line:** A$20,806 paid spend → A$165,166 PM revenue → A$46,672 PM GP → **A$25,869 net profit (124% return on ad spend at GP level)**

---

## Key findings

### 1. Brand campaigns dominate net profit
- **CJ - Phonebot (B)** is by far the most profitable: A$12,256 net profit, **47% of total ad-driven net profit** comes from one brand campaign.
- **Phonebot (B) Standard Shopping** + **Bing Phonebot (B)**: combined A$3,356 more from brand variants.
- **Brand campaigns combined: ~A$15,612 / A$25,869 = 60% of net profit on 14% of spend**.
- This is classic "brand harvest" — Google search for "phonebot" returns Phonebot's own ad above its own organic listing. The user typed the brand name; the campaign captures the click but the demand existed without it.

### 2. Apple iPad PMax is genuinely strong but lower-margin than brand
- A$3,644 spend → A$6,278 PM GP → A$2,634 net profit (largest non-brand line)
- Real ROAS 5.54× vs platform-claimed 8.48× — modest 1.5× over-attribution
- This is the biggest non-brand campaign and earns its keep.

### 3. Three campaigns to PAUSE immediately
- **Standard Shopping - iPhone 17** (A$343 spend, **0 PM purchases**) — the inventory probably isn't actually live or iPhone 17 isn't well-tagged. Net loss A$343/30d.
- **PMax - iPhone 17** (A$104 spend, 0 PM, but platform claims A$75 — 75× over-attribution). Same iPhone 17 issue. Net loss A$104.
- **CJ - PMax (Everything Else)** (A$887 spend, 2.28× real ROAS = -A$101 net at 25% margin). Diluted catch-all — recategorise SKUs into specific PMax campaigns.

### 4. Bing CJ - Phonebot (B) brand at A$121/30d is undersized
- 60.91× real ROAS, A$1,546 net profit on A$121 spend (12.8× return on ad spend at GP level)
- Almost certainly underspending. Consider testing 2-3× budget increase on Bing brand (capacity may be capped by query volume).

### 5. PMax Covers/Accessories is high-efficiency but tiny
- A$81 spend → 18.80× real ROAS → A$433 net profit
- Tiny but profitable. Worth a small budget bump to test scale.

### 6. Google Ads' "All conversions" inflates 4-5×
- CJ - Phonebot (B): platform AllConv value A$301,637 vs PM rev A$57,240 = 5.3× over-claim on AllConv basis.
- Don't use AllConversionsValue for ROAS calculations. Stick with platform-claimed (Conversions only) which is closer; better still, use PM.

### 7. FB at campaign level: data unavailable
- Zero FB campaigns appear in GA4 last-click. Confirms upstream tracking break (missing utm tags / broken fbclid).
- FB platform claims A$141,569 → 19.4× ROAS → almost certainly real contribution is somewhere between A$3k (GA4 last-click on Paid Social channel) and A$50k (generous incrementality estimate).
- **Cannot run campaign-level FB triangulation without fixing the pixel/tagging first.**

---

## Spend reallocation (high-confidence portion)

**Cut:**
- Standard Shopping - iPhone 17 → 0 (save A$343/mo)
- PMax - iPhone 17 → 0 (save A$104/mo)
- CJ - PMax (Everything Else) → review/recategorise (save partial of A$887/mo)
- CJ - PMax (Apple) [non-iPad] → review (only A$220 net profit on A$1,654 spend = 1.13× GP/spend — barely break-even)

**Test up:**
- Bing CJ - Phonebot (B): A$121 → A$300/mo, watch for diminishing returns (likely query-volume capped)
- PMax - Covers: A$81 → A$200/mo, watch
- CJ - Phonebot (B) [Google]: try A$2,577 → A$3,500/mo to check if 22× ROAS holds (likely doesn't — brand is saturated, but worth testing)

**Hold:**
- CJ - PMax (Apple) iPad — biggest non-brand winner, hold spend
- CJ - PMax (Samsung) — solid 6.8× real ROAS
- CJ - Refurbished Phones (Bing): 9.8× real ROAS on A$763 spend, slight bump worth testing

---

## Caveats
- 30d window. Campaign-level triangulation should be repeated at 90d for stability.
- Brand campaign profitability assumes the Real ROAS is "incremental". If most brand-search clickers would have found Phonebot anyway (clicking organic), the **true incremental contribution of brand campaigns is closer to zero** — they're harvesting demand they already have. Same logic that applies to FB applies here. A brand-pause test would clarify.
- Some campaign names don't perfectly match between AW (campaign field) and GA4 (`sessionCampaignName`). Where mismatches occur, I joined on exact-string match; ~3% of spend fell to no-match (the unmatched campaigns appear with PM rev = 0 in the table).
- "Net profit" = PM GP - Ad spend. Doesn't include other costs (operations, COGS already in GP, fulfilment, refund liability).
