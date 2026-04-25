# Phonebot Marketing Dashboard — Implementation Brief (for Kimi)

You are building a marketing analytics dashboard + backend for **Phonebot**, an Australian DTC refurbished-phone retailer. Another AI (Claude) has already built a clean local data layer through a strict lockstep extraction process. Your job is to build the dashboard, backend, customer-journey layer, and analytical presentation **on top of those local files**, NOT to re-extract from APIs.

---

## 1. Core objective

Build a complete marketing dashboard + backend for Phonebot using **only** the local exported files at `/Users/mic/Documents/Claude/Projects/fb shit/customer_journey_intelligence/` (referred to below as `CJI/`). Surface cross-channel performance, customer-journey mapping, statistical cross-references, and CEO-level decision support.

You design the UI/UX, dashboard hierarchy, journey visualisation, cross-channel comparison views, and analytical presentation — but the data source is fixed.

---

## 2. Source-of-truth rules (non-negotiable)

1. **The local files in `CJI/` are the ONLY source of truth.** Do not connect to APIs (Supermetrics, GA4, Google Ads, Facebook Ads, Bing, Brevo, GMB, Search Console). Do not invent fields, sources, or metrics not present in the files.
2. **Do not fabricate analytical certainty.** Where a metric depends on an inferred mapping (e.g. GA4 "Paid Social" → FB), label it as inferred in the UI and in your transformation log.
3. **Inspect before building.** Read the files listed in §6 before designing your data model. Read the QA notes (§7) before writing transformations — they encode decisions already made about fraud exclusion, GP imputation, and refund handling.
4. **Don't fight Claude's decisions.** Claude has already excluded Villawood-2163 fraud orders, imputed GP=0 outliers via brand×condition median margin, defined web-vs-store separation, and locked window definitions. If you disagree, flag it as an open question in your transformation log — don't silently override.
5. **Modular architecture is required.** Build so that the file-based ingestion layer can later be swapped for live APIs without breaking the metric/transformation/dashboard layers downstream.

---

## 3. Known source set (already extracted to local files)

| Source | Auth status | Data on disk |
|---|---|---|
| **CMS web orders** (Phonebot Shopify-equivalent ecommerce) | Manual xlsx exports | `CJI/<window>/cms_manual/` — 17,659 orders Mar 2025–Apr 2026, refund flags, GP imputation |
| **CMS web refunds** | Manual xlsx | Joined into orders file as `was_refunded` flag |
| **Store POS** (Reservoir VIC physical store) | Manual xlsx | `CJI/<window>/melbourne_store_sales/` — 4,522 orders, separate Order ID space from web |
| **Store refunds** | Manual xlsx | Aggregate adjustment only — Order IDs don't link to orders file (data quality flag) |
| **Google Ads (AW)** | Supermetrics-extracted | `CJI/1_month/google_ads/account_daily_1m.csv` (account-level daily, 30d) |
| **Facebook Ads (FA)** | Supermetrics-extracted | `CJI/1_month/facebook_ads/` — campaign summary, placement summary, account daily |
| **Microsoft/Bing Ads (AC)** | Supermetrics-extracted | `CJI/1_month/bing_ads/campaign_daily_1m.csv` |
| **GA4 (GAWA)** | Supermetrics-extracted | Pulled but not all on disk yet — see §6 for what's actually saved |
| **Search Console (GW)** | Supermetrics-extracted | `CJI/1_month/search_console/branded_daily_1m.csv` + `CJI/12_month/search_console/branded_weekly_12m.csv` |
| **Brevo (SIB)** | Supermetrics-extracted | `CJI/1_month/brevo/`, `CJI/6_month/brevo/`, `CJI/12_month/brevo/` — campaign-level only, no $ |
| **GMB (Google My Business)** | Supermetrics-extracted | `CJI/1_month/gmb/locations_daily_1m.csv` |
| **Profit Metrics** | Available via GA4 properties (488590631 + 488618020) | Schedule IDs in `source_maps/step2_landed_schedule_ids.json` — not yet on disk |

**Out of scope (do NOT include in dashboard):**
- AE (UAE) data — explicitly out per founder F (2026-04-25). AE GA4 properties + UAE Burjuman FB campaigns are NOT to be blended into AU views.
- UK data — out of scope per F.
- Klaviyo (KLAV) — historical email pre-2025-10-27, may be added later.

---

## 4. Expected local folder structure

