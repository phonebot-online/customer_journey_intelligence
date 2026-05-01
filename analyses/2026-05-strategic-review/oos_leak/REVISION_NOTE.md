# OOS Leak Analysis — Revision (2026-05-01)

The original analysis (`oos_ad_spend_leak_30d.csv` + `CONFIRMED_oos_leaks_with_last_sale.csv`) flagged
**~A$8,250/30d (~A$99k/yr)** of allegedly-leaking spend on currently-OOS SKUs. The Google Ads agent
(Jelena) pushed back, demonstrating with a screenshot that for one of the named worst offenders
(SKU 1425, Apple iPad Pro 10.5-inch 256GB Grade A) AW correctly disabled the listing once GMC marked
it OOS, around 2026-04-23.

This revision pulled daily SKU-level spend over 60 days via Supermetrics (`sku_daily_spend_60d.csv`),
split each SKU's spend into pre-`last_sale_date` vs post-`last_sale_date` periods, and computed the
real "post-OOS" leak figure.

## Revised numbers

| Metric | Original claim | Revised |
|---|---:|---:|
| 30-day spend total | A$8,250 | A$8,250 (unchanged) |
| of which: pre-OOS legitimate (in-stock period) | not separated | **A$15,466** |
| of which: post-OOS candidate leak | conflated as "leak" | **A$2,205** |
| Annualised leak | A$99,009 | **A$26,826** |
| Conservative lower bound (sync lag ≥ 7d AND ≥3 active post-OOS days) | — | **A$21,542** |

**True leak is ~73% smaller than originally claimed.**

## Sync-lag distribution (% of post-OOS spend by lag bucket)

| Lag (last_sale → last_spend) | SKUs | A$ leak (30d) | % |
|---|---:|---:|---:|
| 0-1 day (immediate) | 3 | A$35 | 1.6% |
| 2-7 days (normal sync) | 28 | A$406 | 18.4% |
| 8-21 days (sluggish sync) | 40 | A$721 | 32.7% |
| **22+ days (broken sync)** | **36** | **A$1,040** | **47.2%** |

Most of the genuine leak is concentrated in 36 SKUs where the GMC→AW sync appears to have failed
entirely. These are the targets for an actual fix (audit the GMC feed for these SKUs and check why
they didn't get marked OOS).

## Methodology caveats

1. **`last_sale_date` is a proxy for OOS, not exact.** For Phonebot's refurb model, each Grade A
   physical SKU is typically 1 unit, so "last sale" ≈ "stock = 0". For accessories/parts/multi-unit
   SKUs, this approximation breaks — slow-velocity SKUs with sales every 2-3 weeks could be
   falsely flagged.
2. **Conversion attribution lag** means some "post-OOS spend" was on clicks that converted later
   (delayed attribution). Those clicks may have been productive at the time.
3. **"(NOT IN GMC FEED)" tags in the original file** are mostly join-failure artefacts. Many
   SKUs labelled this way still show daily AW spend after their alleged "not in feed" date.
4. **GMC feed snapshot timing.** The `products_full_with_offer_id.csv` is a snapshot at one point
   in time; SKUs may have been in the feed earlier in the spend window.

## What changed

- `CLAUDE.md` "OOS leak finding (BIG)" entry rewritten with revised numbers
- Action priority on the OOS leak demoted from P0 to P2
- Recommended action narrowed from "fix all 24 cases" to "audit the 36 broken-sync SKUs"
