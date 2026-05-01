# Phonebot Customer Intelligence Dashboard — Project Context

This is a Phonebot-internal analytics + decision-support project. Phonebot is an Australian phone retailer (refurb + accessories + repair, with a Melbourne walk-in store and a national e-commerce site running OpenCart 2.2). This file gives any Claude session the structural context it needs to be useful immediately.

---

## Business model and structural facts

- **Channels:** Web (Cybersource / PayPal / Afterpay / Zip — Mobile-Web is the largest single platform) + Melbourne walk-in store (cash + card + Phonebot split-pay).
- **Procurement:** Refurb phones imported from UK auction houses. **Critical structural detail:** the auctioneers also operate competing UK retail. Even when Phonebot wins a bid, the auctioneer can allocate the best stock to their own retail first. Stock depth is constrained by relationship/politics, not capital. (See `.claude-memory-backup/project_supply_constraint.md`)
- **AOV:** ~A$540-580 across web + store as of April 2026.
- **Net GP %:** typically 27-30%; store slightly higher than web; varies by month with mix and competitive pressure.
- **AU staff cuts (Apr 2025 → Apr 2026):** ~A$14k/mo saved (cut 2 senior dispatch staff). Plus ~A$8.5k/mo in Pakistan, but only ~50% attributable to Phonebot (mixed with other projects). Use $14k AU + $4.25k PK ≈ $18.25k/mo of OpEx savings as the baseline.
- **AUD/GBP FX:** AUD strengthened ~11% YoY through April 2026. This translates to ~A$25-30k/mo of GP tailwind on imported COGS (mid 65% GBP-share of COGS assumption). Strip this from any YoY comparison to get the underlying business signal. (See `.claude-memory-backup/project_fx_tailwind.md`)
- **Marketing spend:** Google Ads (largest) + Meta + Microsoft (Bing). PPC agency does NOT charge % of ad spend (no misaligned-incentive narrative applies). April 2026 was supply-constrained — algorithm pulled spend back automatically because GMC had fewer in-stock SKUs to bid on. NOT a strategic spend cut.

## How to read order data correctly

Order CSVs / xlsx (`{month} {year} orders {website|store}.xlsx`) have these columns: Order ID, Email, Postcode (sometimes), State (sometimes), Status, Products, Total Quantity, Total, Cost Price, Gross Profit, Date Added, Shipping Method (sometimes), Payment Method, Platform.

**Status interpretation (NON-OBVIOUS):**
- `Complete`, `Shipped` → revenue cohort
- **`Fraud`, `Fraud Review` → these are RISK RATINGS, not confirmed fraud.** Most ship anyway. Count as revenue. Only the small subset that turn out to be real fraud (cheap-bait clusters like 48× $19 screen protectors in 3 nights, or last-minute high-value items) get moved to refunded later. (See `.claude-memory-backup/feedback_order_status_fraud.md`)
- `Returned & refunded` → genuine refund, exclude from revenue cohort, treat separately

**Walk-in store cost imputation (when Cost Price = $0):**
- `accessory` (cover, case, glass, charger, cable, etc.): cost = 40% of sell
- `repair` (screen replacement, battery, install, etc.): cost = 50% of sell
- `parts_only` (screen for X, battery for X, parts given to cx): cost = 60% of sell
- Default: 50% of sell
- (See `.claude-memory-backup/feedback_walkin_cost_defaults.md`)

**Refund GP imputation:** the refund flow has two known bugs — (a) GP is force-set to $0 even when cost is preserved; (b) for high-value refunds, the cost field gets a shipping/processing fee written into it instead of original COGS. Workaround until dev fix: apply channel cohort GP% × refund revenue to estimate refund GP loss.

## Known data infrastructure

- **GA4 → BigQuery export** wired up 2026-04-28. Project `bigquery-api-494711`, dataset `analytics_284223207`. Flat views in `dashboard_connection/`. (See `.claude-memory-backup/project_ga4_bq.md`)
- **GA4 click-ID retention:** fbclid/gclid only land on session_start, NOT on purchase events. Use `vw_sessions` for attribution, not per-event lookups. (See `.claude-memory-backup/project_ga4_attribution.md`)
- **Supermetrics MCP** is the way to pull live marketing data. Account IDs: Google Ads `AW` 3900249467, Meta `FA` act_14359173, Microsoft `AC` 180388397, GMC `GMC` 101150783, GSC `GW` https://www.phonebot.com.au/. Always include a currency dimension when querying monetary fields. Always normalize CSV headers (Supermetrics returns display names, not schema names — DuckDB will silently NULL otherwise). (See `.claude-memory-backup/reference_supermetrics.md`, `.claude-memory-backup/feedback_csv_header_normalization.md`)
- **BigQuery CLI access** — install `gcloud` + `bq` per-machine. (See `.claude-memory-backup/reference_bq_access.md`)
- **Email alerting via Brevo.** User prefers email over Slack. (See `.claude-memory-backup/project_alerting.md`)
- **ProfitMetrics Conversion Booster V2** deployed 2026-04-29 by Pat (GTM Version 86). Monitor Unassigned channel impact for 14d. The Unassigned channel = ~290 trans / $134k / 30d — biggest channel in PM data. This is the value-prop of PM, NOT a bug to fix. (See `.claude-memory-backup/project_profitmetrics_v2_tag.md`, `.claude-memory-backup/project_unassigned_channel.md`)

