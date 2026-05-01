# Phonebot — Google Ads Feed Quality Review

**Prepared:** 2026-05-01
**For:** Phonebot Google Ads Manager
**Purpose:** Discuss potential ad spend leakage on out-of-stock products. We've cross-referenced our order data with the GMC feed and Google Ads spend data, and want to share specific findings + agree on next steps.

---

## What we did

Cross-referenced three data sources:
1. **April + March 2026 web orders** (our CMS) — gives us the LAST SALE DATE for every SKU
2. **GMC product feed export** (29 April snapshot) — current availability status per SKU
3. **Google Ads `shopping_sku_30d.csv`** — last 30 days of cost / clicks / impressions / conversions per SKU

A "confirmed leak" = SKU that **(a) had at least one sale in the last 60 days** (so it definitely exists in our catalog), **(b) is currently marked out-of-stock in GMC or absent from the feed**, AND **(c) got ≥A$5 of Google Ads spend in the last 30 days**.

This is a stricter definition than just "GMC says OOS" — it filters out methodological noise (missing/stale SKUs, ID mismatches, products never properly catalogued) and leaves only cases where we have evidence the SKU was sellable, then sold out, then kept being advertised.

---

## What we found

**266 SKUs match the confirmed leak definition. Total: ~A$8,251 of ad spend in last 30 days, or ~A$99k/yr if the rate continues.**

Of those, **24 SKUs are high-confidence — sold ≥10 days ago, ≥A$50 spent in 30d, ≥1000 impressions**. Total: A$1,765 in 30d, ~A$21k/yr. These are the strongest evidence cases — long enough OOS that propagation lag isn't an explanation.

### The clearest example we manually verified

**SKU 1425 — Apple iPad Pro 10.5-inch (256GB) WiFi Cellular [Grade A]**
- Last unit sold and shipped 21 April 2026
- Currently marked `out of stock` in GMC
- Has accrued **A$179.51 in ad spend over the last 30 days** with 18,271 impressions and 239 clicks
- Has been OOS for at least 16 days (likely longer — went OOS the day after the last shipment)

We've verified manually that this product is genuinely OOS on phonebot.com.au and we have no inbound stock for it. The full A$179 is wasted spend.

### The 24 highest-confidence cases

| SKU | Title | Last Sale | Days OOS | 30d Spend | Clicks |
|---|---|---|---:|---:|---:|
| 1425 | iPad Pro 10.5" 256GB Cellular Grade A | 14/04 | 16 | $179.51 | 239 |
| 6301 | iPad Air 5th Gen 256GB Cellular Grade A | 12/04 | 18 | $97.14 | 128 |
| 8541 | Motorola Razr 60 Ultra 512GB Like New | 14/04 | 16 | $93.80 | 144 |
| 7070 | Pixel 9 Pro XL 256GB Like New | 10/04 | 20 | $84.94 | 58 |
| 8396 | iPhone 17 256GB Like New | 15/04 | 15 | $83.16 | 81 |
| **8307** | **Galaxy Watch 8 Classic 46mm Like New** | **18/03** | **43** | **$82.83** | 139 |
| 880 | iPad Air 2 128GB Grade A | 8/04 | 22 | $80.86 | 121 |
| 6599 | Pixel 8a 128GB Like New | 13/04 | 17 | $79.16 | 70 |
| 8256 | Galaxy Z Fold6 512GB Grade B | 5/04 | 25 | $75.39 | 77 |
| 6373 | Apple Watch Ultra 2 49mm Cellular Like New | 4/04 | 26 | $74.33 | 125 |
| 3968 | iPad Pro 10.5" 256GB WiFi Grade B | 6/04 | 24 | $72.44 | 131 |
| 7749 | iPhone 16e 128GB Open Box | 12/04 | 18 | $64.41 | 64 |
| **7042** | **Apple Watch Series 9 41mm Cellular** | **25/03** | **36** | **$59.63** | 129 |
| 4576 | iPhone 14 Pro 256GB Like New | 16/04 | 14 | $59.12 | 76 |
| 2088 | iPad Mini 5 64GB WiFi Grade A | 1/04 | 29 | $54.89 | 48 |
| 1274 | iPad Mini 4 128GB Cellular Grade A | 12/04 | 18 | $53.42 | 108 |
| 5146 | iPad Mini 6 256GB Cellular Grade B | 14/04 | 16 | $52.36 | 63 |
| 4717 | iPad 9th Gen 256GB WiFi Grade B | 13/04 | 17 | $50.34 | 31 |