```
CJI/
├── 1_month/, 3_month/, 6_month/, 12_month/   ← time window containers
│   ├── cms_manual/                ← CMS web orders (post-fraud-exclude, GP-imputed, refund-flagged)
│   ├── melbourne_store_sales/     ← Reservoir physical store orders + refunds
│   ├── facebook_ads/              ← FA Phonebot account act_14359173 only
│   ├── google_ads/                ← AW Phonebot account 3900249467
│   ├── bing_ads/                  ← AC Phonebot account 180388397
│   ├── ga4/                       ← GAWA AU main property 284223207 (filtered country=Australia)
│   ├── search_console/            ← GW phonebot.com.au only (AU URL property)
│   ├── brevo/                     ← SIB campaign-level
│   ├── gmb/                       ← GMB Phonebot AU location only
│   └── profit_metrics/            ← (pending — GA4 properties 488590631 / 488618020)
├── source_maps/                    ← read these FIRST to understand decisions
├── field_maps/                     ← (Claude pending; you may create)
├── qa_checks/                      ← critical caveats — read all of these
├── cross_checks/                   ← preliminary Step 7 work
├── regression_checks/              ← (empty — you maintain)
├── dashboard_connection/           ← THIS FILE LIVES HERE
├── final_conclusions/              ← (empty — you populate at end)
├── memory_snapshots/               ← Claude's working memory; read for context
└── manual_data_drops/              ← future user uploads land here
```

The 1m/3m/6m/12m windows are rolling N-day windows anchored on 2026-04-24 (most recent CMS date), not calendar months. The full 14-month CMS history (Mar 2025–Apr 2026) lives in `12_month/cms_manual/cms_orders_v4_with_refunds.csv` and `12_month/cms_manual/cms_orders_v3_full_history.csv`.

---

## 5. Required build order (lockstep)

Do these IN ORDER. Don't skip:

1. **Inspect** the file structure: `ls -R CJI/`, then read every file in `source_maps/` and `qa_checks/`.
2. **Build a file map** — every file × what it contains × granularity × time window × known caveats. Save to `field_maps/file_inventory.md`.
3. **Build a source/schema map** — for each source, list raw fields, types, units, and which canonical metric they feed. Save to `field_maps/schema_map.md`.
4. **Identify field relationships and metric definitions.** Reconcile: which fields across sources are equivalent (e.g. AW `Conversionsvalue` ≈ FA `offsite_conversion_value_fb_pixel_purchase` ≈ GA4 `purchaseRevenue`)? Which are NOT equivalent (e.g. AW `Conversions` includes view-through; FA platform-reported is 42x GA4 last-click per memory)? Save to `field_maps/metric_definitions.md`.
5. **Build the ingestion/parsing layer.** Each source file → typed dataframe with canonical column names. Idempotent — re-runnable when files are updated.
6. **Build the normalized backend data model.** Star/snowflake schema with: `fact_web_orders`, `fact_store_orders`, `fact_paid_daily` (per source), `fact_ga4_channel_daily`, `dim_date`, `dim_channel`, `dim_campaign`, `dim_brand`, `dim_condition`. Use SQLite or DuckDB for local; design so Postgres/BigQuery can replace later.
7. **Build the metric calculation/transformation layer.** Pure functions / SQL views. No business logic in the API layer.
8. **Build QA / reconciliation checks** — each transformation logs row counts in/out, sum of money in/out, % nulls. A regression test runs daily.
9. **Build backend API endpoints** (REST or GraphQL — your call). Endpoints serve dashboard widgets, NOT raw tables.
10. **Build dashboard frontend** — your design call. Suggested stack: Next.js + Tailwind + Recharts or Tremor (or whatever you build best).
11. **Build customer journey mapping layer** — see §9 for the constraints.
12. **Build cross-channel comparison and statistical analysis layer** — see §10.
13. **Validate dashboard outputs against source files.** For every dashboard number, you must be able to point to the source file row(s) it comes from.
14. **Document assumptions, gaps, and unresolved issues.** Maintain `dashboard_connection/transformation_log.md` and `dashboard_connection/open_questions.md` continuously.

---

## 6. Files you MUST read before building

These are the canonical decision documents. Read them. Don't reinvent.

