---
name: Unassigned channel dominates ProfitMetrics revenue
description: 30d 2026-04-30 PM data shows Unassigned = 290 transactions / $134k revenue, the largest single channel by both metrics
type: project
originSessionId: 8871e6a3-e034-4bc7-bb64-b9fd0411c2de
---
Refreshed Supermetrics pull 2026-04-30 (window: last_30_days) shows ProfitMetrics-attributed revenue heavily dominated by the **Unassigned** channel:

| Channel | Sessions | Transactions | Revenue (AUD) | GP (AUD) |
|---|---|---|---|---|
| **Unassigned** | 2,896 | **290** | **$134,819** | **$35,142** |
| Paid Search | 5,862 | 143 | $89,072 | $21,027 |
| Cross-network | 10,423 | 160 | $58,612 | $18,005 |
| Direct | 11,528 | 52 | $36,527 | $8,278 |
| Organic Search | 21,009 | 62 | $31,179 | $7,070 |
| Paid Shopping | 2,853 | 28 | $24,402 | $7,546 |

By contrast, vanilla GA4 (account 284223207) shows Unassigned at only 13 transactions / $8,204 — so PM is recovering ~277 transactions GA4 attributes to "lost". That's roughly 40% of monthly web orders that GA4 alone can't pin to a source.

**Why:** This is the headline story behind Pat's ProfitMetrics V2 tag deployment (GTM v86, 2026-04-29). The whole premise of PM is recovering lost attribution. The 30d window straddles the V2 deploy date, so the next 14d will tell if Unassigned grows further (V2 is recovering even more) or shrinks (V2 is reattributing to known channels).

**How to apply:** Don't write copy that treats Unassigned as a problem to fix — it's the value PM delivers. Instead frame future analysis as "of $134k Unassigned revenue, what fraction is downstream of which paid touchpoint" — that's the question Pat's V2 tag should answer over the next 14 days. Watch the day-over-day Unassigned share via the Channel Attribution BQ panel + the PM revenue CSV. If Unassigned share *drops* materially after 2026-05-13, V2 is successfully reattributing.