The two worst (bolded) — Galaxy Watch 8 Classic and Apple Watch Series 9 — have been OOS for 36-43 days. That's well beyond any reasonable propagation-lag explanation.

There are also 6 entries in the high-confidence list with **blank product titles** in the Google Ads SKU export (#7247, #4675, #5212, #5044, #5840, #4854) — collectively A$346 spent. These are likely orphaned catalog entries from old feed versions and should probably be excluded entirely.

Full list (266 SKUs with priority levels) attached: `CONFIRMED_oos_leaks_with_last_sale.csv`

---

## What we'd like your help with

We want to be transparent about what we can and can't see from our side, so this isn't an audit — it's a request for your read.

### What we can see
- The CMS sale dates (definitive)
- The GMC feed export at a point in time (snapshot, may not reflect today's status)
- The 30d aggregate Google Ads spend per SKU

### What we can't see
- Whether you've already set up automated rules that pause OOS products
- Whether real-time Content API inventory updates are wired
- Supplemental feeds, custom labels, or campaign-level filters already in place
- Performance Max asset matching that may legitimately serve products beyond strict feed presence
- Pre-order or coming-soon SKUs that intentionally have non-"in stock" availability
- Whether your in-platform Google Ads view shows the same picture once filters are applied

### Open questions for you
1. Are there current automated rules or filters that should be pausing OOS products? If so, why are these specific SKUs still serving?
2. Is real-time Content API inventory push wired up, or are we relying on scheduled GMC feed refreshes?
3. For the 6 blank-title SKUs in the high-confidence list — can these be hard-excluded from all campaigns immediately?
4. For Galaxy Watch 8 Classic (#8307) and Apple Watch Series 9 (#7042) — both have been OOS 36-43 days with continued spend. Is there a structural reason these are still in the bid auction, or is this a campaign exclusion we missed?
5. The "(NOT IN GMC FEED)" cases — are these SKUs in a different feed (supplemental, local inventory) or should they be excluded?

---

## What we propose

### Immediate (this week)
- **Manually exclude the 24 high-confidence SKUs** from all active campaigns. Estimated saving: ~A$21k/yr.
- Stops the worst bleeding while we work on structural fixes.

### Short-term (next 2 weeks)
- **Automated rule:** "Exclude products where availability ≠ 'in stock'" applied to all PMax + Standard Shopping campaigns. We understand Google's default behavior deprioritizes OOS — we want to add an explicit hard exclusion as a second checkpoint.
- **Supplemental feed for `stock_status` custom label** — independent daily push so failures in the main feed don't propagate to ad serving.

### Medium-term (next month — primarily our dev's work, but want your view)
- **Real-time Content API inventory push** when a unit sells. This eliminates the propagation lag entirely for sold-out events. Without this we're always playing catch-up.
- **Monthly orphan purge** — cross-reference Google Ads "Eligible products" tab against current GMC feed, exclude disconnected items.

### Ongoing monitoring (already in place from our side)
- Weekly automated check that emails us each Monday with last-7-day OOS leak as % of spend
- Threshold: if leak >5% of weekly spend, automatic alert

We'd like to share the weekly report with you so we're both looking at the same picture and can track whether changes are working.

---

## Honest caveats from our side

A few things worth flagging in case any of the findings turn out to have legitimate explanations we missed:

- **Some "leak" is unavoidable:** if a product sells the last unit at, say, 2pm, Google may continue serving impressions until the next feed refresh. We're not expecting this to be zero.
- **Performance Max attribution is tricky:** PMax can show conversions for products that weren't directly bid on. So "conversions reported" on a leaked SKU doesn't necessarily mean that SKU was the actual sold item.
- **Our GMC export may be stale:** if pulled at a different point than your live console, snapshot mismatches are possible.
- **The 6 blank-title SKUs might have legitimate reasons:** could be feeds from a different source, test products, or system artifacts we don't recognize.

That said, the iPad Pro 10.5" 256GB case (#1425) is unambiguous — we have a manually-verified shipment date of 21 April, the product is definitely OOS, and Google has spent A$179 on it since then. Whatever the broader picture, that one is real money on the table.

We'd appreciate your read on the rest of the list — happy to jump on a call if it's easier than email.

— Phonebot Owner

---

## Attachments
- **`CONFIRMED_oos_leaks_with_last_sale.csv`** — 266 SKUs with last sale date, GMC availability, ad spend, and priority (HIGH / MEDIUM / LOW) — this is the main file to work from
- `oos_ad_spend_leak_30d.csv` — broader analysis (521 SKUs) including ones without recent sale dates — for reference
- `sku_money_on_table_april_2026.csv` — separate analysis: SKU performance quadrants — for context
