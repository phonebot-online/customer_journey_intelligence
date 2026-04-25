# Step 7 LOCKED — Three-source triangulation, last 30 days
**Window:** 2026-03-26 → 2026-04-24 (30 days, web only, AU-filtered)
**Date locked:** 2026-04-25
**Sources triangulated:** FA / AW / AC platforms + GA4 main AU (`284223207`) + ProfitMetrics Revenue (`488590631`) + ProfitMetrics GP (`488618020`) + CMS web orders (truth)

---

## Reconciliation check (do these match? if no, invalidate)
| Source | Revenue / GP | vs CMS |
|---|---|---|
| **CMS web (truth)** | A$406,206 rev / 763 orders / A$115,280 imputed GP | 100% |
| GA4 main AU | A$327,762 rev / 619 purch | 80.7% — undercounts (server-side / bot filter / etc.) |
| ProfitMetrics Revenue | A$410,995 rev / 813 purch | 101.2% — slight overcount but tolerable |
| **ProfitMetrics GP** | **A$108,460 GP** | **94.1% of CMS imputed GP — within 5.9% ✓** |

**Verdict:** ProfitMetrics GP is the **commercial-truth proxy** — reconciles to CMS within 6%. Use as the canonical "net contribution per channel" measure.

---

## The over-attribution table — locked finding

| Channel | Spend | Platform-claim Rev | GA4 last-click | ProfitMetrics Rev | ProfitMetrics GP | Platform OVER-attributes by | Real ROAS (PM rev / spend) | Profit at 25% margin? |
|---|---|---|---|---|---|---|---|---|
| **Google Ads (AW)** | A$19,105 | A$228,539 | A$203,428 | A$168,767 | **A$47,572** | 1.35× | **8.83×** | **YES** — A$28k profit |
| **Facebook + IG** | A$7,301 | A$141,569 | A$3,341 | A$2,172 | **A$595** | **65.2×** ⚠️ | **0.30×** | **NO** — A$6,706 LOSS |
| Bing | A$1,700 | A$20,802 | (lumped in PSearch) | (lumped) | (lumped) | unknown | (lumped) | likely yes |
| **All paid (FB+AW+Bing)** | A$28,107 | A$390,909 | ~A$203k+A$3k+lump | ~A$170k+A$2k+lump | ~A$48k+A$0.6k+lump | — | — | — |

---

## CHANNEL-LEVEL TRUTH per ProfitMetrics GP

| Channel | Sessions | Purchases | PM Revenue | PM GP | GP margin | % of total GP |
|---|---|---|---|---|---|---|
| **Cross-network** (Google PMax) | 9,889 | 169 | A$63,320 | A$18,792 | 29.7% | **17.3%** |
| **Paid Search** (Google + Bing) | 5,431 | 134 | A$83,583 | A$21,862 | 26.2% | **20.2%** |
| **Direct** | 10,118 | 51 | A$35,062 | A$8,768 | 25.0% | **8.1%** |
| **Organic Search** | 18,251 | 68 | A$34,749 | A$8,084 | 23.3% | **7.5%** |
| **Paid Shopping** | 3,078 | 28 | A$21,864 | A$6,917 | 31.6% | **6.4%** |
| **Referral** | 1,543 | 25 | A$12,651 | A$3,803 | 30.1% | 3.5% |
| **Organic Social** | 6,617 | 12 | A$5,775 | A$1,012 | 17.5% | 0.9% |
| **Paid Social (FB+IG)** | 1,092 | 3 | A$2,172 | A$595 | 27.4% | **0.5%** ⚠️ |
| **Organic Shopping** | 545 | 8 | A$1,162 | A$405 | 34.9% | 0.4% |
| Unassigned (server-side / bot / iOS-hidden) | 2,496 | 315 | A$150,657 | A$38,220 | 25.4% | 35.2% |

**The Unassigned bucket holds 35% of GP** — these are conversions ProfitMetrics tracks server-side that don't carry a session source. They're real revenue but unattributable. Worth investigating with PM team to see if there's a sub-classification possible. Could include checkout-completed-via-email-link, paid app traffic, etc.

---

## CRITICAL FINDINGS — locked

