# CMS — initial QA pass (Step 3 fragment, run during Step 1/2 ingest)
**Source:** `/Users/mic/Downloads/cms order data/` (mounted)
**Files:** `feb sorted.xlsx`, `march sorted.xlsx`, `new april sorted.xlsx`
**Run date:** 2026-04-25

## Coverage
- Date range (parsed from `Date Added`): **2026-02-01 01:05:52 → 2026-04-24 23:04:13** (Australia/Perth assumed, no tz in source)
- Days covered: 83
- **Missing days inside the covered range: 0** ✅
- Daily order count range: 10–63
- 3-month window (1m1 / 3m / 6m / 12m): supports 1m and 3m only. **6m and 12m windows have no CMS coverage** — flag.

## Row counts and dedup
| File | Raw rows | Notes |
|---|---|---|
| feb sorted.xlsx | 975 | spans 2026-02-01 → 2026-03-01 |
| march sorted.xlsx | 1,005 | spans 2026-03-01 → 2026-04-01 |
| new april sorted.xlsx | 603 | spans 2026-04-02 → 2026-04-24 |
| **Combined raw** | **2,583** | |
| Duplicate Order IDs across files | 32 (boundary days Mar 1, Apr 1) | All "conflicting" pairs differ only because feb file has no `City` column → kept the row with `City` populated when present, else first by date. |
| **After dedup** | **2,551** | |

## Schema delta between files
- `feb sorted.xlsx` has 12 columns (no `City`).
- `march sorted.xlsx` and `new april sorted.xlsx` have 13 columns (include `City`).
- Result: 32 records from feb have null `City`. Non-blocking.

## Field types and parse cleanliness
- All money fields (`Total`, `Cost Price`, `Gross Profit`) are stored as strings like `"A$1,064"`. Parsed via strip-and-cast → **0 nulls** out of 2,583. ✅
- `Date Added` format: DD/MM/YYYY h:MM:SS am/pm. Parsed cleanly → **0 nulls**. ✅
- `Total Quantity` is numeric.

## Commercial sanity
- Total revenue (deduped): **A$1,328,680**
- Total gross profit (deduped): **A$334,543**
- Implied margin: **25.18%** (matches user-stated 25–28% band almost exactly)
- AOV: **A$520.85** (vs memory's A$564, which was based on 251 FB-attributed orders — a smaller and possibly higher-AOV subset)
- Repeat-customer rate within the 83-day window: **3.75%** (84 with 2 orders, 8 with 3+) — NOT lifetime; just within-window. Memory may need to track that lifetime is higher.

## Gross-profit consistency check
- Computed `Total - Cost - GP`: median 0, mean A$19.54, std A$152.46.
- **70 orders (2.74%) have |Total − Cost − GP| > A$50**.
- Pattern in the bad ones: **Cost Price = A$28–A$79 on phones priced A$1,000–A$4,300, AND Gross Profit = 0**. Concentrated on iPhone 17 Pro Max [Open Box]/[Brand New], iPhone Air, MacBook Air [Open Box], Motorola Razr 60 Ultra, OnePlus 15.
- **Hypothesis (to confirm with user):** these are sealed/brand-new SKUs whose COGS hasn't been entered yet — defaulted to a placeholder, with GP zeroed. Alternative: buyback-credit accounting where the credit is in `Cost Price`.
- **Severity: MEDIUM.** 2.74% of order count but high-AOV → revenue exposure ~A$60k of A$1.33M (~4.5%). Any "channel/SKU profitability ranking" must EITHER exclude or imputation-fill these orders.

## Field-presence gaps
| Needed for Step 7 | Present? |
|---|---|
| utm_source / utm_medium / utm_campaign | ❌ |
| gclid / fbclid / ms_click_id | ❌ |
| is_first_order | ❌ (can derive from Email frequency, but only within 83-day window) |
| is_returned / refund_amount | ❌ |
| customer_id stable | ❌ (Email used as proxy — fine for dedupe) |
| line-item unit_cogs | ❌ (only order-level Cost Price) |
| brand / category / SKU explicit | ❌ (in `Products` text — parseable but messy) |

→ **Channel attribution at order level is impossible from this export alone.** All channel cross-checks vs CMS will be at the **aggregate daily/weekly revenue level**, not order-by-order.

## Geographic
- 8 AU states present + 3 NZ rows (Canterbury 1, Otago 1, NaN State 3). NZ traffic is negligible — flag, do not let it skew state-level analysis.
- VIC > NSW > QLD > WA > SA > ACT > TAS > NT.

## Verdict
- CMS extract is **PASS** for use as commercial truth at aggregate level for the **1m and 3m windows**.
- Caveats to carry forward into every CMS cross-check:
  1. No order-level channel attribution → cross-checks aggregate only
  2. ~70 orders have GP=0 → exclude or impute before margin claims
  3. No refund signal → revenue here is gross of returns
  4. No 6m/12m coverage → those windows fall back to GA4 + ProfitMetrics GA4 as commercial proxy
