---
name: GA4 click-ID retention is by-design, not a bug
description: The "62% fbclid bug on purchase events" memory was a misdiagnosis. GA4 BQ exports only put click IDs on session_start/first_visit events, not subsequent events. Use vw_sessions for attribution, not per-event lookups.
type: project
originSessionId: dcf42b3e-4b2e-407e-ac06-05057d0469bd
---
Investigated 2026-04-29 against fresh GA4 BQ export. Out of 25 purchase sessions on 2026-04-28:

- 0/25 purchase events carried gclid in event_params or page URL
- 0/25 purchase events carried fbclid in event_params or page URL
- BUT 11/25 sessions had gclid at session_start
- AND 1/25 sessions had fbclid at session_start

**Why:** Click IDs (gclid/fbclid/msclkid) are only written by GA4 to the session_start and first_visit events — when the URL contains them on first hit. They do NOT propagate to subsequent events in the same session, including purchase. This is GA4's documented behaviour, not a Phonebot tagging issue. The earlier "62% fbclid bug" memory note was technically true (purchase events do lack fbclid in the literal sense) but misdiagnosed the architecture.

**How to apply:**
- Never read click IDs off purchase events — use the session-level rollup (`vw_sessions` view) which propagates session_start click IDs to the session row
- For order-level channel attribution: join CMS `transaction_id` to `vw_sessions.transaction_ids` array, then read `gclid/fbclid/msclkid/source/medium/channel` off the session row
- The view file is `dashboard_connection/bq_sessions_view.sql`; the events-level companion is `dashboard_connection/bq_events_flat_view.sql`
- Do NOT pursue "fix the fbclid bug" as an action item. Pat's V86 ProfitMetrics deploy is unrelated to this since GA4's own architecture is what causes the empty fbclid on purchase events
- DO pursue: counting how many sessions land with click IDs vs without (sample 2026-04-28 shows ~44% gclid, ~4% fbclid — those are the *real* attribution rates, not 38% as the "62% bug" framing implied)
