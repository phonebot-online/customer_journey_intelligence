# Manual data drop zone
This folder is the canonical place to attach first-party data files that aren't pullable via Supermetrics or any connector.

## Currently expected
| Source | Filename pattern | When attached, place in… | What it unlocks |
|---|---|---|---|
| **CMS web orders** (Phonebot ecom — Feb–Apr 2026) | `feb sorted.xlsx`, `march sorted.xlsx`, `new april sorted.xlsx` | already mounted at `/Users/mic/Downloads/cms order data/` | Order-level revenue + GP for AU online sales |
| **CMS web orders — older history** (pre-Feb 2026) | any xlsx/csv export from CMS, any naming | drop here, then I'll dedup against existing | Unblocks 6-month and 12-month commercial-truth cross-checks |
| **Melbourne store sales** (physical POS) | any csv/xlsx export from POS — daily or per-transaction | drop here, with the source in the filename (e.g. `melbourne_pos_2026-Q1.csv`) | Closes the gap between FB "Engagement store +10km radius" / GMB phone+directions actions and actual in-store revenue |

## What I need in the Melbourne store file (minimum viable)
At minimum, daily totals are usable:
- Date (DD/MM/YYYY or YYYY-MM-DD)
- Total revenue (AUD)
- Total transactions
- Total gross profit (or Cost Price so I can derive)

Better (per-transaction):
- Transaction ID, Date+Time, Total, Cost, GP, Payment method, optional Customer email/phone

Best (with attribution):
- Channel hint per transaction — "walk-in", "phone-in", "web pickup", "WhatsApp", "Google Maps lookup"
- This lets us tie the Melbourne POS to GMB phone calls/directions and to the FB local engagement campaign.

## Naming convention I'll use after parsing
- Per-window cleaned files land in `/customer_journey_intelligence/<window>/melbourne_store_sales/melbourne_pos_clean_<window>.csv` (mirroring how CMS is laid out).
- Original raw uploads stay in this folder untouched.
