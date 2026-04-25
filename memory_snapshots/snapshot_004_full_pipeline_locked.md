# Memory snapshot 004 — Full pipeline locked, scale plan ready
**Written:** 2026-04-25
**Stage:** All 9 lockstep steps complete + 4 deepening passes + dashboard + scale plan + FB holdout protocol
**Project:** Phonebot AU customer journey intelligence

## What's been built (final state)

### Data layer
- 7 source-of-truth pulls + 2 discovered (Bing, GMB) + 1 future (Klaviyo deferred)
- Per-window data files for 1m / 3m / 6m / 12m + full 14-month CMS history
- Master daily cross-source cubes at 1m and 3m granularity (`cross_checks/MASTER_daily_1m.csv`, `3_month/MASTER_daily_3m.csv`)
- Master weekly aggregation 3m (`3_month/MASTER_weekly_3m.csv`)

### Analysis docs (all LOCKED — don't override without flagging)

**Triangulation (Step 7):**
- `cross_checks/step7_LOCKED_triangulation_30d.md` — Channel level: FB 65× over-attrib, AW honest at 1.35×
- `cross_checks/step7_LOCKED_campaign_triangulation_30d.md` — Campaign level: brand harvest = 60% net profit on 14% spend
- `cross_checks/step7_LOCKED_yoy_triangulation_sep2025_vs_apr2026.md` — Sep25 vs Apr26 stable underperformance on FB
- `cross_checks/step7_LOCKED_multiwindow_triangulation.md` — 1m/3m/6m/12m all confirm FB unprofitable, AW saturating curve

**Diagnostic deep-dives (Step 8):**
- `cross_checks/step8_LOCKED_organic_query_diagnosis.md` — Organic "lost rankings" half-true: refurbished-X queries -95 to -99%, research queries gained, branded demand -40%
- `cross_checks/step8_LOCKED_product_cliff_diagnosis.md` — Web rev -33% but margin IMPROVED, mix shifted up-market. iPad biggest dollar gap. Only iPhone Like New shows real price pressure.

**Conclusions + scale plan (Step 9):**
- `final_conclusions/STEP9_FINAL_CONCLUSIONS.md` — 13-section CEO-grade conclusion document
- `cross_checks/step9_LOCKED_90day_drill_and_scale_plan.md` — Last 90d weekly drill + ranked scale levers, A$13-24k/mo realistic upside

**Operational protocol (Step 10):**
- `cross_checks/step10_FB_incrementality_holdout_protocol.md` — Paste-ready 14-day FB holdout test design

**QA + maps:**
- `qa_checks/STEP3_QA_INDEX.md` — Canonical QA index, every source's status
- `field_maps/file_inventory.md`, `field_maps/schema_map.md`, `field_maps/metric_definitions.md` — Kimi handoff

**Live dashboard:**
- Cowork artifact `phonebot-ceo-dashboard` — KPIs, 90d daily revenue chart, channel performance, top campaigns, brand 30v30, open levers panel

## Definitive findings (confidence level high)

1. **Margin is healthy and improving** — 26.5% → 28.5% Sep 25 → Apr 26. This is NOT a competitive-pricing crisis at the business level.
2. **Volume is the problem, not price.** Order count -49%, AOV +32%. Mix shifting up-market.
3. **Brand harvest dominates paid net profit** — CJ Phonebot (B) Google brand = +A$12k net/30d on A$2.6k spend.
4. **FB has been unprofitable across every window** — 0.08-0.10× real GP/$ for 12 months. -A$133k/year.
5. **AW has a clean saturating-returns curve.** Sweet spot ~A$900-1,100/day. Current A$637/day.
6. **Organic search lost commerce-page rankings** specifically (Helpful Content / Reviews update signature). Blog content gaining. F's call: don't fight the algorithm.
7. **Branded "phonebot" demand fell 32-44%** with rank unchanged at #1. Concurrent with FB cuts. FB holdout test will resolve this.
8. **Inventory constraints confirmed by F** — MacBook (-A$18k/mo), AirPods + Xiaomi + Huawei (-A$10k/mo) are supply-side, not demand.
9. **iPad is biggest dollar gap (-A$53k/mo)** but NOT solvable through paid alone — saturating curve math doesn't work at iPad-recovery scale.
10. **Combined web+store** — store +5/+10/+20% growth offsets some web decline. Web-channel-specific cliff, not whole-business.

## Open decisions (F's call)

| Decision | Lever | Status |
|---|---|---|
| Run FB holdout test | -A$1,246 cost over 14d, +A$3-4k/mo if non-incremental | Protocol ready, awaiting go |
| Cut marginal AW campaigns (1.1-1.2× ROAS slice) | +A$1.5k/mo, low risk | Awaiting go |
| Bing scale test (Shopping + Refurb Phones) | +A$2k/mo, low risk | Awaiting go |
| PMax (Apple) iPad +50% controlled test | +A$0.5k/mo or stop | Awaiting go |
| MacBook + AirPods inventory restoration | +A$5-15k/mo gross | Procurement-side, F's call |
| iPhone Like New pricing audit | +A$1-2k/mo if needed | 30 min task |
| Hand `customer_journey_intelligence/` folder to Kimi | Parallel dashboard build | F to upload to Kimi sandbox |

## Open data items (F's call, deferred)

- Klaviyo email history (pre-2025-10-27) — F said end of project, may not be available, stale anyway
- 6m/12m FA campaign-level data on disk (currently aggregate only) — re-pollable if needed
- Page-level GW history pre-Apr 2025 — limited by GSC retention

## Forward-looking metrics dashboard tracks

- CMS daily orders (target 30+/day from current 25)
- GP minus paid spend / week (target A$22k+ from current A$15-18k)
- AW real GP/$ (hold above 1.5× while scaling)
- FB daily orders during any holdout window
- PMax (Apple) iPad daily ROAS (during +50% test)
- GSC branded "phonebot" daily clicks (FB holdout secondary signal)

## Memory file index (in spaces/.../memory/)

- `MEMORY.md` — auto-memory index
- `project_fb_ads.md` — FB account context
- `project_yoy_decline_2025_2026.md` — YoY combined web+store
- `project_step7_triangulation_finding.md` — channel triangulation
- `project_organic_query_diagnosis.md` — organic search resolution
- `project_product_cliff_diagnosis.md` — product-category cliff
- `project_scale_plan_apr2026.md` — forward scale plan
- `project_customer_journey_build.md` — project state
- `project_sweet_spot_findings.md` — AW campaign sweet spots
- `feedback_seasonality.md`, `feedback_granular_depth.md`, `feedback_automated_bidding_check.md` — feedback memories
- `reference_brevo_supermetrics.md` — Brevo source reference

## What this snapshot is for

Future-you (or another assistant) reading this can reconstruct project state without re-running any analysis. All numbers are anchored to **2026-04-24** (most recent CMS date as of writing).
