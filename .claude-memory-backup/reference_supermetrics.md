---
name: Supermetrics MCP for live data fetches
description: How to fetch fresh data into the Phonebot dashboard via Supermetrics MCP — auth state, account IDs, common report types
type: reference
originSessionId: 7f03a6f6-333e-4d69-9a8e-e35bdc01ba82
---
The user's Supermetrics MCP is authenticated for the data sources below. Use `data_query` followed by `get_async_query_results` to fetch fresh data; output usually exceeds context limits and gets persisted to a file you can extract with `jq`.

**Authenticated data sources & account IDs:**
- Google Ads (`AW`) — account `3900249467` (Phonebot)
- Google Merchant Center (`GMC`) — account `101150783` (Phonebot)
- Google Analytics (`GAWA`) — 5 accounts, all under `Phonebot3073@gmail.com`:
  - `284223207` — Phonebot - GA4 (vanilla GA4, AU primary — matches BQ dataset name)
  - `488590631` — Phonebot - ProfitMetrics Revenue (GA4 property with PM revenue attribution injected)
  - `488618020` — Phonebot - ProfitMetrics Gross Profit (GA4 property with PM GP attribution)
  - `434168263`, `433775991` — Phonebot AE (UAE entity, not used)
- Microsoft Ads / Bing (`AC`) — present
- Facebook Ads (`FA`) — present
- Brevo (newsletter source) — present
- Search Console — present

**ProfitMetrics CSVs are NOT manual exports** — they refresh via GAWA accounts above. Channel revenue → ds_id=GAWA, ds_accounts=488590631. Channel GP → 488618020.

**Important Google Ads quirk:** the `branded_vs_nonbranded` dimension requires `brand_keywords` setting. Use:
```
settings={"brand_keywords": "phonebot|phone bot|phonebot.com.au"}
```

**GAWA quirk:** `DefaultChannelGroup` is incompatible with `Transactions` (Supermetrics raises "Field Conversion default channel grouping is incompatible with Transactions"). Use `SessionDefaultChannelGroup` instead — it's the session-attributed equivalent that joins cleanly with session-attributed transaction metrics.

**GAWA AU filter:** all dashboard CSVs are AU-only — pass `filters="Country == Australia"`. (Older versions of `channel_summary_30d_AU.csv` were missing the filter, inflating organic numbers ~50%.)

**GMC product report:** use `report_type: "product"` to get the full feed including `product__item_id` (the offer_id needed for joining to Shopping ad data). Each product appears twice (online + local channel) — dedupe in DuckDB.

**CSV output convention:**
- Google Ads → `1_month/google_ads/<report_name>.csv`
- GMC → `1_month/google_merchant_center/<report_name>.csv`
- GA4 → `1_month/ga4/<report_name>_AU.csv`
- ProfitMetrics → `1_month/profit_metrics/<report_name>.csv`
- Match the existing CSV pattern in those folders

**CRITICAL: rewrite the CSV header row before saving.** Supermetrics returns *display names* with spaces and label characters (`"Offer ID"`, `"Product Title"`, `"Total conversion value"`, `"Session default channel grouping"`, `"Add-to-carts"`). DuckDB schema in `app/api/lib/duckdb.ts` expects schema-style names without spaces (`OfferId`, `ProductTitle`, `ConversionValue`, `Channel`, `AddToCarts`). If you don't rewrite the header, `read_csv_auto` will succeed silently and the columns will be NULL across the dashboard. Always: `{ echo "<expected_header>"; tail -n +2 raw.csv; } > out.csv`.

**How to extract from MCP file output:**
```bash
jq -r '.[0].text | fromjson | .data.data | .[] | @csv' "$RESULT_FILE" > "$OUT.csv"
```

**Why:** User wants to unblock data analyses that previously required them to manually export CSVs. The Supermetrics MCP allows current Claude to fetch directly. Saves ~30min per fetch + lets Claude refresh data before each analysis.

**How to apply:** Before suggesting "you'd need to export X" as a blocker, check if Supermetrics has the source authenticated. For most paid-media + e-commerce data, it does.
