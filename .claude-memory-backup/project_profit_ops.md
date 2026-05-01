---
name: Profit Ops dashboard feature
description: Live `/profit-ops` page in the dashboard with 7 waste/anomaly analyses; built 2026-04-29
type: project
originSessionId: 7f03a6f6-333e-4d69-9a8e-e35bdc01ba82
---
"Profit Ops" page (route `/profit-ops`, nav under Strategy section) shipped 2026-04-29; expanded with a BigQuery cross-section + landing-page panel on 2026-04-30.

**Live tRPC procedures** (in `app/api/routers/profit_ops.ts`):
1. `wasteHeadline` — top-line waste estimate (~$237k AUD/yr)
2. `brandedCannibalization` — branded paid clicks recoverable via organic
3. `oosSpendLeak` — brand-level OOS waste (kept for historical comparison)
4. `oosSpendLeakBySku` — SKU-level OOS via offer_id join (now possible after Supermetrics GMC fetch)
5. `shouldNotAdvertise` — SKU-level pause/keep with aging-inventory holding-cost model
6. `wastedSearchTerms` — negative-keyword candidates from search-terms CSV
7. `anomalyScan` — 28d rolling z-score on daily metrics
8. **BigQuery panel (5 procs):** `bqStatus`, `bqClickIdCapture`, `bqChannelAttribution`, `bqFunnelByChannel`, `bqSessionCapture` — live GA4 export
9. **`bqLandingPages`** (added 2026-04-30) — top entry pages from `vw_sessions`, auto-tagged SCALE_AD_SPEND / FIX_UX / SCALE_TRAFFIC / NEUTRAL against blended-CVR median; per-page click-ID capture flag for GTM tag misconfigs

**Why:** User wants net-profit optimization at $500k+ ad spend; existing dashboard surfaces metrics but didn't surface waste. Headline finding: ~614 SKUs (~$9.5k/30d) in Shopping spend that aren't in the current GMC feed — likely feed sync issue. That's the biggest single leak.

**How to apply:** When extending the page, the section pattern is `<button onClick={toggle('key')}>` collapsibles. State is in `expandSection: Record<string, boolean>`. Tunable assumptions go in `useState` with sliders. Always pair findings with a `TrustBadge` showing tier (`confirmed` | `estimated`) and a one-line caveat. Don't add features without explicit "validate before acting" copy — user pushes back on consultant-confidence.
