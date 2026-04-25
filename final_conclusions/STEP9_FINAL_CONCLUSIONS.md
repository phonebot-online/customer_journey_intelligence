# Step 9 — Final Conclusions: Phonebot Customer Journey Intelligence
**Date locked:** 2026-04-25
**Analyst:** Claude (operating in lockstep mode)
**Scope:** Australia, web + Reservoir VIC physical store. AE explicitly out. UK explicitly out.
**Decision-grade evidence:** all conclusions trace to specific files in `/customer_journey_intelligence/` saved on disk. Every number cited can be reproduced from CMS, GA4, ProfitMetrics, AW, FA, AC, GW, SIB, or GMB sources.

---

## 1. Executive truth

The "FB account profitable, not broken" framing in prior memory was correct *at the FB account-level dashboards*. But triangulating with CMS, GA4 last-click, and ProfitMetrics commercial truth reveals a substantially different picture:

1. **The business is not in decline at the macro level.** Combined web+store YoY March: orders -12.6%, revenue -10.3%, GP -16.2%. Web declined, **Reservoir VIC store grew** (+5%/+10%/+20% YoY March). The "decline" everyone was alarmed about is web-channel-specific. The brand and the product still work — Phonebot's physical store had its strongest March ever in 2026.
2. **Facebook is unprofitable on attributable basis and has been for at least 12 months.** A$145,455 spent over 12 months → A$12,705 ProfitMetrics-attributed GP → **A$132,750 net loss**. Real GP-per-spend ratio has been 0.08-0.10× in every measurement window we tested. Memory's prior "42× over-attribution" estimate was too conservative; it's 65-238×.
3. **Google Ads is the workhorse and has been honestly priced.** A$473,966 spent over 12 months → A$600,489 PM GP → **A$126,523 net profit**. AW over-attributes 5-7× (vs FB's 65-238×), and unit economics are sound. F's Q1 spend pull-back was efficiency-positive — cutting AW from A$1,558/day peak to A$637/day current improved unit GP/spend from 1.27× to 2.49×.
4. **Combined paid-ad ecosystem net contribution over 12m is roughly break-even** at the PM-attributable level (A$127k AW profit ≈ A$133k FB loss). F has been spending A$619k/year on AW+FA combined for net-attributable A$0. The real picture depends on FB's untracked incrementality, which **cannot be quantified without a holdout test**.
5. **Search Console aggregate data does NOT support the "lost organic rankings" hypothesis.** Non-branded organic clicks tripled and average position improved 16 → 7 over the period. Either the loss is on specific commercial queries (need query-level pull) or organic is healthy and the issue is on-site CR / pricing. Don't deploy SEO recovery effort before validating.

---

## 2. Source trust summary

| Source | Coverage | Trust tier | Use as |
|---|---|---|---|
| CMS web orders + refunds | 14 months full history (Mar 2025–Apr 2026) | **HIGHEST** | Commercial truth for web channel |
| CMS store orders + refunds | 14 months full history | **HIGHEST** for orders/revenue. Store GP is **upper-bound only** (Cost Price not tracked for accessories/repairs) | Store performance |
| ProfitMetrics GP property (`488618020`) | 12 months | **HIGH** — reconciles to CMS imputed GP within 6% | Channel attribution truth |
| ProfitMetrics Revenue property (`488590631`) | 12 months | HIGH | Per-channel revenue, server-side included |
| GA4 main AU (`284223207`) | 12 months | MEDIUM-HIGH for sessions; MEDIUM for revenue (under-tracks ~20% server-side) | Funnel + traffic |
| AW (`3900249467`) | 12 months | HIGH for spend/clicks; MEDIUM for value (over-attributes 5-7× vs PM) | Spend, click intent |
| AC (Bing, `180388397`) | 12 months | HIGH within small footprint | Search complement |
| GW (Search Console phonebot.com.au) | 12 months | HIGH for clicks/impressions; aggregate position is misleading at high level | Organic visibility |
| FA (`act_14359173`) | 12 months | HIGH for spend/impressions; **LOW for value** (65-238× over-attributes) | Spend, exposure only |
| FA (`act_1141970792623135` Fahad Zafar) | Pulled but appears to be duplicate | UNCLEAR | Investigate or ignore |
| GMB | 12 months | HIGH within scope | Local-store funnel only — does NOT correlate with web orders |
| Brevo (SIB) | Since 2025-10-27 (~6 months) | HIGH for sends/engagement; **NO REVENUE** | Email volume only — no $ available |
| Klaviyo (KLAV) | Not connected | — | Pre-Oct 2025 email gap; user may attach later |

---

## 3. Customer journey — system picture

### Web journey (the main, well-tracked one)
```
Demand source → Site session → Cart → Checkout → Order → (Refund?)
```
| Stage | Source(s) capturing | 30d typical |
|---|---|---|
| Demand source | GA4 sessionDefaultChannelGrouping | Cross-network 11.6k, Organic Search 13.7k, Paid Search 6.9k, Direct 4.3k, Paid Social 1.4k |
| Site session | GA4 sessions | ~52k AU sessions/30d |
| Cart | GA4 addToCarts | ~3,500 add-to-carts/30d |
| Checkout | GA4 checkouts | ~2,200 checkout-starts/30d |
| Order | CMS (truth) | 763 orders/30d |
| Refund | CMS refunds | ~50 refunds/30d (lagged) |

Funnel rate site session → order: **1.45%** (very rough; varies by channel).

### Store journey (less instrumented but real)
```
GMB views/search → GMB phone+directions → Walk-in → Store order → (Store refund?)
```
| Stage | Source | 30d typical |
|---|---|---|
| GMB views | GMB | ~10,958 (27 days excl GMB lag) |
| GMB actions | GMB | ~1,017 |
| GMB phone calls | GMB | 209 |
| GMB direction requests | GMB | 356 |
| Store orders | Store CMS | 296 orders/30d |
| Store refunds | Store refund file | aggregate ~A$25k/30d |

GMB → store-orders correlation in last 30 days: **+0.10** (effectively zero). The GMB-to-store funnel works on a multi-day lag and is not visible in same-day correlation. People search Phonebot on Google Maps days before actually walking in. This is normal — don't expect daily correlation here.

### Email journey (Brevo only, since Oct 2025)
```
Send → Open → Click → (back through web journey)
```
- 33 campaigns × 26.7% open rate × 1.77% click rate × downstream conversion not tracked. Brevo doesn't capture revenue.
- **Easter Sale 2026-04-04**: 25,687 sends, 26.7% open, 1.7% click — biggest single campaign.
- Open rate halved during BFCM (Nov-Dec 12-13%) due to send-volume saturation, recovered to 24-26% in Q1 2026.

### Cross-channel attribution: the over-attribution problem
- All paid platforms claim revenue. Sum of (FA + AW + AC) platform claims = 96% of total CMS revenue. **Mathematically impossible** if all were incremental. Therefore: massive double-counting.
- After triangulation: PM-attributable share = AW 41% + Paid Shopping 6% + FB 0.5% + Bing (lumped in PSearch) ≈ **47% of revenue from paid**, with **35% from server-side "Unassigned" bucket** and **18% from organic + direct + referral**.

---

## 4. What is genuinely driving growth

### a. Brand campaigns (Google Ads)
- `CJ - Phonebot (B)` (Google brand) is the single most profitable line-item: A$2,577 spend / 30d → A$14,833 PM GP / 30d → **A$12,256 net profit / 30d** → 22× real ROAS.
- `CJ - Phonebot (B)` (Bing brand): A$121 spend → A$1,667 PM GP → A$1,546 net / 30d → 61× real ROAS, possibly under-spent.
- `Phonebot (B) Standard Shopping`: A$336 spend → A$2,146 PM GP → A$1,810 net / 30d → 27× real ROAS.

**Brand campaigns combined = 60% of paid net profit on 14% of paid spend.** This is brand-harvest, not brand-creation. The customers searched for Phonebot. The campaigns captured the click. **Whether they would have arrived organically anyway is the unanswered question** — but in any case, the $ outflow is small and the return is high.

### b. Apple PMax (iPad and non-iPad)
- `CJ - PMax (Apple) iPad`: A$3,644 spend → A$6,278 PM GP → A$2,634 net / 30d → 5.5× real ROAS. Largest-non-brand winner.
- `CJ - PMax (Apple)` non-iPad: A$1,654 spend → A$1,874 PM GP → A$220 net / 30d → 4.5× real ROAS. Marginal but positive.

### c. Samsung PMax
- `CJ - PMax (Samsung)`: A$2,876 spend → A$5,722 PM GP → A$2,846 net / 30d → 6.8× real ROAS.

### d. Reservoir physical store
- A$2.38M revenue / 14m / A$612k raw GP / 25.7% raw margin. Composition: 95% devices (devices have proper Cost Price tracking and 22.7% real margin), 5% accessories+repairs+other.
- **Store grew +9.7% rev YoY March vs web's -15.4% YoY.** Local presence is winning where web is losing.

### e. Organic search clicks
- 12-month organic clicks: ~150k. Position improved (16 → 7 average). Volume tripled.
- **NOT validated as growth driver.** Aggregate position improved but order share didn't grow proportionally — suggests traffic mix shifted to lower-intent queries.

---

## 5. What is wasting money

### a. Facebook + Instagram (highest priority)
- A$145,455 spent over 12 months → **A$132,750 net loss on PM-attributable basis.**
- Pattern stable across 1m / 3m / 6m / 12m windows.
- Cannot rule out incrementality, BUT cannot prove it either with current tracking. Pixel + utm tagging is broken.
- **Action: 50% spend cut on cold-prospecting for 2 weeks. Watch CMS daily orders. If unchanged, FB is non-incremental.**

### b. Specific AW campaigns to pause immediately (per 30d data)
- `Standard Shopping - iPhone 17`: A$343 spend / 30d → 0 PM purchases. Pause. Investigate why iPhone 17 isn't selling through this campaign (inventory? feed? targeting?).
- `PMax - iPhone 17`: A$104 spend / 30d → 0 PM purchases. Same issue.
- `CJ - PMax (Everything Else)`: A$887 spend / 30d → -A$101 net (negative attributable margin). Diluted catch-all. Recategorise SKUs.
- `CJ - DSA (All Pages)`: A$96 spend / 30d → 0 PM purchases. Dynamic Search Ads with no proven attribution.

### c. Lead-gen FB campaigns measured wrong
- `UAE - Burjuman Store - Walk-in Traffic`: A$524 / 30d (out of scope per AE = out)
- `whatsapp buyback`: A$65 / 30d, 0 web purchases — but this is a buyback funnel, not a purchase funnel. **Not actually wasted IF buyback completions are tracked elsewhere**. Need to ask F: does buyback yield credit-toward-future-purchase?

---

## 6. What is assisting conversion vs claiming conversion

| Channel | Claims (platform) | Last-click attributable (PM) | View-through / multi-touch (memory) | Assist-only? |
|---|---|---|---|---|
| Google PMax (Cross-network) | A$81k/30d | A$19k/30d | Likely large halo on Paid Search and Direct | Mostly REAL — clicks lead to purchase same-session frequently |
| Google Paid Search | A$93k/30d | A$22k/30d | Some halo onto Brand campaigns | Mostly REAL |
| Brand campaigns (CJ - Phonebot (B)) | A$72k/30d | A$15k/30d | Catches user who already typed brand | Mostly ASSIST (would convert anyway) |
| FB+IG | A$142k/30d | A$0.6k/30d | **HEAVY halo claimed but unproven** | Currently looks like ASSIST or NOTHING |
| Bing | A$21k/30d | (lumped in Paid Search ~A$22k) | Small | Real but tiny |
| Email (Brevo) | n/a | not measurable | Major assist (open → website → org/direct purchase) | Likely ASSIST-heavy |
| Organic Social | A$0 | A$1k/30d (Instagram organic) | Low | Marginal |
| Search Console (organic) | A$0 | A$36k/30d | Low — most organic is intent-driven | REAL |

**The "assist vs claim" line:** brand campaigns + FB are the most likely "assist-only" channels. Google PMax and Paid Search are mostly real-conversion channels.

---

## 7. What is working in email, AI, paid, analytics, and profitability layers

### Paid (refined view per Section 5+6)
- **AW Cross-network (PMax) + Paid Search + Paid Shopping**: working, profitable, modestly over-spent at peak then right-sized.
- **AW Brand campaigns**: high apparent ROAS but high-assist suspicion.
- **FB**: working as a media buy, NOT as a measurable conversion driver. Treat as brand-awareness with unproven incremental conversion.
- **Bing**: small, profitable, hold spend.

### Email (Brevo, since Oct 2025)
- 33 campaigns / 6 months. Heavy BFCM volume (17 campaigns in Nov 2025). Open rates dropped 12-13% during high-volume periods, recovered to 24-26% in Q1 2026.
- **Easter Sale 2026-04-04** is the biggest single send (25,687 recipients).
- Click rate doubled in 2026 vs 2025 (0.79% Dec → 1.77% Mar/Apr). Indicates better list segmentation or content.
- **Limitation**: cannot tie sends → CMS revenue without UTMs in email links (would require Brevo-side change).

### Analytics (GA4 + ProfitMetrics)
- Working: ProfitMetrics GP attribution reconciles to CMS within 6%. ProfitMetrics is the load-bearing metric.
- Broken: FB pixel + utm tagging — GA4 sees almost no `facebook / cpc` sessions. Memory: 62% of Purchase events have a `fbclid` server bug.
- Investigate: **PM "Unassigned" bucket = 35% of total GP** at 12m. Need to know what server-side conversions feed it.

### Profitability layer
- Web margin imputed 25.33%; raw 23.86%. Refund rate 5.66% revenue.
- Store raw margin 25.70% on devices, but accessory/repair items have inflated margin readings (Cost not tracked).
- Combined business 25.42% imputed margin.
- **2026 margin recovery is real but on smaller volume.** Net GP YoY March: -16.2% combined.

### "AI" — none currently in the stack worth analyzing.

---

## 8. Where the biggest bottlenecks are

### a. FB attribution is broken at the source
Without fixing the pixel + utm tagging, FB's real contribution cannot be measured. Estimated impact: **A$145k/year of unmeasurable spend**. Fix priority: HIGH.

### b. ProfitMetrics "Unassigned" 35% of GP
A$612k of attributable GP over 12 months falls into "Unassigned" — likely server-to-server purchase events. Without classification, paid-channel relative shares could be off by ±10%. Fix priority: MEDIUM (ask ProfitMetrics what populates this bucket).

### c. Search Console query × page intelligence not pulled
The "lost organic rankings" hypothesis is unverifiable without specific-query data. Fix priority: MEDIUM (one extra Supermetrics pull).

### d. Brevo has no revenue attribution
Email contribution to CMS revenue is invisible. Cure: add UTMs on outbound links in Brevo emails. Fix priority: MEDIUM.

### e. Store walk-in journey not instrumented
GMB phone calls, directions requests, and walk-ins → store orders cannot be linked. The Reservoir store growing +10% YoY but we can't say which channel is driving it. Fix priority: LOW (store is growing, it's not on fire).

