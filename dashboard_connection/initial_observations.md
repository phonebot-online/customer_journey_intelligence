# Initial Observations — Phonebot Marketing Dashboard

> Date: 2026-04-25
> Analyst: Kimi CLI
> Data source: `customer_journey_intelligence/` (local files)

---

## 1. Data Coverage & Quality

### CMS Web Orders (Commercial Truth)
- **17,659 orders** across Mar 2025–Apr 2026 (420 days, but Jul–Nov 2025 missing)
- **A$8.05M gross revenue / A$7.60M net** after refunds
- **Blended margin: ~23.9%** (using imputed GP)
- **AOV: ~A$503**
- **Refund rate: 5.7% by revenue, 6.5% by count**
- **GP imputation: 709 orders (4.0%)** had GP=0 and were imputed via brand×condition median margin
- **Fraud exclusion: 50 orders** from Villawood-2163 excluded in Apr 2026
- **No order-level attribution:** No utm_source, gclid, fbclid, or campaign fields. Cross-channel analysis must be aggregate-only (daily/weekly).
- **Repeat customer rate: 5.1%** within 14 months; median time to 2nd order = 31 days

### Store POS Orders
- **4,522 orders** across same period, **A$2.38M gross / A$2.04M net**
- **Refund rate: 14.4% by revenue** — much higher than web
- **Device category: 69.8% of orders, 94.7% of revenue, 22.7% margin** — comparable to web
- **Accessory/Repair margins are inflated** (77-91%) because Cost Price not tracked for many SKUs
- **0 Order ID overlap with web** — safe to combine without dedup

### Paid Media (1m window confirmed; 3m+ pending)
- **Google Ads:** A$19.1k spend, 441 platform conversions, A$228k platform-reported rev
- **Facebook:** A$7.3k spend, 251 platform conversions, A$141k platform-reported rev
- **Bing:** A$1.7k spend, 35 conversions, A$20.8k platform-reported rev
- **Platform over-attribution is severe:** Platforms collectively claim 96% of CMS web revenue (impossible — indicates double-counting)

### ProfitMetrics Triangulation (1m only)
- **Google Ads real ROAS: 8.83×** (vs platform claim 11.96×) — genuinely profitable
- **Facebook real ROAS: 0.30×** (vs platform claim 19.39×) — **net loss on attributable basis**
- **Unassigned bucket: 35% of GP** — server-side conversions without session attribution
- ProfitMetrics reconciles to CMS within 6% — use as canonical net contribution

### Organic / Search
- **Search Console aggregate position improved** (non-branded 16.3 → 7.2), contradicting "lost organic rankings" hypothesis
- **But:** CTR doubled while conversions stayed down. Possible explanation: impressions ballooned for low-intent queries; commercial query-level data not available
- **GMB AU:** 430–540 views/day pre-Jan 2026, then cliff to 166–275/day for ~6 weeks, partial recovery

### Email (Brevo)
- **33 campaigns since 2025-10-27** (no earlier data — was Klaviyo)
- **Open rates:** 24–26% Mar–Apr 2026, down from halved BFCM period (12–13%)
- **No revenue attached** to Brevo campaigns directly

---

## 2. Critical Business Headlines

1. **YoY decline is real:** Combined web+store orders -12.6%, rev -10.3%, GP -16.2% (Mar 2025→Mar 2026)
2. **Google Ads pullback is the primary driver of web cliff:** AW spend correlates +0.698 with daily orders; December peak followed by Q1 pullback
3. **Facebook is likely unprofitable on attributable basis:** 0.30× real ROAS, net loss of A$6.7k/month in 30d window
4. **Margin recovery in 2026 is real** (20.2% Dec → 27.4% Apr) but on a smaller revenue base
5. **AOV is climbing while order volume falls** — shift toward premium devices
6. **Store is a first-class peer** — don't bury it inside web metrics

---

## 3. Data Gaps That Affect Dashboard Design

| Gap | Impact on Dashboard |
|-----|---------------------|
| CMS Jul–Nov 2025 missing | 6m/12m windows show partial history; must flag gap prominently |
| AW/FA/AC 3m+ not on disk | Paid trend drill-downs limited to 30d; longer windows show "data pending" |
| GA4 3m+ channel summary not saved | Funnel/journey beyond 30d unavailable |
| ProfitMetrics 3m+ pending | Net contribution by channel beyond 30d unavailable |
| No order-level attribution | Cannot do multi-touch attribution; must show aggregate daily correlations only |
| Store refunds don't link to orders | Show aggregate refund line only, not per-order refund rate |

---

## 4. Recommended Dashboard Priorities (MVP)

1. **CEO Overview** — combined web+store KPIs, weekly trend, channel mix, platform claim vs reality
2. **Web Orders Drill-down** — daily/weekly revenue, orders, GP, AOV, refund rate, brand mix
3. **Store Sales Drill-down** — same for store, with accessory/repair caveat badge
4. **Paid Media** — spend daily by platform, platform-claimed vs CMS-derived ROAS, over-attribution table
5. **Organic** — Search Console clicks/position, GA4 organic sessions, funnel to orders
6. **Email** — Brevo campaign performance, open/click rates over time
7. **Data Trust** — availability table, quality flags, imputation %, known caveats

---

## 5. Open Questions

1. Should FB be shown with platform-reported ROAS (19×) AND real ROAS (0.30×) side-by-side, or only real ROAS?
2. How to visualise the 35% "Unassigned" bucket — as "unknown" channel or exclude from channel mix?
3. Should the dashboard proactively recommend spend reallocation (cut FB, grow AW), or only surface data?
4. What is the target refresh cadence — daily manual re-run, or file-watcher auto-reload?
5. Should store data be shown as a separate "Store" channel in cross-channel mix, or kept separate from marketing channels?
