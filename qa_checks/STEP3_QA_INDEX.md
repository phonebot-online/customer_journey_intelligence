# Step 3 — QA Index (canonical)
**Date locked:** 2026-04-25
**Purpose:** Single index of every per-source QA decision, with pointer to the canonical doc per source.

## How to use this doc

Before trusting any number from a source, read the canonical QA doc for that source. Anything not flagged here was checked and passed.

## Per-source QA status

| Source | Status | Canonical QA doc | Key caveats / decisions |
|---|---|---|---|
| **CMS web orders** | ✅ Passed (Method B imputation applied) | `qa_checks/cms_qa_step3_v2_full_history.md` | 50 Villawood-2163 fraud excluded. 709 GP=0 outliers imputed via Brand × Condition median margin. AOV ~A$564 typical. |
| **CMS web refunds** | ✅ Passed | (within `cms_qa_step3_v2_full_history.md`) | 1,155 refund rows. Joinable to web orders by Order ID. Net rev / Net GP models live. Web refund rate 6.52% (count), 5.66% (revenue). |
| **CMS GP=0 outliers** | ✅ Documented for review | `qa_checks/cms_gp_zero_orders_to_review.csv` (709 rows) + `cms_gp_zero_with_calculated_gp_options.csv` | F to review manually when convenient. Lookup table at `cms_margin_lookup_by_brand_condition.csv`. Method B imputation used in interim. |
| **Store orders (Melbourne POS)** | ⚠️ Passed with margin caveat | `qa_checks/store_data_qa.md` | 90% Reservoir VIC. Cost Price = 0 on most accessories/repairs → margin reads 78-91% (artefact, not real). Use store GP as upper bound. |
| **Store refunds** | ⚠️ Aggregate-only | `qa_checks/store_refunds_qa_flag.md` (this folder) | Order IDs do NOT match store_orders file — treat as aggregate revenue adjustment, not order-level join. |
| **Facebook Ads (act_14359173)** | ⚠️ Pixel/utm broken — platform attrib not trustworthy | (within `step7_LOCKED_*` triangulation docs) | `fbclid` server bug, 62% of purchase events affected. GA4 attributes nearly zero `facebook / cpc` sessions. Platform-claimed value is 65-238× over-stated vs PM-attributable. Use PM-GP as truth proxy. |
| **Google Ads (3900249467)** | ✅ Passed with attribution caveat | (within `step7_LOCKED_*`) | Use `Conversionsvalue` (last-click) not `AllConversionsvalue`. Even last-click 5-7× over PM-attributable. PM-attributed real ROAS is the canonical decision metric. |
| **Bing Ads (180388397)** | ✅ Passed | (no specific doc — trust level high at small footprint) | Small footprint. Real ROAS 2.5-13.8× across campaigns. Use platform numbers; over-attribution risk low at this scale. |
| **GA4 main AU (284223207)** | ✅ Passed with scoping rule | (schema_map.md notes) | Country = Australia filter required. Session-scoped metrics only with session-scoped dimensions. Captures ~80% of CMS truth. |
| **ProfitMetrics Revenue (488590631)** | ✅ Canonical — 101% of CMS | (schema_map.md) | Reconciles to CMS web within 1% over 30d. Slightly higher because includes some store/server-side. |
| **ProfitMetrics GP (488618020)** | ✅ Canonical — within 6% of CMS imputed GP | (schema_map.md) | Field is named `totalRevenue` but actually contains GP. **This is the commercial truth proxy** for paid-channel attribution. |
| **Search Console (phonebot.com.au)** | ✅ Passed with discrepancy correction | `qa_checks/gw_organic_finding_contradicts_hypothesis.md` (initial) + `cross_checks/step8_LOCKED_organic_query_diagnosis.md` (resolved) | Use `discrepancy_correction = AGGREGATE_LEVEL`. "(unknown)" bucket is 30-50% of all clicks — cannot split branded vs non-branded. Aggregate trend differs from query-level trend. |
| **Brevo (SIB)** | ✅ Passed (limited window) | (no specific doc) | History only since 2025-10-27. No revenue or order $ — campaign metrics only. Not a cliff source. |
| **GMB (Phonebot AU)** | ⚠️ Passed with reporting lag | (schema_map.md) | Last 2-3 days typically zero / partial. Always trim trailing 3 days before any comparison. |

## Cross-source reconciliation status

| Reconciliation | Status | Doc |
|---|---|---|
| CMS web orders ↔ ProfitMetrics revenue (30d) | ✅ Within 1% | `cross_checks/step7_LOCKED_triangulation_30d.md` |
| CMS imputed GP ↔ ProfitMetrics GP property (30d) | ✅ Within 6% | same |
| CMS imputed GP ↔ ProfitMetrics GP property (12m) | ⚠️ 75% match | `cross_checks/step7_LOCKED_multiwindow_triangulation.md` — likely PM property excludes some store/non-tracked sources |
| GA4 last-click rev ↔ CMS web rev (30d) | ✅ ~80% (under-tracks server-side) | (within triangulation) |
| AW platform conv value ↔ PM-attributed rev | 5-7× inflation in AW favor | `step7_LOCKED_*` |
| FA platform conv value ↔ PM-attributed rev | 65-238× inflation | `step7_LOCKED_*` |

## Outstanding QA items (low-priority)

- Klaviyo email history — pending user attachment, deferred
- 6m/12m FA campaign-level data on disk — currently aggregate only; re-pollable by schedule_id if needed
- Page-level GW history pre-Apr 2025 — limited by GSC data retention

## Files referenced in this index
- `qa_checks/cms_qa_step3_v2_full_history.md`
- `qa_checks/store_data_qa.md`
- `qa_checks/store_refunds_qa_flag.md` (sibling)
- `qa_checks/gw_organic_finding_contradicts_hypothesis.md`
- `qa_checks/cms_fraud_excluded_villawood.csv`
- `qa_checks/cms_gp_zero_orders_to_review.csv`
- `qa_checks/cms_gp_zero_with_calculated_gp_options.csv`
- `qa_checks/cms_margin_lookup_by_brand_condition.csv`
- `field_maps/schema_map.md`
- `field_maps/metric_definitions.md`
- `cross_checks/step7_LOCKED_triangulation_30d.md`
- `cross_checks/step7_LOCKED_multiwindow_triangulation.md`
- `cross_checks/step8_LOCKED_organic_query_diagnosis.md`