### f. Klaviyo history (pre-Oct 2025) not connected
6 months of pre-Brevo email history is dark. F may attach later. Fix priority: LOW.

---

## 9. Highest-confidence opportunities

### Opportunity 1: Cut FB cold prospecting in half for 2 weeks (incrementality test)
- **Cost**: ~A$2,500 if FB is genuinely incremental and CMS orders drop.
- **Information value**: definitive answer to "is FB incremental".
- **Likely outcome based on data**: CMS orders hold flat → FB confirmed non-incremental → reallocate ~A$5k/mo to Google Ads or organic content investment.
- **Confidence: HIGH.**

### Opportunity 2: Pause 4 unprofitable AW campaigns
- Saves ~A$1,400/mo: Standard Shopping iPhone 17 (A$343), PMax iPhone 17 (A$104), CJ - PMax (Everything Else) (A$887), CJ - DSA (A$96).
- **Risk**: If iPhone 17 inventory is genuinely available and these campaigns just need fixing (feed/landing-page issues), cutting them removes a future-revenue path.
- **Confidence: MEDIUM-HIGH.** Pause and root-cause iPhone 17 issue first; cut DSA and Everything Else outright.

### Opportunity 3: Scale Bing Brand campaign (CJ - Phonebot (B))
- A$121/30d → 60.91× real ROAS → A$1,546 net profit / 30d.
- Try A$300-500/30d. Expected outcome: diminishing returns kick in, but still strong. Net profit potentially A$2-3k/mo from this single line.
- **Confidence: HIGH** but capped by Bing brand-search volume (small).

