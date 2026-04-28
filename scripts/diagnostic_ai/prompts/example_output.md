# Phonebot weekly memo — week ending 2026-04-28

## What broke

**1. Google Ads ROAS dropped from 1.85x → 1.27x (z=-2.4, 5 of 7 days below 28-day mean).**
Coincides with a 22% spend increase on iPad PMax (now $185/day vs. $151 baseline). Likely cause: bidding past saturation point — extra spend is buying lower-intent clicks. The MMM scaffold's saturation curve will confirm once you run it. Action this week: cap iPad PMax daily budget at $160 and watch CVR for 5 days.

**2. iPhone Like New Grade A revenue down 31% MoM ($18.4k → $12.7k).**
Refund rate on this segment held flat at 4.1%, so it's not quality. GMC inventory shows iPhone Like New Grade A in-stock dropped from 47 SKUs to 22 over the same window. This is a supply problem, not a demand problem.

**3. 12 SKUs flagged as ad-loss-making in last 7 days that weren't flagged in prior 7 days.**
All Samsung A-series. Margin estimate is 8.4% (low) and average CPC has crept to $0.91 (up from $0.62). Likely auction-pressure issue from a competitor; investigate via auction insights report.

## Where money is leaking right now

Estimated 30-day waste from the headline analysis is $4,800. Composition:
- Branded cannibalization: ~$2,500/mo (assuming 80% recovery; validate with a VIC vs. NSW holdout test)
- Out-of-stock feed-lag waste: ~$900/mo (Xiaomi at 18% in-stock and $340 spend; Huawei at 12% in-stock and $220 spend)
- Negative-margin SKUs: ~$1,400/mo (top offenders listed in dashboard)

Single highest-value action: **pause the top 5 negative-margin SKUs**. Monthly savings ~$900, fully reversible if velocity drops.

## Opportunities

**1. Bing scale-up.**
Bing ROAS is 3.5x at $57/day spend; Google's blended ROAS is 1.4x at $926/day. Increase Bing daily budget to $120 over 3 weeks (don't double immediately). Estimated upside: +$5k GP/mo at 3.0x assumed compressed ROAS. Risk: Bing's inventory at this scale is likely thin in AU, ROAS will probably compress to 2.0–2.5x as you scale.

**2. Email accessory cross-sell triggers.**
Brevo shows last campaign hit 26.3% open rate, 4.1% CTR — strong list. Set up a 30-day post-purchase trigger that emails phone buyers a curated accessory bundle. Estimated upside: 8–12% attach rate at $35 AOV = $1,800–$2,500/mo GP. Build effort: ~2 hours in Brevo automation. Risk: low; this is well-trodden retail playbook.

**3. PMax Apple iPad — diminishing returns.**
Conversely to opp #1: this campaign is showing classic over-spend signals (ROAS falling as spend rises, CVR holding). Cap budget back to $150/day. Estimated saving: $1,000/mo at zero net revenue loss. Risk: if you stop the experiment too early you don't learn the saturation point — keep $150/day for at least 2 weeks before deciding.

## One thing for this week

**Run the branded-cannibalization holdout.** Pause the "CJ - Phonebot (B)" campaign in NSW only (state-level geo targeting). Leave it on in VIC. Track total Phonebot revenue (paid + organic) by state daily for 14 days. If NSW revenue drops by less than the recovered branded paid spend, you've just confirmed $30k+/year of recoverable waste, and have the geo-test evidence to convince yourself to act.

This is the single highest-leverage action available because it produces a real causal answer to a $30k/year question, in 14 days, at zero downside (you can always turn it back on).