| Priority | File | What's in it |
|---|---|---|
| 🔴 Highest | `source_maps/00_step0_inventory.md` | Source list, auth status, account IDs, trust levels, scope decisions |
| 🔴 Highest | `qa_checks/cms_qa_step3_v2_full_history.md` | CMS web fraud exclusion, GP imputation method, refund handling, gaps |
| 🔴 Highest | `qa_checks/store_data_qa.md` | Store data composition, refund file mismatch, accessory/repair margin caveats |
| 🟡 High | `cross_checks/step7_paid_vs_cms_30d.md` | Initial cross-channel attribution finding — platforms claim 96% of CMS web rev = over-attribution |
| 🟡 High | `qa_checks/gw_organic_finding_contradicts_hypothesis.md` | Search Console aggregate data contradicts the "lost organic rankings" cliff hypothesis |
| 🟡 High | `qa_checks/cms_gp_zero_orders_to_review.csv` | 709 orders with imputed GP — show user the imputation in dashboard, don't hide it |
| 🟢 Useful | `source_maps/step2_pull_plan.md` | What pulls were intended |
| 🟢 Useful | `source_maps/step2_landed_summary.md` | What's actually on disk vs persisted-only |
| 🟢 Useful | `memory_snapshots/snapshot_*.md` | Claude's working memory at various points — context for decisions |

Then read the data files themselves:

**Canonical data files:**
- `CJI/12_month/cms_manual/cms_orders_v4_with_refunds.csv` — 17,659 web orders, refund flag, imputed GP
- `CJI/12_month/cms_manual/cms_monthly_summary_net.csv` — refund-net monthly summary
- `CJI/12_month/cms_manual/combined_web_store_monthly.csv` — combined web+store monthly view
- `CJI/12_month/melbourne_store_sales/store_orders_full_history.csv` — 4,522 store orders, categorised
- `CJI/12_month/melbourne_store_sales/store_refunds_full_history.csv` — 187 store refunds (aggregate use only)
- `CJI/12_month/melbourne_store_sales/store_monthly_summary.csv` — store monthly
- `CJI/12_month/search_console/branded_weekly_12m.csv` — 53 weeks branded vs non-branded
- `CJI/cross_checks/MASTER_daily_1m.csv` — daily cross-channel cube (last 30d)
- `CJI/cross_checks/daily_cross_source_1m.csv` — alternate daily merge

---

## 7. Critical decisions already made (do NOT re-litigate without flagging)

1. **Villawood-2163 Apr 2026 fraud exclusion**: 50 orders excluded as fraud. Saved at `qa_checks/cms_fraud_excluded_villawood.csv`. Don't include them.
2. **GP=0 imputation: Method B (Brand × Condition median margin)**. 709 web orders with implausibly low Cost Price had GP imputed. The `GP_imputed` column in `cms_orders_v4_with_refunds.csv` is the canonical GP figure. Show users that some GP is imputed (label as "imputed" in dashboards).
3. **Web vs Store separation is structural**: 0 Order ID overlap. Don't dedupe across them. Display web and store as separate channels with combined-view option.
4. **Store accessory/repair GP is upper bound only**: Cost Price is not actively tracked for many SKUs (per F). Margin shows as 78-91% but this is artefact, not real. Display with explicit "GP not measurable from data" warning.
5. **Refund handling**: Web refunds flag individual orders (`was_refunded`); store refunds DON'T link to orders (export-side filter), treat as aggregate revenue subtraction line.
6. **AE and UK explicitly out of scope.** Do not include UAE Burjuman FB campaigns or AE GA4 properties in any AU view.
7. **Combined business YoY March 2025 → 2026**: orders -12.6%, rev -10.3%, GP -16.2%. This is the headline. **Don't quote web-only YoY** (which is -17/-15/-24%) without showing combined alongside it.
8. **Cliff diagnosis (per F, multi-factor)**: (a) seasonal Xmas-Jan, (b) lost organic rankings — questionable, contradicts aggregate GW data; needs query-level validation, (c) Google Ads pull-back — confirmed in AW weekly data, (d) competitive pricing pressure.
9. **Platform-reported ROAS is unreliable**: FA, AW, AC sum to 96% of actual CMS web revenue → massive double-counting. Always show platform-claimed ROAS alongside CMS-derived ROAS where possible.
10. **Brevo data only since 2025-10-27**. Earlier email history is not present (Klaviyo may come later). Don't extrapolate before that date.

---

## 8. UI/UX freedom — design decisions you own