### 1. Facebook is unprofitable on attributable basis
- A$7,301 spend → **A$595 GP** (per ProfitMetrics) = **net loss of A$6,706 on attributable basis**.
- FB platform claims A$141,569 revenue → 19.39x ROAS. **This is 65× over-attribution.** Memory's prior 42× estimate was conservative.
- The 6 GA4 last-click purchases at A$3,341 confirm the small footprint.
- **Possibilities for actual incremental contribution above attributable:**
  - View-through halo on other channels (people who saw FB but converted via Google)
  - Brand-building effect not captured in any tracking
  - Walk-in store conversions tied to local-engagement campaigns
- These are real but **cannot be quantified with current data**. Treat FB as "spend that may or may not be earning back its cost — needs a holdout test to prove incrementality".

### 2. Google Ads is the workhorse — and honestly reported
- A$19,105 spend → A$47,572 GP (PM) = **A$28,467 net contribution after spend**.
- Real ROAS 8.83× — much closer to platform's 11.96× claim than FB's gap.
- Cross-network (PMax) + Paid Search + Paid Shopping together = **44% of total revenue, 47% of total GP**.
- Strong correlation (+0.698) with daily CMS orders confirms AW is the daily-order engine.

### 3. Organic+Direct+Referral = 19% of GP, 27% of revenue
- Non-paid channels deliver A$20,655 GP / A$82,462 revenue in 30 days.
- This is the demand floor that paid amplifies. If all paid was cut tomorrow, this is roughly what would survive (plus some recapture of paid-attributed customers who would find the brand anyway).

### 4. The 35% Unassigned bucket needs investigation
- A$38,220 GP from "Unassigned" is bigger than any single attributed channel except Paid Search.
- If this is server-side conversions (e.g., POS or completed checkouts without GA4 session), it's real revenue.
- If a chunk of it is bot or non-genuine traffic, the actual paid-attributed share is bigger relatively.
- Action: ask ProfitMetrics what populates "Unassigned"; check if it's mostly server-to-server purchase events that bypassed GA4.

### 5. Spend allocation recommendation (with confidence levels)
**HIGH confidence:**
- Cut FB spend significantly until incrementality is proven via holdout test. Best-case: FB is harvesting 65× claimed share, real contribution is 1/65 of platform claim. Even at 5x more generous (real claim 13× over-attributed), FB is still barely break-even at 25% margin.
- Maintain or grow Google Ads (especially Cross-network + Paid Search). Memory's "Apple PMax scales clean" finding aligns with this.
- Bing at A$1,700 spend / 12.2x platform ROAS is fine to maintain.

**MEDIUM confidence:**
- Don't cut FB to zero immediately. Run a 2-week budget cut on cold-prospecting (which has highest over-attribution) while keeping retargeting (lower over-attribution typically) and observe CMS daily orders. If orders hold flat, retargeting is also non-incremental.

**LOW confidence (needs more data):**
- The 35% Unassigned bucket needs root-cause before we can confidently size pure-organic vs paid-incremental contribution.

---

## What this triangulation enables that platform-only didn't

Before this triangulation, F's account-level dashboards showed:
- FB: 19.39× ROAS — looks great
- AW: 11.96× ROAS — also great
- Combined paid: ~14× ROAS

After triangulation:
- FB real contribution: 0.30× ROAS (loss)
- AW real contribution: 8.83× ROAS (genuinely profitable)
- The difference matters because it changes spend allocation by ~A$7k/month from "keep scaling FB" to "cut FB until proven incremental".

---

## Caveats
- 30-day window only. Need to repeat at 3m / 6m / 12m for stable picture (paid pulled, awaiting save).
- ProfitMetrics "Unassigned" mechanics not fully understood — see investigation request above.
- Bing is lumped with Google in GA4's "Paid Search" channel. Can't isolate Bing's last-click contribution from GA4 alone — would need source/medium drill (`google / cpc` vs `bing / cpc`).
- Refunds: this analysis uses gross revenue; subtract ~5.7% for net.
- Store data is fully separate (no daily channel attribution available for in-store) — store contributes A$2.38M / 14m independent of any of these channels.
- One-time spike days (Easter Sale Apr 4, etc.) can distort 30d window — repeat with 90d window for trend confirmation.

## Next analysis priorities
1. Same triangulation at 3m / 6m / 12m windows (need paid 6m+12m on disk first).
2. ProfitMetrics "Unassigned" investigation — server-side / bot / iOS / cross-domain?
3. Search Console query-level pull to validate "lost organic rankings" hypothesis (already flagged).
4. Cohort retention curves — repeat customer rate by acquisition channel.
5. Store-data attribution — link FB local-engagement / GMB phone+directions to store walk-ins.
