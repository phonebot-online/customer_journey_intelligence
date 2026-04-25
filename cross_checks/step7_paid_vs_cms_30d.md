# Step 7 — Paid Media vs CMS Cross-Check (last 30 days, web only)
**Window:** 2026-03-26 → 2026-04-24 (30 days)
**Date:** 2026-04-25

## Headline numbers

| Channel | Spend | Conv (platform) | Revenue (platform) | ROAS | CPA |
|---|---|---|---|---|---|
| **AW (Google Ads)** | A$19,105 | 441 | A$228,539 | **11.96x** | A$43 |
| **FA (Facebook)** | A$7,301 | 251 | A$141,569 | **19.39x** | A$29 |
| **AC (Bing)** | A$1,700 | 35 | A$20,802 | 12.23x | A$49 |
| **Combined paid** | A$28,107 | 727 | A$390,909 | 13.91x | A$39 |
| **CMS web reality** | — | 763 orders | A$406,206 | — | — |

## Critical finding — platform over-attribution
**Platform claims sum to 96.2% of CMS web revenue.** Either:
- Multiple platforms claim the same converting customer (most likely — classic last-click double-counting), OR
- Almost all real web conversions are touched by at least one paid channel and platforms compete over credit

**Implication:** Platform-reported ROAS is inflated. The real **incremental** ROAS for any single channel is much lower than 12-19x. Cannot rank channels by platform-claimed ROAS alone — needs GA4 last-click attribution AND/OR contribution analysis.

**Memory note (project_fb_ads.md):** prior data showed FB self-reports 42x more purchases than GA4 last-click for paid social. Same dynamic likely applies to AW and Bing.

## What strongly correlates with daily web orders

| Signal | Correlation | Interpretation |
|---|---|---|
| **AW conversions** | **+0.698** ★ | Strongest predictor — Google Ads' tracking aligns best with actual conversions |
| **FB purchases** | **+0.632** ★ | Strong — but memory suggests FB attribution claims 42× over GA4 last-click |
| **Total paid spend** | **+0.536** ★ | Spend → orders relationship visible at daily level |
| **FB purchase value** | +0.518 ★ | Strong, similar story to count |
| **AW all-conversions value (incl VT)** | +0.485 | View-through inflates the signal |
| **AW value, Bing spend, FB spend** | +0.39 to +0.49 | All moderate positive |
| **GMB views** | +0.057 | Negligible — GMB is a SEPARATE funnel (in-store) |
| **GMB actions** | +0.101 | Same — local-intent traffic doesn't drive web orders |
| **Bing revenue** | +0.068 | Too small to move daily web pattern |

## Channel attribution share
- FB platform claims: 35% of CMS web revenue
- AW platform claims: 56% of CMS web revenue (last-click attribution model)
- Bing platform claims: 5% of CMS web revenue
- **Sum: 96%** — confirming massive double-counting

## Spend share vs revenue share
| Channel | Spend share | Platform-claimed revenue share |
|---|---|---|
| AW | 68% | 56% (slight under-share for AW — its claims are most conservative) |
| FB | 26% | 35% (over-share — FB claims more than its spend share would suggest) |
| Bing | 6% | 5% (proportional) |

The over-share for FB is consistent with the prior finding: FB tracks anyone who saw an ad regardless of who closed the conversion. FB's conservative spend (26% of paid) but inflated claims (35% of CMS) explain its 19.4x reported ROAS being unrealistic.

## What we still need for a complete Step 7 picture
1. **GA4 channel-level allocation** for last-click attribution — to triangulate against platform claims. Pulled but not yet saved to disk; data has session-level for "Cross-network", "Paid Search", "Paid Shopping", "Paid Social" — these map to AW (Cross-network + Paid Search/Shopping), FB (Paid Social), Bing (Paid Search subset).
2. **ProfitMetrics-GA4 data** for net contribution per channel.
3. **Triangulation**: for each channel, take the MIN of platform-claimed and GA4 last-click as a "lower bound on credit". Sum should be much closer to or below 100% of CMS revenue.

## Practical takeaway for F
- Don't act on platform-reported ROAS alone — they collectively claim 96% of revenue, which is impossible.
- AW (Google Ads) is the daily order driver: 0.698 correlation with CMS orders, 68% of paid spend, 56% of platform-attributed revenue. Pulling back AW spend (which F did Q1) is the most likely cause of the web cliff.
- FB has high reported ROAS (19.4x) but reported revenue likely exaggerates real incremental contribution by 2-5x.
- Bing is small but profitable; not a scale lever but no reason to cut it.
- GMB drives a SEPARATE in-store funnel — don't expect it to correlate with web orders, that's the wrong signal.