## What happened in this project's recent strategic review (2026-05)

A multi-day analysis comparing April 2025 vs March 2026 vs April 2026 to answer: did scaling back marketing work? Outputs are preserved in [analyses/2026-05-strategic-review/](analyses/2026-05-strategic-review/).

**Headline answers (cleaned with all rules above):**
| Period | Net Revenue | Net GP | Marketing Spend | Profit-after-marketing |
|---|---:|---:|---:|---:|
| March 2025 | $711,032 | $205,844 | $50,265 | $155,579 |
| March 2026 | $650,671 | $174,740 | $40,975 | $133,765 |
| April 2026 | $540,303 | $154,341 | $26,454 | $127,887 |

**Verdict:** scaling back worked AS DEFENSE. Headline op profit only -$8k YoY (March 25→26) despite -$31k GP, thanks to $9k marketing + $14k AU staff + $4k PK staff savings. Per-marketing-$ efficiency improved +24.7% headline. But FX-stripped, underlying business is roughly flat YoY — the cost cuts absorbed a real demand decline (organic clicks -13% YoY, CTR -26% from AI Overviews). May 2026 won't be a victory lap because EOFY pressure typically compresses GP% 2-4pp.

**Strategic recommendation:** semi-autopilot AU (cash engine), build UK as the second engine (more attractive than UAE on supply terms because UK retail puts you on equal footing with the auctioneers). Don't try to scale AU paid marketing past current — diminishing returns kick in hard above $50k/mo.

**OOS leak finding (BIG):** ~A$8,250/30d (~A$99k/yr) of confirmed Google Ads spend on currently-OOS or orphaned SKUs. 24 highest-confidence cases (sold ≥10 days ago, ≥$50 spent, ≥1000 imp) total ~A$21k/yr. Worst offenders: Galaxy Watch 8 Classic (#8307, 43 days OOS) and Apple Watch Series 9 (#7042, 36 days OOS). Full list + Ads-manager review PDF in `analyses/2026-05-strategic-review/oos_leak/`.

**SKU money-on-the-table:** $201k/mo of organic-driven sales at 28.5% margin getting essentially zero paid push (Quadrant C). Conservative ad lift on top 15 organic winners = ~$10-15k/mo incremental GP. Plus thin-margin pricing lift, branded search defense, cross-sell at checkout, return rate reduction. Aggregated potential: ~$28-46k/mo addressable AU-only without entering new geos. See `analyses/2026-05-strategic-review/sku_quadrants/`.

## Active automation

- **Weekly cron routine** runs every Monday 9am AEST (`0 23 * * 0` UTC). Pulls last-7-day spend across all 3 platforms via Supermetrics, classifies supply recovery state vs March/April baselines, runs OOS leak detection (>5% of weekly spend = ELEVATED), drafts a weekly digest in user's Gmail Drafts folder + writes markdown backup. Routine ID: `trig_015zhzCXXmSZfdhCaHYPa3N6`. Manage at https://claude.ai/code/routines/trig_015zhzCXXmSZfdhCaHYPa3N6. **Should be manually disabled around 30 June 2026** when EOFY tracking window ends (no API auto-stop).

## User profile and collaboration style

- User runs Claude across multiple iMacs/PCs on the same project. **Always commit + push before session ends.** (See `.claude-memory-backup/user_workflow.md`)
- User is the founder/CEO. Optimizes for net profit, not ROAS. Sophisticated — give honest analysis with tradeoffs, not generic strategy. Comfortable with caveats and ranges.
- User explicitly asked to be told both yes-and-no readings of strategic questions, not single answers. Respect that.

## Memory restoration on a new machine

The Claude per-project memory lives at `~/.claude/projects/-Users-admin-Desktop-Customer-Intelligence-Dashboard/memory/` and does NOT auto-sync across machines. A backup is preserved in this repo at [.claude-memory-backup/](.claude-memory-backup/).

**To restore on a new iMac after `git clone`:**
```bash
mkdir -p ~/.claude/projects/-Users-admin-Desktop-Customer-Intelligence-Dashboard/memory
cp .claude-memory-backup/* ~/.claude/projects/-Users-admin-Desktop-Customer-Intelligence-Dashboard/memory/
```

After that, this CLAUDE.md auto-loads on any session start, and the per-memory files are accessible to the auto-memory system.

## Re-running the May 2026 cleaning analysis on a new machine

Raw inputs are tracked at repo root: `march 2025 orders {website|store}.xlsx`, `march 2026 orders {website|store}.xlsx`, `{website|store} orders april 2026.xlsx`. Cleaned outputs are in `analyses/2026-05-strategic-review/cleaned_data/`. The cleaning logic (Fraud filter rules, walk-in 40/50/60 imputation, refund GP cohort %, FX strip) is documented above and in the memory files. Any cleaning script can be reconstructed from those rules — they're not buried in code, they're in memory.
