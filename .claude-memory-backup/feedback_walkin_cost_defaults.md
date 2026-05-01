---
name: Phonebot store walk-in cost defaults (when Cost Price = $0)
description: Three-tier rule for imputing cost on store walk-in orders that have no SKU and no cost price recorded
type: feedback
originSessionId: d958c794-740f-407a-8155-47c7f0871ef2
---
When analyzing Phonebot **store** orders where `Cost Price = A$0` and `Total > 0` (typically free-text walk-in entries with `ID : 0`), apply these cost defaults instead of treating GP as overstated:

- **Accessory: cost = 40% of sell price.** Includes: covers, cases, glass protectors / tempered glass (incl. shorthand like `tgx1`, `tg`), chargers, cables, adapters, power banks, watch chargers, pop sockets, sim trays, camera lenses, USB connectors, audio accessories.
- **Repair (with labour): cost = 50% of sell price.** Includes: screen replacement, battery replacement, back repair, face ID flex, software reset, cleaning, custom OS install (graphene), assessment fees, "paid for X repair" entries, "advance paid for X" repair deposits, named-tech repair lines.
- **Parts-only sales: cost = 60% of sell price.** When a customer buys just the part to take away (no labour) — e.g. "screen for SE 3rd gen", "ipad 9th gen screen + battery", "mate 20 screen only parts given to cx". These compete with eBay/AliExpress so margin is genuinely lower than bundled repair.

**Why:** the historical 12mo data has cost recorded on only ~15% of accessory rows and most of those use $1 placeholders, so any "average from history" is meaningless. The user (Phonebot owner) supplied these defaults from knowledge of their own wholesale prices.

**How to apply:** when computing imputed costs for set-aside walk-in anomalies, classify by keyword first (parts-only signals: "screen for X", "battery for X", "parts given to cx"; accessory signals: cover/case/glass/charger/cable; repair signals: replacement/repair/install/assessment/cleaning), then apply the matching rate. The walk-in classifier in the April analysis is a working reference. Do not silently exclude these rows — show clean cohort + imputed cohort separately so the user can see what's measured vs estimated.
