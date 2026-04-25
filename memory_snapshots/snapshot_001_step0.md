# Memory snapshot — after Step 0 discovery
**Timestamp:** 2026-04-25 ~10:35 UTC
**Where in lockstep:** Step 0 complete pending user answers; Step 1 storage structure built; Step 2 not started.

## Confirmed material facts

- Supermetrics product: DEMO_CLAUDE, license expires 2026-05-09 (13 days from analysis date) — flag for time-pressure on async pulls.
- Authenticated sources for Phonebot: `FA`, `AW`, `GAWA`, `GW`, `SIB`, `AC`, `GMB`, plus `IGI`/`FB` Insights with no accounts.
- Phonebot account anchors:
  - FA primary: `act_14359173`. Exclude `act_1141970792623135` (personal).
  - AW primary: `3900249467`.
  - GA4 primary AU: `284223207`. AE has two properties; resolve before pulling.
  - GA4 ProfitMetrics: `488590631` (revenue), `488618020` (gross profit).
  - GW: AU URL property + AE domain property + **UK domain property** (newly discovered).
  - Bing/AC: `180388397` — newly discovered, not in user's stated list.
- CMS data: spec exists, **no actual data attached**.

## Carry-forward rules from prior memory (verified still relevant)
- AUD currency, Australia/Perth tz, AOV ~A$564.
- Margin band 25–28% blended; CPA ceiling A$80 green / A$100 caution / A$140 absolute breakeven.
- FB self-attribution is 42x GA4 last-click — treat platform conversions as platform-reported only.
- Strip seasonal months (BFCM/EOFY/Jan) before any "scale to X CPA" claim.
- On Google Ads automated bidding, keyword max CPC fields are inactive metadata — don't interpret.
- Apple PMax scales clean; Samsung/Accessories/Google PMax tROAS targets currently above achievable.
- Brevo via SIB is sends/engagement only, history from 2025-10-27.

## Open questions blocking Step 7
1. CMS data delivery path
2. GA4 AE property canonical (434168263 vs 433775991)
3. FB personal account exclusion confirmation
4. UK store in/out of scope
5. Bing + GMB scope confirmation

## Anomalies/conflicts noted at Step 0 (none material yet, just flags)
- User listed "Instagram Ads" as separate connector — corrected to placement-level FA.
- User listed "Search Console" with no ID; correct is `GW`, not `SC` (Snapchat).
- Two AE GA4 properties — duplicate suspected.
- Bing + GMB exist and are connected but were absent from user's stated list — discovery items, not gaps.