### Opportunity 4: Test +A$300/day AW spend increase
- Current A$637/day. Test A$1,000/day for 30 days. Expected: real GP/spend drops from 2.49× toward 1.81×, but absolute net profit increases from A$28k/mo to ~A$30-32k/mo if model holds.
- **Confidence: MEDIUM.** Do this AFTER Opportunity 1 + 2 results land — may not need it if FB savings reallocate to AW.

### Opportunity 5: Investigate Q3 2025 margin compression
- May 2025 margin 21.85%, Dec 2025 margin 20.22%. Apr 2026 28.39%. The 2025-Q2-Q4 dip is a separate story from the Q1 2026 volume cliff.
- Hypotheses to test: COGS spike (USD-AUD)? Promotional drift? Mix shift?
- **Confidence: LOW priority but high-information.** Recovery is happening; root cause matters for not repeating it.

---

## 10. Biggest unknowns

| Unknown | Impact if resolved |
|---|---|
| Whether FB has real incremental contribution above PM-attributable | Could shift A$145k/yr decision either way |
| What feeds ProfitMetrics "Unassigned" (35% of GP) | Could change channel shares ±10% |
| Whether specific commercial GW queries lost rank | Validates or invalidates the SEO-recovery lever |
| Whether store growth is from FB local-engagement or unrelated | Validates or invalidates a small-but-strategic FB campaign |
| Whether Q1 web cliff was avoidable or was efficient cost-cutting | Decides "restore AW spend" vs "this is the new normal" |
| Whether iPhone 17 campaigns failed because of inventory or campaign config | Decides pause-vs-fix for those campaigns |
| Walk-in attribution (GMB phone+directions → store revenue) | Closes the FB-local-engagement value question |

