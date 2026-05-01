---
name: Always normalize Supermetrics CSV headers before saving
description: Rewrite the header row to match DuckDB schema names; failure mode is silent NULL columns across the dashboard
type: feedback
originSessionId: 8871e6a3-e034-4bc7-bb64-b9fd0411c2de
---
When fetching CSVs via Supermetrics MCP for the Phonebot dashboard, **always rewrite the header row** before saving to `1_month/<source>/<file>.csv`. Use the field-name format the existing CSV uses (which matches `app/api/lib/duckdb.ts`).

**Why:** Supermetrics returns *display names* — `"Offer ID"`, `"Product Title"`, `"Total conversion value"`, `"Session default channel grouping"`, `"Add-to-carts"`, `"Total users"`. DuckDB's `read_csv_auto` succeeds without errors but the renamed columns become NULL — broken silently. We hit this 2026-04-30 when shopping_sku_7d.csv was written with raw headers and the SKU panel rendered blank rows.

**How to apply:**
1. Before writing, `head -1 1_month/<source>/<file>.csv` to see the existing header (which is the contract with DuckDB)
2. Pipe the raw MCP output through a header rewrite:
   ```
   { echo "<existing_header>"; tail -n +2 raw.csv; } > out.csv
   ```
3. Reference table of common renames:
   - `"Campaign name"` → `"Campaign name"` (already correct, but used in shopping where header is `Campaign name` without quotes)
   - `"Offer ID"` → `OfferId`
   - `"Product Title"` → `ProductTitle`
   - `"Total conversion value"` → `ConversionValue` (or `Conversionsvalue` for daily campaign data)
   - `"All conversion value"` → `AllConversionsvalue`
   - `"Session default channel grouping"` → `Channel`
   - `"Total users"` → `Total_users`
   - `"New users"` → `New_users`
   - `"Transactions"` → `Purchases`
   - `"Purchase revenue"` → `Revenue`
   - `"Add-to-carts"` → `AddToCarts`
   - `"Item ID"` (GMC) → `Item ID` (header keeps the space — used as `"Item ID"::VARCHAR` in DuckDB)
4. After writing, restart the API (`pkill -f 'tsx api/boot.ts' && npx tsx api/boot.ts`) — DuckDB reloads CSVs only on `initSchema()` at boot.
