---
name: AUD/GBP FX is a structural tailwind in 2026 — but smaller than April-spot suggests
description: Phonebot buys in GBP, sells in AUD; FX impact must be measured at procurement-month rates (~30d before sale), not sale-month rates
type: project
originSessionId: d958c794-740f-407a-8155-47c7f0871ef2
---
Phonebot imports refurb phones from UK suppliers (priced in GBP) and sells in AUD. Currency moves are a structural input to gross margin that has nothing to do with operations or marketing.

**Methodology correction (2026-04-30 — supersedes earlier "+11%" framing):**
COGS for sales in month X reflect the FX rate when the inventory was procured, which is ~30 days earlier (sometimes 30-60 days for UK auction lots). So YoY FX comparisons must be **procurement-month-to-procurement-month**, not sale-month-to-sale-month.

**RBA end-of-month spot rates (authoritative source — F11 historical data):**
| Procurement month | A$1 = £ | 1 GBP = A$ | YoY Δ |
|---|---|---|---|
| Feb 2025 (→ Mar 25 sales) | 0.4938 | 2.0251 | baseline |
| Mar 2025 (→ Apr 25 sales) | 0.4847 | 2.0631 | baseline |
| Feb 2026 (→ Mar 26 sales) | 0.5280 | 1.8939 | AUD **+6.48%** stronger |
| Mar 2026 (→ Apr 26 sales) | 0.5187 | 1.9279 | AUD **+6.55%** stronger |

**Procurement-corrected FX gift (NOT the April-spot 11% figure):**
- AUD strengthened ~**6.5%** vs same-month-prior-year on the procurement-relevant months for March/April 2026 sales
- At mid (65%) GBP-share of COGS:
  - **March 2026 sales:** ~A$650k revenue × 70% COGS × 65% GBP × 6.48% = **~A$19k/mo GP gift**
  - **April 2026 sales:** ~A$540k revenue × 70% COGS × 65% GBP × 6.55% = **~A$16k/mo GP gift**
- So the FX tailwind for March/April 2026 is approximately **A$15-19k/mo**, NOT A$25-30k/mo

**Why the old +11% number was wrong:** the prior memory anchored on Apr-2025-spot vs Apr-2026-spot (and got 11.05% from xe.com 1Y window). That conflates two issues: (a) it ignores procurement-to-sale lag — April sales already had COGS locked in at March FX, and (b) GBP/AUD movement was non-linear over the year, with most of the AUD strengthening happening in Apr-May 2026, AFTER the inventory used in Mar/Apr 2026 sales was bought.

**Caveats:**
- RBA F11 reports end-of-month spot rates, not within-month daily averages. True monthly averages will differ by ±0.3% but won't change the conclusion.
- Some inventory has 60-day procurement-to-sale lag (UK auction lots take 3-6 weeks to ship). For those, March 2026 sales used Jan 2026 FX rates (A$1.9635, only +1.6% AUD-stronger YoY), which would shrink the gift further. A blended 30-60d lag puts March's gift closer to ~5%, ~A$15k/mo.
- GBP-share of COGS is an assumption (mid 65%). If actual share is 50%, gift shrinks to ~A$12k/mo; if 80%, grows to ~A$23k/mo. Worth confirming with supplier mix.

**How to apply:**
- For any YoY comparison of GP, GP%, or profit-after-spend, use **6.5% procurement-corrected** FX delta, NOT 11% spot delta.
- Quote A$15-19k/mo gift range, NOT A$25-30k/mo.
- MoM comparisons (e.g. March vs April 2026) are unaffected by FX since the rate is roughly stable over a few weeks.
- The strategic-review numbers in `final_conclusions/STEP9_FINAL_CONCLUSIONS.md` and CLAUDE.md headline table need a recalc — the "FX-stripped underlying business is roughly flat YoY" claim is too optimistic. With the corrected FX gift (A$19k vs A$25-30k), underlying GP decline is closer to -A$50k YoY (March), not -A$56-61k.
