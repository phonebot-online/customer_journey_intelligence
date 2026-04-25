# Store data — QA notes
**Files:** `/Users/mic/Downloads/cms order data/store order 1st march 2025 to 24 april 2026.xlsx` + `store refunds march 2025 to april 2026.xlsx`
**Date:** 2026-04-25

## Summary
- **4,522 store orders, 187 store refunds** across Mar 2025–Apr 2026 (14 months, 413 covered days).
- Total store revenue: **A$2,380,768**.
- Raw GP: **A$611,943 (25.70%)** — coincidentally close to web's 25.33% imputed margin, but composition differs.
- Single Postcode dominates: 3073 (Reservoir VIC). Some 3083, 3087 etc — nearby suburbs.
- Platform field = "Store" for all rows — clean differentiator from web.

## Schema differences from web orders
- **No Email column** in store orders file — walk-ins don't always provide email. Refund file does have Email but uses `walkin_customer@phonebot.com.au` placeholder for ~50% of refunded orders.
- **No City column** (only Postcode).
- Otherwise same columns: Order ID, Postcode, Products, Total Quantity, Total, Cost Price, Gross Profit, Date Added, Payment Method, Platform.
- Refund file adds Status column (always "Returned & refunded") and Email.

## Key categorisations (extracted from Products text)
| Category | Orders | % orders | Rev | % rev | Margin% | AOV |
|---|---|---|---|---|---|---|
| **Device** (phones, tablets, watches, MacBooks) | 3,156 | 69.8% | A$2,254,404 | 94.7% | 22.71% | A$714 |
| **Repair Service** (screen replacement, battery, diagnostics, "pending paid for...") | 315 | 7.0% | A$56,695 | 2.4% | **91.42%** | A$180 |
| **Accessory** (covers, cases, glass protectors, cables, chargers) | 518 | 11.5% | A$20,706 | 0.9% | **77.58%** | A$40 |
| **Other** | 533 | 11.8% | A$48,963 | 2.1% | 65.59% | A$92 |

## Data quality flags

### 1. Refund file Order IDs do NOT match store orders
- 187 store refund Order IDs: **0** match the store orders file, **0** match web orders file.
- These IDs (e.g. 220539, 219739, 219356) are in the same numeric range as web/store orders.
- **Likely cause:** the store orders export filters out orders that have been refunded (status = "completed" only). The refunds file captures the refund records separately.
- **Implication:** can't link individual refunds to individual orders. Treat refunds as a separate revenue-adjustment line.
- **Total store refund revenue: A$342,772** (subtract from gross).

### 2. GP=0 only on 7 orders (0.15%)
F flagged that "GP from store orders and refunds might be missing because cost of some accessories and store repair orders we don't actively insert". The data shows this differently than expected:
- **GP=0 orders are minimal** (7 orders). Most GP=0 cases are in the refund file (where GP is zeroed by design).
- The "missing cost" pattern instead shows up as **inflated GP%**:
  - Repair Service: 91.42% margin — too high for goods, but reasonable for **labor** (since no COGS is tracked, the entire revenue ≈ labor + parts; if parts not entered, margin reads as ~100%).
  - Accessories: 77.58% margin — much higher than typical accessory margins. Suggests Cost Price genuinely not entered for many SKUs (cover, glass protector, cable) where the entries show A$0 cost.
- **How to interpret:** Store-derived GP totals at the line-item level are upper bounds. For "accessory profitability" claims specifically, treat with caution. Device-level margins (22.7%) look correct and align with web margins.

### 3. Store data has its OWN Order ID space
- 0 overlap with web orders, 0 with web refunds. Confirmed safe to combine without dedup.

### 4. Walk-in customer placeholder
- ~50% of store refund records have email `walkin_customer@phonebot.com.au` — this is a placeholder. Useful flag to identify walk-in vs known customer, but not joinable to anything.

## Net store revenue
- Gross: A$2,380,768
- Refunds: A$342,772
- **Net store revenue: A$2,037,996** (14.4% refund-adjusted)
- **Refund rate by $: 14.4%** of gross — much higher than web's 5.7%. (But note: 75% of store refund revenue is on items not in the orders file; could be selection effect if older orders being returned in this window are over-represented).

## How to use store data going forward
- **Combine with web for "true business" YoY claims.** Web-only YoY decline (-15% rev) overstates the problem; combined is -10%.
- **Don't trust accessory/repair GP at face value** — flag as "lower bound on cost, upper bound on margin".
- **Device segment** in store is comparable to web for cross-channel analysis.
- **Refunds are subtracted at aggregate level**, not joined to individual orders.
- The Reservoir store is currently the ONLY physical location in scope (UAE Burjuman is AE, out of scope per F).
