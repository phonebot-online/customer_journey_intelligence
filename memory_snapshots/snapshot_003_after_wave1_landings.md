# Memory snapshot — after Wave 1 + partial Wave 2 landings
**Timestamp:** 2026-04-25 ~11:00 UTC
**Where in lockstep:** Step 2 ~70% done. Step 3 (QA) starts after all Wave 1 + Wave 2 land.

## Headline numbers (last 30 days, platform-reported)

| Channel | Spend | Conv (platform) | Revenue (platform) | ROAS | CPA |
|---|---|---|---|---|---|
| **Google Ads (AW, act 3900249467)** | (~A$60-90/day per major campaign × 17 active campaigns; full daily landed, save pending) | per campaign | per campaign | per campaign | per campaign |
| **Bing (AC, 180388397)** | A$1,700 | 35 | A$20,802 | 12.23x | A$48.58 |
| **Facebook (FA, act_14359173)** | ~A$7,650 (computed from placement totals) | 226 | ~A$126k | ~16.5x | ~A$34 |
| **Brevo email** | (no spend tracked) | 26.7% open / 1.77% click on 26,225 sends | n/a | n/a | n/a |

## CRITICAL findings from Step 2

### FB account confirmation
- `act_14359173` IS the live Phonebot account. Memory was correct.
- Campaign names match memory exactly: "Cold | TOF | 2 ad sets | DPA+Vids+image | Must creatives", "Retargeting new cost cap $45" (note: cost cap moved A$23 → A$45 since memory was last updated), "UAE - Burjuman Store - Walk-in Traffic", "whatsapp buyback", "Engagement store +10km radius".
- Memory stated cost cap was A$23 — campaign name now says **A$45**. Update needed.
- `act_1141970792623135` (Fahad Zafar) — still pending verification. Could be a duplicate, a personal account, or a separate UAE-only account.

### FB placement breakdown (30d, act_14359173) — 56 placements observed
- **Spend concentration:**
  - Facebook Feed (3 campaigns) = A$4,039 = 53% of spend
  - Facebook Search = A$933 = 12%
  - Facebook Marketplace = A$571 = 7%
  - Facebook Reels Overlay = A$213 = 3%
  - Instagram Feed = A$407 = 5%
  - Instagram Stories = A$202 = 3%
  - Instagram Reels = A$249 = 3%
- **Top ROAS placements (>A$50 spend):**
  - facebook/facebook_stories × Retargeting new cost cap $45: **A$25 spend → A$5,728 value → 228x ROAS, 6 purchases** (TINY footprint, but if scalable…)
  - facebook/facebook_reels_overlay × Retargeting: A$35 → A$5,641 → 163x ROAS
  - facebook/instream_video × Retargeting: A$27 → A$5,682 → 211x ROAS
  - facebook/feed × Retargeting: A$2,546 → A$50,202 → 19.7x ROAS — the volume workhorse
  - facebook/feed × Cold: A$969 → A$12,369 → 12.8x ROAS
- **Underperforming high-spend placements:**
  - facebook/feed × UAE Burjuman: A$524 spend → 0 purchases (lead-gen funnel — measured wrong, expected)
  - facebook/feed × whatsapp buyback: A$65 spend → 0 purchases (also lead-gen)
  - facebook/marketplace × Cold: A$234 → 8 purchases → 19.7x ROAS (decent)

### GA4 channel-level (30d, AU-filtered)
Memory's "FB self-attribution is 42x GA4 last-click" looks set to be reconfirmed. Will verify once fully on disk. Today's data shows Paid Social = 25-65 sessions/day with ~0-2 purchases — consistent.

### Search Console position degradation (3-month view)
Looking at 90-day branded vs non-branded data: non-branded position has crept from ~12 (Jan) → ~15 (Apr 21-22) → recovered to ~10 by Apr 23. Volatile. Need to investigate any visibility losses correlating with PMax shifts.

### ProfitMetrics-GA4 vs GA4-main divergence
- ProfitMetrics Revenue property `488590631` shows different revenue numbers than the main AU GA4 (`284223207`).
- ProfitMetrics Gross Profit property `488618020` shows ~25-30% of revenue values — confirming it's GP only.
- Need formal reconciliation (Step 7).

## Open items
- Personal/secondary FB account `act_1141970792623135` data still being polled
- AW Google Ads campaign 1m: 487 rows in context, save pending
- AW Google Ads 3m: 10k row pull pending
- All 6m / 12m queries paused per user direction (waiting for older CMS attachment)

## Lockstep position
Step 0 ✓ Step 1 ✓ Step 2 ~70% Step 3 not started.
