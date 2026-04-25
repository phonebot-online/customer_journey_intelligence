# Store refunds — data quality flag
**Date:** 2026-04-25
**File:** `12_month/melbourne_store_sales/store_refunds_full_history.csv` (187 rows, 14 months)

## Issue

The Order ID column in store_refunds_full_history.csv does NOT match Order IDs in store_orders_full_history.csv. They appear to be from independent ID spaces (likely an export-side filter or a different source system).

## Implication

You CANNOT join store refunds to store orders at the order level. There's no way to mark a specific store order as "refunded."

## Workaround

Treat store refunds as an **aggregate revenue adjustment** at the period level (monthly or weekly). Specifically:

- For period-level net revenue: subtract sum of store refund `Total` from sum of store order `Total`
- For period-level net GP: subtract refund GP (use raw, not imputed — accessory/repair Cost Price=0 inflates margin) from order GP
- DO NOT attempt to flag individual store orders as `was_refunded` — there's no reliable join

## Volumes for context

- Store orders: 4,522 rows over 14 months
- Store refunds: 187 rows over 14 months
- Store refund rate (revenue): **14.4%** (much higher than web's 5.66%)
- Most-recent-30-days store refund rate: needs separate calculation

## What store refunds DOES have that web doesn't

The store refunds file has an `Email` column. Store orders does NOT have an Email column. So if you want repeat-customer analysis on refund victims, only refunds are linkable to email.

## Where this matters

- The combined web+store monthly summary in `12_month/cms_manual/combined_web_store_monthly.csv` uses period-level net revenue accounting. This is correct.
- Any analysis that tries to compute "store refund rate by SKU" or "store refund rate by employee" is BLOCKED until the source export is fixed.

## Recommendation

If/when F regenerates store data exports, request that the refund file include the original store Order ID (the one that appears in the orders file). That single change unlocks all order-level refund analysis.

## Files
- `12_month/melbourne_store_sales/store_orders_full_history.csv` (4,522 rows — orders)
- `12_month/melbourne_store_sales/store_refunds_full_history.csv` (187 rows — refunds, aggregate-only)
- `12_month/melbourne_store_sales/store_monthly_summary.csv` (uses aggregate net)
