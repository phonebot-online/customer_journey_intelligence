# CMS — refreshed QA pass after full-history attachment
**Source:** `/Users/mic/Downloads/cms order data/` (9 .xlsx files now attached)
**Run date:** 2026-04-25
**Coverage:** Mar 2025 → Apr 2026 (24 days), with **Jul-Nov 2025 missing** (5 months / 153 days)

## Headline numbers
- **9,583 unique orders** after dedup (9,642 raw, 59 boundary dups removed)
- Total revenue: A$4,822,285
- Total GP: A$1,150,613
- Blended margin: **23.86%**
- AOV: A$503.21
- 0 parse failures across 9 files. ✅

## Coverage map by month
| Month | Orders | Revenue | GP | AOV | Margin% |
|---|---|---|---|---|---|
| 2025-03 | 1,180 | A$626k | A$177k | A$531 | **28.25%** |
| 2025-04 | 1,008 | A$604k | A$149k | A$600 | 24.63% |
| 2025-05 | 1,326 | A$600k | A$131k | A$453 | 21.85% |
| 2025-06 | 1,350 | A$602k | A$135k | A$446 | 22.49% |
| 2025-07 to 2025-11 | **MISSING** | — | — | — | — |
| 2025-12 | 1,294 | A$614k | A$124k | A$474 | **20.22%** (low) |
| 2026-01 | 874 | A$447k | A$100k | A$511 | 22.31% |
| 2026-02 | 943 | A$490k | A$115k | A$520 | 23.57% |
| 2026-03 | 979 | A$530k | A$135k | A$541 | 25.39% |
| 2026-04 (1-24) | 629 | A$309k | A$85k | A$491 | **27.37%** (recovering) |

## CRITICAL BUSINESS-LEVEL FINDINGS

### 1. YoY decline is real and material
- **March YoY (only month with both years available)**: orders **-17.0%**, revenue **-15.4%**, **GP -23.9%**, margin -2.9pp.
- **April YoY (per-day, since Apr 2026 partial)**: revenue per day -36.1%, GP per day -29.0%.
- **The recent FB "fixes" have improved unit economics on a SMALLER underlying business.** Memory's framing of "profitable account, NOT broken" was right at the FB-account level but **misses the macro picture**: total business volume has been declining all year.

### 2. Margin compression May–Dec 2025, recovery in 2026
- Margin trajectory: 28.25% (Mar 25) → 24.63% (Apr 25) → 21.85% (May 25) → 22.49% (Jun 25) → [gap] → **20.22% (Dec 25, low)** → 22.31% → 23.57% → 25.39% → 27.37% (Apr 26).
- Q2 2025 was when margins compressed most. Need to figure out what happened (price war? COGS spike? promotional tactics?).
- Recovery in 2026 is real but on a smaller revenue base.

### 3. AOV up while order volume down
- AOV climbed from A$446 (Jun 25) to A$541 (Mar 26).
- Order volume dropped from 1,350 (Jun 25) to 874 (Jan 26) — **-35%**.
- **Hypothesis:** Phonebot has shifted from a high-volume mid-priced refurb seller toward a lower-volume premium-phone seller. Worth validating against PMax-Apple-iPad spend (which dominates Google Ads).

### 4. Repeat customer rate within 14 months: 5.10%
- 8,957 unique customers; 457 of them bought twice, 62 bought 3+ times, 21 bought 4+.
- **Median time between 1st and 2nd order: 31 days.** Suggests these are mostly accessory/add-on purchases or quick replacements, NOT the 12-24 month replacement cycle.
- P75 = 210 days; P90 = 311 days. Most repeats are well within a year.
- Note: actual lifetime repeat rate is higher — 5-month gap (Jul-Nov 2025) means we're missing some history that would qualify additional customers as repeats.

## Coverage / data-quality flags

### Missing months
- **Jul, Aug, Sep, Oct, Nov 2025 — no data attached.** 153 missing days inside the 14-month span.
- Impact:
  - 6m window (last 180 days = ~Oct 27 2025 forward): **partially affected** — Nov 2025 missing.
  - 12m window (last 365 days = ~Apr 26 2025 forward): **heavily affected** — 5 months gone.
  - Cross-channel cross-checks at 6m/12m must explicitly flag the gap.

### GP=0 outliers refreshed
- Now 379 orders (up from 65 with smaller dataset), 3.95% of orders, A$240,836 revenue exposure (4.99% of revenue).
- Pattern unchanged: high-priced phones with implausibly low Cost Price + GP=0.
- Already excluded from `cms_orders_clean_<window>_excl_gp0.csv` files.
- File for user review: `qa_checks/cms_gp_zero_orders_to_review.csv` (refreshed).

### Boundary dups
- 59 Order IDs appear in two adjacent month files (e.g., March 1 appears in both Feb and March file). Kept first occurrence; net 9,583 unique.

## Verdict
- **CMS extract: PASS** for use as commercial truth at:
  - **Daily aggregate** for 1m, 3m, and most of 6m windows.
  - **Monthly aggregate** for 12m window (with the gap clearly flagged).
- Caveats (carry into every CMS cross-check):
  1. No order-level channel attribution (no utm/gclid/fbclid). Cross-checks aggregate only.
  2. 379 orders excluded for GP=0 (Cost Price data missing).
  3. No refund flag — revenue is gross of returns.
  4. Jul-Nov 2025 gap means 6m and 12m commercial-truth comparisons against ad spend are partial; flag prominently.
  5. NZ orders (Canterbury, Otago) tiny but present; non-Australia.