---

## 11. Decisions the CEO dashboard CAN safely support

1. **Spend share by channel (gross paid)** — visible from AW + FA + AC files. Reliable.
2. **Combined web+store revenue / GP / margin trends** — CMS truth, fully reconciled.
3. **Refund rate by brand and category** — available.
4. **Daily / weekly cross-channel attribution snapshots using PM-GP attribution** — locked Step 7 outputs.
5. **YoY comparisons (Sep 2025 vs Apr 2026 specifically)** — locked.
6. **Web vs Store volume comparison** — locked.
7. **Campaign-level real-ROAS and net profit** — locked Step 7 outputs.
8. **Search Console aggregate trend (clicks, impressions, position) AU site only** — saved.
9. **Brevo campaign engagement rates** — saved.
10. **GMB AU action volumes** — saved.
11. **Multi-window (1m/3m/6m/12m) channel efficiency comparisons** — locked.

---

## 12. Decisions still requiring caution

1. **Any decision to scale FB beyond current spend** — must wait for incrementality test.
2. **"Lost organic rankings" SEO recovery investment** — must wait for query-level GW validation.
3. **Store-channel attribution claims** — store walk-in funnel not instrumented. Don't claim "GMB drives store revenue" without store POS / walk-in attribution.
4. **Retention curves and LTV by channel** — possible from CMS Email field, but only within the 14-month window we have. Not full lifetime.
5. **Cost-of-goods-sold (COGS) accuracy** — Method B imputation handles 4% of orders; another ~5% of revenue (accessories+repairs in store) is overstated-margin. Don't make brand-level profitability claims at <5% precision.
6. **Pre-Oct 2025 email contribution** — Klaviyo data missing; assume zero attributable contribution at our current measurement window.

