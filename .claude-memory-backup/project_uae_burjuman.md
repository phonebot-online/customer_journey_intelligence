---
name: Phonebot operates a profitable Dubai mall store at Burjuman Centre (UAE)
description: UAE retail is a live operational channel for Phonebot — profitable Burjuman Centre mall store in Dubai with active Meta walk-in campaign and an open attribution problem that's the focus of an active optimization experiment as of May 2026
type: project
---
Phonebot operates a **profitable mall retail store at Burjuman Centre, Dubai (UAE)**. This is an existing, operational retail location.

**Why this matters:**
- Do not frame UAE as a "side bet," "future expansion," or "hypothetical second engine." It is a live channel running today.
- UK still has its own structural advantage (forces UK auctioneer renegotiation) — that argument stands without dismissing UAE.

**Active Meta campaign (May 2026 baseline):**
- Campaign name: `UAE - Burjuman Store - Walk-in Traffic`
- Lives on the AU master Meta ad account `act_14359173` (FA in Supermetrics) — same account as all AU Meta data.
- Objective: `OUTCOME_LEADS` with Messenger as the destination (named "walk-in traffic" but technically optimized for Messenger contacts, not store visits).
- Started: 2026-02-07.
- Geo: Dubai (~86% spend) + Emirate of Sharjah (~14% spend). No other emirates targeted.

**Last 30 days (Apr 1–30, 2026) baseline — currency assumed AUD per AU master account:**
- Spend: A$599 (~A$20/day)
- Impressions 267k, reach 87k, frequency 3.09 (saturating; daily reach declined 9,600 → 5,700 across the month)
- Clicks 8,942, CTR 3.35%, CPC A$0.067
- Link clicks 3,378, link CTR 1.26%, CPLC A$0.18
- Landing page views: 1
- Phone number clicks: 0. Get directions clicks: 0. (Those CTAs aren't on the ad creative.)
- Messenger first replies: 1,443 (~48/day). Conversations started in 7d: 1,550. **Conversations replied within 7d: only 2.** Either Meta is counting auto-greetings as "first reply" or quality is broken — investigate.
- Demographics: 71% spend on M25-44. Female 25-54 has ~2× the CTR (6.06%-6.33% vs 2.81% for M25-34) but receives only ~17% of spend.
- Placement breakdown: FB Feed = ~84% of spend, IG Feed = ~10%, Reels = ~3.3%, FB Search results = 1.6%, FB Marketplace = 1.0%. Search and Marketplace are starved.

**The actual problem (named by user 2026-05-02):** the campaign exists in a measurement vacuum. 50-100 chats/day generated but no closing-the-loop between FB ads → Messenger chat → in-store walk-in conversion. Store staff cannot currently attribute walk-ins to FB. Open question: are these high-intent buyers or "not-in-market" price-curious tire-kickers?

**Active optimization experiment (kicked off 2026-05-02):**

Two-part test:

1. **Promo-code attribution (the real fix).** Print a unique code on the ad creative + chat auto-reply (e.g. `FB50` = AED 50 off in-store). Train counter staff to log redemptions in a sheet (date / code / item / AOV). This is the lowest-tech but truthful attribution mechanism — bypasses Meta Pixel/Store Traffic/offline conversions entirely. Treat redemptions as a lower bound on attributable walk-ins; double it for a rough ceiling. Caveats: discount must be small enough to preserve store GP; some buyers won't show the code; need 14+ days of data.

2. **Placement test — Search-only ad set.** Duplicate the ad set, narrow placements to **Facebook search results only** (Marketplace requires Feed bundled for Lead/Messenger objectives — see `feedback_meta_placement_coupling.md`). Use a different promo code on this ad set (e.g. `MARKET50`) so redemptions are attributable per-placement-strategy. Original ad set lowered to A$10/day, new ad set at A$10/day. Run for 14 days.

**Decision rule after 14 days:**
- If `MARKET50` redemptions × store GP outperforms `FB50` per dollar spent → kill the original Feed-broadcast ad set, scale Search/high-intent.
- If `FB50` (current Feed-dominated) wins → revert and explore a different angle (creative refresh, audience splits) rather than narrower placements.
- If neither produces meaningful redemptions → channel is dead, stop spending until a different mechanism is found.

**What NOT to do (decided 2026-05-02):**
- Don't add "Get Directions" or "Call Now" CTAs as the optimization signal. They're Goodhart's-Law proxies — Meta would optimize toward the proxy click, not toward actual walk-ins. Real buyers Google-Map the address or ask the chat agent.
- Don't invest time in Meta Store Traffic objective or offline conversions upload until the promo-code attribution validates that the channel produces walk-ins at all.
- Don't scale spend (currently ~A$20/day) until the 14-day data lands.

**Creative requirement for Marketplace/Search placements:** square (1:1) listing-style images with single product + AED price + "At Burjuman Centre, Dubai" subtitle. Marketplace audiences scan past brand banners. Without listing-style creative the placement test will under-perform for non-placement reasons.

**How to apply:**
- When user asks about the UAE Burjuman campaign, this baseline + experiment plan is the reference.
- Any walk-in attribution question across Phonebot retail should default to the promo-code mechanism — it's the cheapest truth available.
- When discussing Phonebot strategic positioning, treat UAE as existing-revenue, not frontier expansion. UK is its own argument.
- Push back on speculative claims about UAE market size or refurb-receptiveness — verify first.
