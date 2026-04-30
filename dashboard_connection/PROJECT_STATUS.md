# Phonebot Marketing Dashboard — Project Status & Starting Guide

> **Last updated:** 2026-04-30
> **Status:** OPERATIONAL — Data ingestion, backend API, frontend dashboard, BigQuery integration, ProfitMetrics-via-GAWA refresh, and 9 Profit Ops analyses all live with refreshed data through 2026-04-29.

## Recent updates

**2026-04-30**
- All Supermetrics-sourced CSVs refreshed (Google Ads account daily, shopping_sku 7d/30d, search terms, campaign summary; GA4 channel + campaign×source/medium AU; ProfitMetrics revenue + GP via GAWA accounts 488590631 / 488618020; GMC products with offer_id).
- BigQuery export now has 2 daily shards (`events_20260428`, `events_20260429`, 52,572 events total).
- New "BigQuery: landing-page performance" section added to `/profit-ops` (`bqLandingPages` tRPC procedure). Pages auto-tagged SCALE_AD_SPEND / FIX_UX / SCALE_TRAFFIC / NEUTRAL with per-page click-ID capture diagnostic. Caveat copy adapts to actual BQ window depth.
- Discovered ProfitMetrics CSVs are **not** manual exports — they're available via GAWA with the dedicated PM accounts. Future refreshes are automated.
- Headline finding: Unassigned channel = 290 transactions / $134k revenue / 30d in PM data (largest single channel by both metrics, ~40% of monthly web orders).

**2026-04-29**
- Profit Ops dashboard shipped (route `/profit-ops`) with 7 waste/anomaly analyses.
- ProfitMetrics Conversion Booster V2 deployed by Pat (GTM v86 live).
- BigQuery cross-section added to Profit Ops (5 procedures: bqStatus, bqClickIdCapture, bqChannelAttribution, bqFunnelByChannel, bqSessionCapture).

---

## 1. What Was Built (CLI Session)

### Complete Stack
| Layer | Tech | Status |
|-------|------|--------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + Recharts | ✅ Built & deployed |
| Backend API | tRPC + Hono + superjson | ✅ Running |
| Database | DuckDB (file-based, reads CSVs directly) | ✅ Populated |
| Data Ingestion | DuckDB `read_csv_auto` + SQL views | ✅ All sources loaded |