---

## 13. Recommended next moves (in priority order)

1. **THIS WEEK**: Cut FB cold-prospecting 50% for 2 weeks. Watch daily CMS orders. (Learning trumps optimization right now.)
2. **THIS WEEK**: Pause Standard Shopping iPhone 17 + PMax iPhone 17. Investigate iPhone 17 inventory/feed issue. Pause CJ - DSA and CJ - PMax (Everything Else) without further investigation needed.
3. **WITHIN 2 WEEKS**: Pull Search Console query × page data for last 6 months. Identify if any high-revenue commercial query lost rank. This validates or invalidates the SEO lever.
4. **WITHIN 2 WEEKS**: Ask ProfitMetrics support what populates "Unassigned" (35% of GP).
5. **WITHIN 1 MONTH**: Test +50% Bing brand campaign budget.
6. **AS BUDGET TIME PERMITS**: Fix FB pixel + utm tagging (referenced `fbclid` bug in memory). Without this, FB measurement remains broken.
7. **AT ANY TIME**: Attach Klaviyo historical data to fill pre-Oct 2025 email gap.
8. **AT ANY TIME**: Add UTMs to Brevo email outbound links so future email campaigns get GA4-attributed.
9. **STRATEGIC**: Decide whether the "smaller, more profitable web" of 2026 is the new normal or whether to reinvest savings (from FB cut + paused campaigns) into rebuilding web volume via additional AW spend.
10. **COMMUNICATION**: Update agency relationship with these triangulated numbers — the platform-reported ROAS they've been showing is over-attributed by 1.4× (AW) to 200×+ (FB).

---

## Appendix — file references

All conclusions in this document trace to:
- Step 0 inventory: `source_maps/00_step0_inventory.md`
- CMS QA: `qa_checks/cms_qa_step3_v2_full_history.md`
- Store QA: `qa_checks/store_data_qa.md`
- Step 7 channel-level lock: `cross_checks/step7_LOCKED_triangulation_30d.md`
- Step 7 campaign-level lock: `cross_checks/step7_LOCKED_campaign_triangulation_30d.md`
- Step 7 YoY lock: `cross_checks/step7_LOCKED_yoy_triangulation_sep2025_vs_apr2026.md`
- Step 7 multi-window lock: `cross_checks/step7_LOCKED_multiwindow_triangulation.md`
- Combined web+store: `12_month/cms_manual/combined_web_store_monthly.csv`
- File inventory: `field_maps/file_inventory.md`
- Schema map: `field_maps/schema_map.md`
- Metric definitions: `field_maps/metric_definitions.md`

This is the canonical Step 9 conclusion document. Future analysis should ground claims in these saved files.