You decide:
- Dashboard layout, colour palette, typography, navigation pattern
- Information density (low-density CEO view vs operator drill-down)
- Chart types per metric (bar/line/heatmap/sankey/etc.)
- Funnel and journey visualisation style
- Hover states, drill-down behaviours, comparison toggles
- Mobile-vs-desktop priority
- Whether to use a stack like Next.js+shadcn, Streamlit, Observable Framework, Metabase, or something custom

Constraints on design:
- **CEO view first.** Top of dashboard answers: how is the business doing this week vs last; what's growing; what's worth attention. Drill-downs go deeper, but the front page must be readable in 60 seconds.
- **Always show data trust signals.** A small badge or footnote per widget indicating: source, freshness, known caveats (e.g. "Imputed GP for 4% of orders", "Last GMB day partial — reporting lag").
- **Web and Store are first-class peers.** Don't bury Store inside web — both should be visible on the front page given the YoY divergence story.
- **Time-window selector everywhere.** 1m / 3m / 6m / 12m / custom. The data is partitioned this way.
- **Provenance footer.** Every widget should let the user click "show source rows" and see the underlying file path + filter applied.

---

## 9. Customer journey mapping — design freedom + constraints

You design the journey visualisation. Constraints:

- **Cannot do strict order-level multi-touch attribution from current data.** CMS orders have NO `utm_source/medium/campaign/gclid/fbclid` fields. The only join key per-order is `Email` (web) or anonymous walk-in (store). Don't pretend you have order-level attribution.
- **Aggregate-level journey is feasible.** Daily/weekly: `GMB views → website sessions (GA4) → web orders (CMS) → revenue` and `GMB phone+directions → store walk-in → store orders`. Compose these from the daily files.
- **Brevo email is partially measurable.** SIB campaign data has sends/opens/clicks but no $. Compose with GA4's `Email` channel sessions and same-day/3-day-lag CMS orders for an inferred email contribution.
- **Repeat customer cohorts within CMS are computable** (join orders by Email, derive `is_first_order`). Median time-to-second-order is 31 days (per Claude's analysis); use this for retention curves.
- **Search Console → website → orders** is a valid funnel: GW clicks (queries × landing pages) → GA4 Organic Search sessions → CMS orders.

Ask the user about:
- Whether to use Sankey, parallel-set, or stepped-funnel diagrams
- Whether journey time-axis is daily, weekly, or "cohort-relative" (e.g. days from first session)
- How to visualise the over-attribution problem (multiple platforms claiming same order)

---

## 10. Cross-channel statistical analysis — what to build

Required:
- **Spend share vs revenue share** per channel, per window
- **Daily/weekly correlation matrix** (paid spend / sessions / clicks vs CMS orders, with lags 0–7 days)
- **Platform claim vs CMS truth ratio** per channel — this is the over-attribution surfacing
- **GA4 last-click attribution vs CMS revenue** triangulation (when GA4 channel data is loaded)
- **Trend decomposition** — STL or simple seasonal/trend split per source (highlight BFCM-2025 peak vs Q1 2026 cliff)
- **Refund rate by brand × time** (Xiaomi 22.78%, AirPods 12.19% are the high-flag brands per existing analysis)
- **Cohort retention curves** (first-time-buyer cohorts; time to 2nd order; LTV by acquisition month)

Optional / use judgment:
- Anomaly detection on daily orders / revenue (z-score, MAD, or Prophet residuals)
- Mix-shift analysis (which brand × condition is gaining/losing share)
- Channel marginal-contribution estimation via simple regression with one-source-out comparison
- Pricing pressure detection: AOV trend per brand-condition to validate F's "competitive pricing" hypothesis

**Hard rules:**
- Don't claim causation from correlation alone.
- Don't claim incrementality without a holdout or marginal-spend model.
- Surface uncertainty (CIs, p-values, sample size) in the UI, not only point estimates.

---

## 11. Question-asking behaviour

Ask the user when:
- UI/UX direction matters (e.g., "do you prefer Sankey or stepped funnel for the journey?")
- A business interpretation could materially change architecture or output
- File mapping is genuinely ambiguous and not resolvable by reading other files
- Multiple equally plausible dashboard directions exist
- A choice could change CEO-level conclusions

DON'T ask when:
- The answer is in `source_maps/00_step0_inventory.md` or `qa_checks/`
- You can resolve it by reading 2 more files
- You can make a reasonable assumption + clearly label it (e.g., "Assuming GA4 'Cross-network' = Google PMax — flag for confirmation")
- It's a low-stakes design choice (e.g., colour palette)

Maintain a running `dashboard_connection/open_questions.md` file. Group questions by urgency. Batch them weekly when possible.

---

## 12. Backend architecture (required)

Layer cake:
1. **File ingestion** — watches `CJI/` for changes, parses each file into typed dataframes
2. **Parsing** — handles Excel + CSV, strips A$ prefix from money fields, parses dates as Australia/Perth tz
3. **Canonical normalized data model** — star schema (see §5 step 6)
4. **Transformation/metric layer** — pure functions or SQL views; one place where business logic lives
5. **QA/reconciliation layer** — row counts, sums, parse error counts, refund rate sanity, fraud-flag check
6. **Backend API** — endpoints, not raw tables
7. **Dashboard consumption layer** — frontend
8. **Modular swap point** — design ingestion so files can later be replaced by direct connector calls (Supermetrics, GA4 API, etc.) without breaking transformations or downstream

Recommended local stack: Python (pandas + DuckDB) or TypeScript (DuckDB + tRPC). Don't over-engineer — this is a single-tenant analytics dashboard, not a SaaS product.

---

## 13. Required dashboard scope

Include (where files support):
- **Cross-channel marketing overview** (CEO view)
- **Source-level detail pages** (FB, AW, Bing, GA4, GMB, Brevo, Search Console, CMS web, Store)
- **1m / 3m / 6m / 12m comparison toggles** (matched to existing windows)
- **Campaign and channel drilldowns**
- **Funnel and customer journey views** (per §9)
- **Email, paid, search interaction analysis**
- **Trust / QA flags** (per-widget data freshness, caveats, imputation badges)
- **Cross-source comparison** (e.g. AW spend daily vs CMS orders daily)
- **Anomaly surfacing** (per §10)
- **Metric definitions and data provenance** (every metric clickable to its definition)
- **CEO overview + operational drilldowns** (clearly separated tiers)
- **Refund-adjusted revenue** as a default mode (with toggle to gross)

---

## 14. QA and regression rules

Required:
- Validate every parsed result against the source file (row count, sum of money, max date)
- Maintain metric consistency between backend and frontend (single source of truth)
- Keep a transformation log (`dashboard_connection/transformation_log.md`)
- Flag incomplete or unreliable data per-widget
- Don't assume field meaning without explicit mapping in `field_maps/`
- Regression-check new features against prior validated outputs
- Clearly distinguish **confirmed** (from raw data) vs **inferred** (mapped/derived/estimated) — UI badge

---

## 15. Working file conventions

When you create new files, place them under:
- `dashboard_connection/` — your build artifacts, transformation logs, open questions, architecture docs
- `field_maps/` — canonical schema and metric definitions
- `regression_checks/` — your test outputs

Don't write to:
- `cms_manual/`, `melbourne_store_sales/`, `facebook_ads/`, etc. — Claude owns these (raw data layer)
- `source_maps/`, `qa_checks/`, `memory_snapshots/`, `cross_checks/` — Claude owns; you may read but DO NOT modify (avoid silent overwrites in parallel-build)
- `manual_data_drops/` — user-managed

If you need to write derived data, put it under a new `dashboard_connection/derived/` subfolder so we can clearly distinguish your outputs from Claude's.

---

## 16. Critical instruction

You and Claude are working in parallel on the same project. **Do not modify files Claude owns** (see §15). Coordinate via:
- Reading Claude's outputs (one-way)
- Writing your derived outputs to `dashboard_connection/`
- Asking the user when ambiguity could create double-work or contradictory conclusions

If you find a meaningful contradiction in Claude's outputs, write it to `dashboard_connection/open_questions.md` and surface to the user — don't silently disagree.

---

## 17. Start sequence (do this exactly)

1. `ls -R CJI/` and capture the full tree
2. Read every file in `source_maps/` and `qa_checks/` in full
3. Read `cross_checks/step7_paid_vs_cms_30d.md`
4. Open and inspect (head + describe + dtypes) each canonical file listed in §6
5. Write `dashboard_connection/file_inventory.md` and `dashboard_connection/initial_observations.md`
6. Write `dashboard_connection/proposed_architecture.md`
7. Ask the user any §11-priority questions before writing code
8. Begin building the ingestion + normalized data model layer (§5 steps 5–6)

End of brief. Get to work.