### Project Location
```
customer_journey_intelligence/app/
├── api/                    # Backend
│   ├── boot.ts             # Hono server + DuckDB init + static file serving
│   ├── router.ts           # AppRouter composition
│   ├── context.ts          # tRPC context
│   ├── middleware.ts       # publicProcedure factory
│   ├── lib/
│   │   └── duckdb.ts       # DuckDB connection + schema (reads all CSVs)
│   └── routers/
│       ├── dashboard.ts    # CEO summary, trends, channel mix, platform claims, refunds
│       ├── sources.ts      # Paid daily, SC, GMB, Brevo, cohorts, web/store daily
│       └── qa.ts           # Data availability + quality flags
├── src/                    # Frontend
│   ├── App.tsx             # React Router (9 routes)
│   ├── main.tsx            # TRPCProvider + BrowserRouter
│   ├── providers/trpc.tsx  # tRPC client (superjson transformer)
│   ├── hooks/useTimeWindow.ts
│   ├── types/index.ts      # formatters
│   ├── components/
│   │   ├── layout/AppLayout.tsx
│   │   ├── layout/TimeWindowSelector.tsx
│   │   └── widgets/KPICard.tsx, TrustBadge.tsx
│   └── pages/
│       ├── Dashboard.tsx         # CEO Overview
│       ├── WebOrders.tsx         # CMS web drill-down
│       ├── StoreSales.tsx        # Reservoir POS drill-down
│       ├── PaidSearch.tsx        # AW/FA/AC + over-attribution table
│       ├── Organic.tsx           # Search Console + GMB
│       ├── Email.tsx             # Brevo campaigns
│       ├── CustomerJourney.tsx   # Cohort retention
│       ├── CrossChannel.tsx      # Channel mix + efficiency scatter
│       └── DataTrust.tsx         # QA table + caveats
├── data/                   # DuckDB file created at runtime
├── dist/                   # Production build output
├── package.json            # Scripts: dev / build / check / start
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 2. Data Sources Loaded

| Source | Table | Rows | Date Range |
|--------|-------|------|------------|
| CMS Web Orders (v4_with_refunds) | `fact_web_orders` | 17,659 | Mar 2025 – Apr 2026 |
| Store POS Orders | `fact_store_orders` | 4,522 | Mar 2025 – Apr 2026 |
| Store Refunds | `fact_store_refunds` | 187 | Mar 2025 – Apr 2026 |
| Google Ads Daily | `fact_google_ads_daily` | 30 | Mar–Apr 2026 |
| Facebook Ads Daily | `fact_facebook_ads_daily` | 30 | Mar–Apr 2026 |
| Bing Ads Daily | `fact_bing_ads_daily` | ~120 | Mar–Apr 2026 |
| GA4 Channel Summary | `fact_ga4_channel` | ~11 | Mar–Apr 2026 |
| Search Console Daily | `fact_search_console_daily` | 90 | Mar–Apr 2026 |
| GMB Daily (AU only) | `fact_gmb_daily` | 30 | Mar–Apr 2026 |
| Brevo Campaigns | `fact_brevo_campaigns` | 33 | Oct 2025 – Apr 2026 |
| ProfitMetrics Channel GP | `fact_pm_channel_gp` | ~12 | Mar–Apr 2026 |
| ProfitMetrics Channel Rev | `fact_pm_channel_revenue` | ~12 | Mar–Apr 2026 |
| CMS Daily Aggregate | `agg_cms_daily` | ~420 | Mar 2025 – Apr 2026 |
| Store Daily Aggregate | `agg_store_daily` | ~413 | Mar 2025 – Apr 2026 |
| Combined Monthly | `agg_combined_monthly` | 14 | Mar 2025 – Apr 2026 |

---

## 3. Validation Results

### CEO Summary (1m window)
- **Web orders:** 763 ✅ (matches CMS v4 with 50 fraud exclusions applied)
- **Web revenue:** A$406,206 ✅
- **Store orders:** 294 ✅
- **Store revenue:** A$151,915 ✅
- **Total ad spend:** A$28,107 ✅ (Google A$19,105 + FB A$7,301 + Bing A$1,700)
- **Web refund rate:** 1.8% (14 orders) ✅

### Channel Mix (ProfitMetrics 1m)
- **Total GP:** A$108,460 ✅ (matches locked triangulation exactly)
- **Unassigned:** A$38,220 (35.2%) ✅
- **Paid Search:** A$21,862 (20.2%) ✅
- **Cross-network:** A$18,792 (17.3%) ✅

### Critical Findings Surfaced
- Facebook real ROAS ~0.30× (net loss on attributable basis) — flagged with red warning
- Google Ads real ROAS ~8.8× (genuinely profitable) — flagged green
- Platform over-attribution (96% of CMS revenue claimed) — surfaced in Paid Media page
- Store accessory/repair GP overstated — warned on Store Sales page
- CMS Jul–Nov 2025 gap — flagged on Data Trust page

---

## 4. How to Run

### Development (hot reload both frontend + backend)
```bash
cd customer_journey_intelligence/app
npm install
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- tRPC proxy: Vite forwards `/trpc` to `:3001`

### Production
```bash
cd customer_journey_intelligence/app
npm run build
npm start
```
- Single server on port 3001 serves both API and static files

---

## 5. Remaining / Next Steps

| Task | Status | Notes |
|------|--------|-------|
| Data ingestion | ✅ DONE | DuckDB reads CSVs directly via read_csv_auto |
| Populate database | ✅ DONE | All sources loaded |
| Validate outputs vs source | ✅ DONE | Key metrics validated against raw CSVs |
| Deploy to live URL | ⏳ PENDING | Needs hosting environment (Kimi Show, Vercel, etc.) |
| Longer-window paid data | ⏳ PENDING | AW/FA/AC 3m+ files are "save pending" per source_maps |
| ProfitMetrics 3m+ | ⏳ PENDING | Only 1m available on disk |
| GA4 3m+ channel data | ⏳ PENDING | Only 1m available on disk |
| Query-level Search Console | ⏳ PENDING | Need query dimension pull to validate organic hypothesis |
| Automated regression tests | ⏳ PENDING | Could add Jest + tRPC test harness |

---

## 6. Architecture Notes

**Ingestion layer:** DuckDB `read_csv_auto` reads CSVs directly — no Python/Node ETL needed. This makes the pipeline extremely fast and idempotent. When files are updated, just restart the server.

**Modular swap point:** The `api/lib/duckdb.ts` schema file is the only place that knows about file paths. Replacing CSV sources with live API connectors later only requires updating the `CREATE TABLE ... AS SELECT ...` statements — all downstream queries remain unchanged.

**Trust badges:** Every page widget includes source attribution, caveat flags, and freshness notes. Data Trust page collects all caveats in one place.

---

**Built by:** Kimi CLI (2026-04-25)
**Original scaffold:** Claude (web chat sandbox)
**Stack:** React 19 + Vite + Tailwind + tRPC + Hono + DuckDB
