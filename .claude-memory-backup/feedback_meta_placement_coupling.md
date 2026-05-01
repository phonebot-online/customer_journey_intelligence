---
name: Meta couples Facebook Marketplace placement with Facebook Feed for Lead/Messenger campaigns
description: For OUTCOME_LEADS campaigns with Messenger destination, Meta Ads Manager forces Facebook Feed to be selected if Facebook Marketplace is selected — they cannot run standalone. Plan placement-only tests around this.
type: feedback
---
For Meta campaigns using `OUTCOME_LEADS` objective with Messenger as the destination, **Facebook Marketplace placement cannot be selected without also selecting Facebook Feed.** Meta couples them in the placement editor — unchecking Feed will also force-uncheck Marketplace.

**Why:** Marketplace inventory is limited and Meta bundles delivery for Lead-objective campaigns to ensure ads have enough inventory to serve. The constraint is objective-dependent and may not apply to every campaign type (Sales/Catalog ads have different placement rules).

**How to apply:**
- When designing a "Marketplace-only" or high-intent placement test on a Lead/Messenger campaign, anticipate this constraint upfront. Don't promise the user a Marketplace-standalone setup that the platform won't allow.
- Workarounds, in order of practicality:
  1. **Search-only.** Drop Marketplace, run with `Facebook search results` placement only. Clean isolation, no Feed contamination, lower volume. Best for a clean attribution test.
  2. **Cost-cap bidding on Feed+Marketplace combo.** Keep both placements, but set "Cost per result goal" tight to push the algorithm toward cheaper inventory (often Marketplace). Imperfect isolation.
  3. **Catalog Ads (architecturally correct).** Build a product catalog in Meta Commerce Manager, switch the campaign to Sales objective with Advantage+ Catalog Ads. Catalog ads have different placement rules and can run Marketplace standalone. Trade-off: 1-2 days of catalog setup work.
- Don't waste time looking for "Marketplace search results" as a separate placement option — Meta consolidated it. The "Facebook Marketplace" placement covers both browsing AND searching within Marketplace.
- "Get Directions" / "Call Now" CTAs are tempting as walk-in proxies but are Goodhart's-Law bait — Meta would optimize toward the proxy click, not toward actual walk-ins. For walk-in attribution, prefer a unique promo code printed on the creative + redemption logging at the store till.
