import { router, publicProcedure } from '../middleware';
import { runQuery } from '../lib/duckdb';
import { CHANNEL_CURVES } from '../lib/scenarios';

// Marginal ROAS for log-linear curve gpPerDollar = a - b*ln(s).
// d/ds [s * (a - b*ln(s))] = (a - b) - b*ln(s)
function marginalROAS(a: number, b: number, spend: number): number {
  if (spend <= 0) return 0;
  return Math.max(0, (a - b) - b * Math.log(spend));
}

// Inverse: at what spend does marginal ROAS = target?
function spendAtMarginal(a: number, b: number, target: number): number {
  // (a - b) - b*ln(s) = target  →  s = exp((a - b - target) / b)
  return Math.exp((a - b - target) / b);
}

// Inverse: at what spend does avg ROAS = target?
function spendAtAvg(a: number, b: number, target: number): number {
  // a - b*ln(s) = target  →  s = exp((a - target) / b)
  return Math.exp((a - target) / b);
}

export const actionsRouter = router({
  // 1. Priority list — opinionated P0/P1/P2/P3 derived from current state
  priorityList: publicProcedure.query(async () => {
    return [
      {
        priority: 'P0' as const,
        title: 'Apply Phase 1 of AW reallocation (zero-risk pauses)',
        why: '4 broken Google Ads campaigns burning A$568/30d with 0 ProfitMetrics purchases. Pure waste.',
        action: 'Pause: Standard Shopping iPhone 17, PMax iPhone 17, CJ-DSA (All Pages), Bing Standard Shopping (Apple) iPads. Manual click in Google Ads + Bing Ads UI.',
        eta: 'Today (15 min)',
        impact: '+A$568/mo locked, no opportunity cost',
        risk: 'Zero (these campaigns produced 0 PM purchases in 30d)',
        evidence: 'cross_checks/campaign_triangulation_30d.csv',
      },
      {
        priority: 'P0' as const,
        title: 'Run FB Cold incrementality holdout',
        why: 'FB shows 0.08-0.10× real GP/$ across all 4 windows (1m/3m/6m/12m). -A$133k/yr stable underperformance. Holdout is the only way to know if FB has hidden upper-funnel value.',
        action: 'Pause Cold|TOF campaign in Meta Ads Manager. Enter date on /holdout page. Wait 14 days. Decision auto-fires.',
        eta: '14 days from start (start anytime in next 7 days)',
        impact: 'If non-incremental: +A$3-4k/mo locked. Information value high regardless.',
        risk: 'A$1,246 of foregone Cold spend over 14 days',
        evidence: 'cross_checks/step10_FB_incrementality_holdout_protocol.md',
      },
      {
        priority: 'P1' as const,
        title: 'Apply Phase 2 of AW reallocation (trim marginals)',
        why: '5 marginal-efficiency campaigns (1.0-1.2× real ROAS) consuming A$5,012/30d for ~A$555 net. Better deployed elsewhere.',
        action: 'Cut to 50% in Google Ads UI: SS All Products >$1000, PMax (Apple) non-iPad, PMax Apple Watches, CJ Phonebot (B) Lower ROAS. Pause CJ PMax (Everything Else).',
        eta: 'Day 2 of (c) plan, after Phase 1 stabilises 24h',
        impact: '+A$2,894/mo from cuts',
        risk: 'Low — these were already barely profitable',
        evidence: 'Reallocation table from previous turn',
      },
      {
        priority: 'P1' as const,
        title: 'Apply Phase 3 of AW reallocation (scale Bing + PMax Samsung)',
        why: 'Bing campaigns at 5-13× real ROAS. PMax Samsung at 1.99× has clear headroom.',
        action: 'Edit daily budgets in Google Ads + Bing Ads: PMax Samsung A$95→A$125, Bing Shopping A$26→A$60, Bing Refurbished Phones A$25→A$50, Bing Phonebot brand A$4→A$10, etc.',
        eta: 'Day 3 of (c) plan',
        impact: '+A$3,605/mo from scaling',
        risk: 'Bing brand may saturate (query-volume capped). PMax Samsung marginal ROAS estimate ±30%.',
        evidence: 'Reallocation table — Phase 3',
      },
      {
        priority: 'P1' as const,
        title: 'Fix Brevo email link UTMs',
        why: 'Email contribution is invisible. Brevo has 24-26% open rate, 1.77% click rate, 26k recipients/30d — but no $ attribution flows to GA4 or CMS. Concurrency lift shows email-send days correlate +13.6% in CMS revenue.',
        action: 'In Brevo: enable auto-UTM tagging on all outbound links. Set source=brevo, medium=email, campaign={campaign_name}.',
        eta: 'This week (30 min in Brevo settings)',
        impact: 'Unlocks measurement of A$XXk/mo email-driven revenue. Number unknown until measured.',
        risk: 'Zero',
        evidence: 'Concurrency lift panel: Brevo send-day → CMS revenue +13.6%',
      },
      {
        priority: 'P2' as const,
        title: 'Investigate ProfitMetrics Unassigned bucket',
        why: '35% of attributable GP (A$38k/mo) sits in "Unassigned". Could be server-side conversions, completed-via-email-link, or app traffic — composition unknown.',
        action: 'Email ProfitMetrics support: ask what populates the "Unassigned" channel in their Revenue + GP properties. Specifically whether checkout-completed-via-email or buyback flows feed it.',
        eta: 'This week (1 email)',
        impact: 'Could shift channel attribution shares by ±10%',
        risk: 'Zero',
        evidence: 'cross_checks/step7_LOCKED_triangulation_30d.md',
      },
      {
        priority: 'P2' as const,
        title: 'Restore MacBook + AirPods inventory',
        why: 'MacBook went from A$20k/mo → A$2k/mo (-88%). AirPods, Xiaomi, Huawei went to zero. Total at-risk: A$28k/mo gross. Demand exists; supply is the constraint.',
        action: 'Procurement-side: identify why these SKUs are unavailable (supplier issue, deliberate de-prioritisation, buyback gap?). Fix supply pipeline.',
        eta: '2-4 weeks (procurement cycle)',
        impact: '+A$5-15k/mo gross at full restoration (best case)',
        risk: 'Working capital tied up in inventory if demand has shifted',
        evidence: 'cross_checks/step8_LOCKED_product_cliff_diagnosis.md',
      },
      {
        priority: 'P2' as const,
        title: 'Validate fbclid fix landed (deploy 2026-04-29)',
        why: 'Developer deployed fbclid persistence fix on 2026-04-29. GA4 BQ session-rollup (vw_sessions) now correctly attributes click IDs at session_start; previous "62% fbclid bug" framing was a misdiagnosis (GA4 design puts click IDs on session_start, not on every event). Need 7-14 days of post-fix data to confirm fbclid retention rate vs FB paid traffic share.',
        action: 'Run weekly: SELECT channel, COUNT(*) sessions, COUNTIF(converted) purchases, SUM(purchase_revenue) rev FROM analytics_284223207.vw_sessions WHERE session_date >= "2026-04-29" GROUP BY channel. Watch Paid Social row trend up.',
        eta: '14 days observation (started 2026-04-29)',
        impact: 'Validates measurement; unblocks aggressive FB scaling once trend confirmed',
        risk: 'Zero (observation only)',
        evidence: 'dashboard_connection/bq_sessions_view.sql + memory/project_ga4_attribution.md',
      },
      {
        priority: 'P3' as const,
        title: 'iPhone Like New pricing audit',
        why: 'Only segment with real competitive price pressure (AOV -15% on flat volume). Reebelo entry visible in GW data at 19 clicks/24d.',
        action: 'Spot-check 5 top iPhone Like New SKUs vs Reebelo + Mobileciti. If Phonebot is 5-10% above market, match.',
        eta: '30 minutes',
        impact: '+A$1-2k/mo if needed; zero if already at market',
        risk: 'Margin loss if cuts apply broadly',
        evidence: 'cross_checks/step8_LOCKED_product_cliff_diagnosis.md',
      },
      {
        priority: 'P3' as const,
        title: 'Test 1 new acquisition platform (Q3 2026)',
        why: 'Current 3-channel core (Google + FB + Bing) is mature. Diversifying lowers single-platform risk.',
        action: 'See Test Queue panel for ranked candidates (TikTok Ads, YouTube Demand Gen, Reddit Ads).',
        eta: 'Quarterly cadence — start one in Q3 2026',
        impact: 'Speculative — depends on platform fit',
        risk: 'Variable — start small (A$30/day budget)',
        evidence: 'Industry knowledge, not Phonebot-specific data',
      },
    ];
  }),

  // 2. Spend pulse — yesterday + last-7-day per channel, with conversion-lag visualisation
  spendPulse: publicProcedure.query(async () => {
    // Get last 14 days of spend + CMS orders, aligned by date
    const series = await runQuery<{
      date: string;
      awSpend: number;
      fbSpend: number;
      bingSpend: number;
      totalSpend: number;
      cmsOrders: number;
      cmsRevenue: number;
      cmsGp: number;
    }>(`
      WITH dates AS (
        SELECT date FROM (
          SELECT DISTINCT date FROM fact_google_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '21 days'
          UNION SELECT DISTINCT date FROM fact_facebook_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '21 days'
          UNION SELECT DISTINCT DATE(order_date) as date FROM fact_web_orders WHERE order_date >= CURRENT_DATE - INTERVAL '21 days'
        )
      ),
      aw AS (SELECT date, SUM(cost)::DOUBLE as spend FROM fact_google_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '21 days' GROUP BY date),
      fb AS (SELECT date, SUM(cost)::DOUBLE as spend FROM fact_facebook_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '21 days' GROUP BY date),
      bing AS (SELECT date, SUM(cost)::DOUBLE as spend FROM fact_bing_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '21 days' GROUP BY date),
      cms AS (
        SELECT DATE(order_date) as date,
               COUNT(*)::INTEGER as orders,
               SUM(total)::DOUBLE as revenue,
               SUM(gp_imputed)::DOUBLE as gp
        FROM fact_web_orders WHERE order_date >= CURRENT_DATE - INTERVAL '21 days' GROUP BY date
      )
      SELECT
        d.date,
        COALESCE(aw.spend, 0) as awSpend,
        COALESCE(fb.spend, 0) as fbSpend,
        COALESCE(bing.spend, 0) as bingSpend,
        COALESCE(aw.spend, 0) + COALESCE(fb.spend, 0) + COALESCE(bing.spend, 0) as totalSpend,
        COALESCE(cms.orders, 0) as cmsOrders,
        COALESCE(cms.revenue, 0) as cmsRevenue,
        COALESCE(cms.gp, 0) as cmsGp
      FROM dates d
      LEFT JOIN aw ON d.date = aw.date
      LEFT JOIN fb ON d.date = fb.date
      LEFT JOIN bing ON d.date = bing.date
      LEFT JOIN cms ON d.date = cms.date
      ORDER BY d.date DESC
      LIMIT 21
    `);

    // Sort ascending for chart
    const sorted = [...series].reverse();

    // Maturation calc: use days 4-14 ago to compute avg conversions/$ (mature window)
    const matureDays = sorted.slice(-14, -3);
    const matureSpend = matureDays.reduce((s, d) => s + d.totalSpend, 0);
    const matureOrders = matureDays.reduce((s, d) => s + d.cmsOrders, 0);
    const matureRev = matureDays.reduce((s, d) => s + d.cmsRevenue, 0);
    const ordersPerDollar = matureSpend > 0 ? matureOrders / matureSpend : 0;
    const revPerDollar = matureSpend > 0 ? matureRev / matureSpend : 0;

    // For the 3 most-recent days, compute "expected at full maturation" vs "actual so far"
    const lastDays = sorted.slice(-3);
    const recentMaturity = lastDays.map(d => ({
      ...d,
      expectedOrders: d.totalSpend * ordersPerDollar,
      expectedRevenue: d.totalSpend * revPerDollar,
      maturityPct: (d.totalSpend * ordersPerDollar) > 0 ? d.cmsOrders / (d.totalSpend * ordersPerDollar) : 0,
    }));

    // Yesterday + 7-day rollups
    const yesterday = sorted[sorted.length - 1];
    const last7 = sorted.slice(-7);
    const last7Spend = {
      aw: last7.reduce((s, d) => s + d.awSpend, 0),
      fb: last7.reduce((s, d) => s + d.fbSpend, 0),
      bing: last7.reduce((s, d) => s + d.bingSpend, 0),
      total: last7.reduce((s, d) => s + d.totalSpend, 0),
      cmsOrders: last7.reduce((s, d) => s + d.cmsOrders, 0),
      cmsRevenue: last7.reduce((s, d) => s + d.cmsRevenue, 0),
      cmsGp: last7.reduce((s, d) => s + d.cmsGp, 0),
    };

    return {
      yesterday,
      last7Spend,
      dailyChart: sorted.map(d => ({
        ...d,
        // Mark recent days as "maturing"
        maturing: lastDays.some(r => r.date === d.date),
      })),
      maturationContext: {
        ordersPerDollar,
        revPerDollar,
        matureWindow: matureDays.length > 0 ? `${matureDays[0].date} to ${matureDays[matureDays.length - 1].date}` : 'unavailable',
        recentDays: recentMaturity,
        explanation: 'Conversions trail spend by 0-3 days for direct-response paid (lag 0 dominates per CCF). Yesterday\'s spend may show only ~70% of expected conversions until Day +3. Use 7-day or 14-day rolling efficiency for stable read; today\'s spot ratio will mislead.',
      },
    };
  }),

  // 3. Scaling recommendations per channel — explicit formula, current marginal ROAS, recommended action
  scalingRecommendations: publicProcedure.query(async () => {
    // Get current daily spend per channel (avg over last 7 days for stability)
    const recent = await runQuery<{ aw: number; fb: number; bing: number }>(`
      SELECT
        (SELECT AVG(cost)::DOUBLE FROM fact_google_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '7 days') as aw,
        (SELECT AVG(cost)::DOUBLE FROM fact_facebook_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '7 days') as fb,
        (SELECT AVG(SUM(cost))::DOUBLE FROM fact_bing_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '7 days' GROUP BY date) as bing
    `);

    const currentSpend = { aw: recent[0]?.aw || 0, fb: recent[0]?.fb || 0, bing: recent[0]?.bing || 0 };

    // For each channel: compute current avg ROAS, current marginal ROAS, recommended next move
    const recs = (Object.entries(CHANNEL_CURVES) as ['aw' | 'fb' | 'bing', typeof CHANNEL_CURVES.aw][]).map(([key, def]) => {
      const spend = currentSpend[key];
      const avgRoas = def.curve(spend);

      // Extract a, b from the curve metadata (we know the formulas)
      const { a, b } = (() => {
        if (key === 'aw') return { a: 13.37, b: 1.69 };
        if (key === 'bing') return { a: 7.43, b: 0.93 };
        return { a: 0.09, b: 0 }; // FB constant
      })();

      const margRoas = b > 0 ? marginalROAS(a, b, spend) : a;

      // Sweet spot = where marginal ROAS = 1.5 (leaves 50% headroom)
      // Stop loss = where avg ROAS = 1.0 (every dollar breaks even on average)
      // Cut zone = where marginal ROAS < 1.0 (next dollar loses money)
      const sweetSpot = b > 0 ? spendAtMarginal(a, b, 1.5) : 0;
      const breakEvenAvg = b > 0 ? spendAtAvg(a, b, 1.0) : 0;
      const breakEvenMarginal = b > 0 ? spendAtMarginal(a, b, 1.0) : 0;

      let action: 'cut' | 'hold' | 'scale' | 'pause';
      let actionDescription: string;
      let formula: string;

      if (key === 'fb') {
        action = 'pause';
        actionDescription = 'Pause Cold prospecting via holdout test (Step 10). FB constant at 0.09× — every $1 returns $0.09 GP regardless of spend level.';
        formula = 'FB: GP/$ = 0.09 (flat across all observed spend). Net per $ = 0.09 - 1.0 = -A$0.91. Holdout determines if hidden upper-funnel value exists.';
      } else if (spend > breakEvenMarginal && spend < breakEvenAvg) {
        action = 'hold';
        actionDescription = `Past marginal break-even but still profitable on average. Adding more spend loses money on the marginal dollar but doesn't tip overall negative until ~A$${breakEvenAvg.toFixed(0)}/day.`;
        formula = `Curve: GP/$ = ${a.toFixed(2)} - ${b.toFixed(2)} × ln(spend). Marginal: (${a.toFixed(2)} - ${b.toFixed(2)}) - ${b.toFixed(2)} × ln(spend) = ${margRoas.toFixed(2)} at A$${spend.toFixed(0)}/day.`;
      } else if (spend < sweetSpot) {
        action = 'scale';
        actionDescription = `Below sweet spot. Marginal ROAS ${margRoas.toFixed(2)}× — each additional $1 returns A$${margRoas.toFixed(2)} GP. Scale toward A$${sweetSpot.toFixed(0)}/day in increments of +25% with weekly checkpoints.`;
        formula = `Sweet spot = exp((${a.toFixed(2)} - ${b.toFixed(2)} - 1.5) / ${b.toFixed(2)}) = A$${sweetSpot.toFixed(0)}/day (where marginal ROAS = 1.5×, leaving 50% headroom).`;
      } else if (spend >= breakEvenAvg) {
        action = 'cut';
        actionDescription = `Past avg break-even. Cut to A$${sweetSpot.toFixed(0)}/day or below — current spend is destroying value on average.`;
        formula = `Avg break-even at A$${breakEvenAvg.toFixed(0)}/day. Current A$${spend.toFixed(0)}/day produces avg ROAS of ${avgRoas.toFixed(2)}× = losing A$${(1 - avgRoas).toFixed(2)} per $1.`;
      } else {
        action = 'hold';
        actionDescription = 'At sweet spot. Hold spend; monitor weekly.';
        formula = `Sweet spot range: A$${sweetSpot.toFixed(0)}-${breakEvenMarginal.toFixed(0)}/day.`;
      }

      return {
        channel: def.label,
        key,
        currentSpend: spend,
        currentSpendPerMonth: spend * 30,
        currentAvgRoas: avgRoas,
        currentMarginalRoas: margRoas,
        sweetSpotSpend: sweetSpot,
        breakEvenAvgSpend: breakEvenAvg,
        breakEvenMarginalSpend: breakEvenMarginal,
        action,
        actionDescription,
        formula,
        nextDollarReturns: margRoas,
        nextDollarNet: margRoas - 1,
      };
    });

    return {
      recommendations: recs,
      framework: {
        sweetSpot: 'Spend where marginal $ returns A$1.50 GP — keeps 50% headroom for noise.',
        breakEvenMarginal: 'Spend where the next $ returns exactly A$1 GP. Past this, marginal $ loses money.',
        breakEvenAvg: 'Spend where avg $ returns exactly A$1 GP. Past this, on average every $ destroys value.',
        formula: 'For log-linear curve gpPerDollar = a - b·ln(spend), marginal ROAS = (a-b) - b·ln(spend). Inverse: spend at target marginal = exp((a-b-target)/b).',
      },
    };
  }),

  // 4. Test queue — curated new platforms / features / creatives to test
  testQueue: publicProcedure.query(async () => {
    return {
      newPlatforms: [
        {
          rank: 1,
          name: 'TikTok Ads (AU)',
          fit: 'High',
          rationale: 'Refurbished phones resonate with younger demographics + sustainability angle. AU TikTok shopping is growing. Low entry cost (A$30/day).',
          startBudget: 'A$30/day for 6 weeks',
          watchpoint: 'CTR > 1% and CPM < A$20. If yes, scale to A$60/day.',
          risk: 'Medium — TikTok attribution is also weak; treat like FB (potential upper-funnel, measure via holdout).',
          tier: 'inferred' as const,
        },
        {
          rank: 2,
          name: 'Google Demand Gen',
          fit: 'High',
          rationale: 'AI-powered upper-funnel campaign type Google launched as Discovery+ replacement. Phonebot already runs PMax — Demand Gen pairs well as a brand-awareness channel inside Google. Could replace some FB prospecting.',
          startBudget: 'A$50/day, audience signals from Customer Match list',
          watchpoint: 'GSC branded "phonebot" clicks (should rise within 30 days if it builds awareness)',
          risk: 'Low (within Google Ads ecosystem you already manage)',
          tier: 'inferred' as const,
        },
        {
          rank: 3,
          name: 'Reddit Ads (AU)',
          fit: 'Medium-High',
          rationale: 'Communities like r/buyitforlife, r/sustainability, r/AustralianTech actively discuss refurb. Self-serve ad platform with low minimums. Could test brand campaigns + buyback offer.',
          startBudget: 'A$20/day, 3 subreddits',
          watchpoint: 'Brand mentions in /r/AustralianTech and direct site visits from reddit referrer',
          risk: 'Low (small budget, easy to kill)',
          tier: 'inferred' as const,
        },
        {
          rank: 4,
          name: 'Pinterest (AU)',
          fit: 'Low-Medium',
          rationale: 'Lower fit for high-AOV electronics, but accessory cross-sell could work. Pinterest Shopping integrates with product feeds.',
          startBudget: 'A$15/day for 4 weeks',
          watchpoint: 'Accessory category orders specifically',
          risk: 'Low spend, low expected return',
          tier: 'uncertain' as const,
        },
        {
          rank: 5,
          name: 'YouTube Shopping ads',
          fit: 'Medium',
          rationale: 'Video product ads on YouTube. Phonebot has no YouTube creative yet — this is a creative investment as well as a media buy.',
          startBudget: 'After producing 2-3 30s product video ads',
          watchpoint: 'CTR > 0.5% on Shopping ads',
          risk: 'Creative production cost (A$2-5k for 3 videos)',
          tier: 'uncertain' as const,
        },
        {
          rank: 6,
          name: 'LinkedIn Ads',
          fit: 'Low (poor B2C fit)',
          rationale: 'Refurbished phones are B2C. LinkedIn audiences are professional / B2B. Only viable angle: bulk-purchase for businesses (refurb fleet). Niche.',
          startBudget: 'NOT recommended — skip.',
          watchpoint: 'n/a',
          risk: 'High CPM, weak conversion fit',
          tier: 'uncertain' as const,
        },
      ],
      googleAdsFeatures: [
        { name: 'Customer Match audience upload', why: 'Upload Brevo email list (~30k recipients) to Google for retargeting + lookalike seed. Free.', priority: 'P1' },
        { name: 'PMax Asset Reports', why: 'See which creatives convert in PMax campaigns. Currently a black box.', priority: 'P1' },
        { name: 'Audience Signals on PMax', why: 'Feed first-party customer lists to PMax algorithm to bias toward similar users.', priority: 'P2' },
        { name: 'Smart Bidding portfolio strategies', why: 'Multi-campaign tROAS bidding to balance spend efficiency across PMax + Search.', priority: 'P2' },
        { name: 'Search Themes for PMax', why: 'Manual keyword hints for PMax — useful since organic is losing commercial query rank.', priority: 'P3' },
      ],
      metaAdsFeatures: [
        { name: 'Meta Conversions API (server-side)', why: 'Backstop for fbclid retention (dev fix landed 2026-04-29). CAPI hardens against ad-blockers + iOS ATT cookie loss. Belt-and-braces with the now-working pixel.', priority: 'P2' },
        { name: 'Custom Audiences from Brevo customer list', why: 'First-party retargeting pool of email subscribers.', priority: 'P2' },
        { name: 'Lookalike audiences from buyer base', why: 'Build prospecting audiences from real buyer profiles, not interest targeting.', priority: 'P2' },
        { name: 'Advantage+ Shopping Campaigns', why: 'Meta\'s PMax equivalent. Test against current Cold|TOF setup AFTER measurement is fixed.', priority: 'P3' },
        { name: 'Catalog ads with dynamic feed', why: 'Show in-stock SKUs dynamically; avoids the iPhone 17 0-purchases trap.', priority: 'P2' },
      ],
      creativeTests: [
        { angle: 'UGC unboxing testimonials', rationale: 'Refurb buyers worry about quality. Real customer videos address objection. 5-7 short clips.', estCost: 'A$1k-3k (UGC platform or in-store filming)', tier: 'inferred' },
        { angle: 'Side-by-side new vs refurbed price', rationale: 'Direct value framing. Works in static + video. Especially for iPhone Pro Max.', estCost: 'A$300 design', tier: 'inferred' },
        { angle: 'Sustainability angle (carbon savings)', rationale: 'Refurb saves ~50kg CO2 per phone. Resonates with younger AU audiences. Pairs well with TikTok test.', estCost: 'A$200 graphic, can use existing data', tier: 'inferred' },
        { angle: 'Warranty + condition transparency video', rationale: 'Phonebot grades (Like New / Grade A / Grade B) are competitive advantage — explain visually.', estCost: 'A$500 short video', tier: 'inferred' },
        { angle: 'Storefront tour (Reservoir VIC)', rationale: 'Local AU credibility. Boost store walk-ins + GMB local SEO.', estCost: 'A$300 single-day shoot', tier: 'inferred' },
        { angle: 'Buyback / trade-in promotion', rationale: 'Capture pre-purchase intent on old devices. Already running but creative is dated.', estCost: 'A$300 refresh', tier: 'inferred' },
        { angle: 'iPhone 17 in-stock announcement', rationale: 'Re-launch the iPhone 17 campaigns currently producing 0 purchases — likely creative/feed issue, not demand.', estCost: 'A$200', tier: 'inferred' },
      ],
    };
  }),

  // 5. Industry benchmarks — refurbished e-commerce AU context
  benchmarks: publicProcedure.query(async () => {
    // Pull live Phonebot numbers for comparison
    const live = await runQuery<{
      aov: number;
      margin: number;
      refundRateRev: number;
      repeatRate: number;
      cpa: number;
      emailOpen: number;
      emailClick: number;
    }>(`
      SELECT
        (SELECT AVG(total)::DOUBLE FROM fact_web_orders WHERE order_date >= CURRENT_DATE - INTERVAL '90 days') as aov,
        (SELECT (SUM(gp_imputed) / SUM(total))::DOUBLE FROM fact_web_orders WHERE order_date >= CURRENT_DATE - INTERVAL '90 days') as margin,
        (SELECT (SUM(CASE WHEN was_refunded THEN total ELSE 0 END) / SUM(total))::DOUBLE FROM fact_web_orders WHERE order_date >= CURRENT_DATE - INTERVAL '90 days') as refundRateRev,
        (SELECT
          COUNT(CASE WHEN n > 1 THEN 1 END)::DOUBLE / COUNT(*)
          FROM (SELECT Email, COUNT(*) as n FROM fact_web_orders WHERE Email IS NOT NULL AND Email != '' GROUP BY Email)
        ) as repeatRate,
        (
          (SELECT SUM(cost) FROM fact_google_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '30 days')
          + (SELECT SUM(cost) FROM fact_facebook_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '30 days')
          + (SELECT SUM(cost) FROM fact_bing_ads_daily WHERE date >= CURRENT_DATE - INTERVAL '30 days')
        )::DOUBLE / NULLIF((SELECT COUNT(*) FROM fact_web_orders WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'), 0) as cpa,
        (SELECT (SUM(opens_unique)::DOUBLE / NULLIF(SUM(delivered), 0)) FROM fact_brevo_campaigns WHERE date >= CURRENT_DATE - INTERVAL '90 days') as emailOpen,
        (SELECT (SUM(clicks_unique)::DOUBLE / NULLIF(SUM(delivered), 0)) FROM fact_brevo_campaigns WHERE date >= CURRENT_DATE - INTERVAL '90 days') as emailClick
    `);

    const p = live[0];

    return [
      {
        metric: 'Average Order Value (AOV)',
        phonebot: p?.aov || 0,
        phonebotDisplay: `A$${(p?.aov || 0).toFixed(0)}`,
        benchmark: 'A$400-600',
        verdict: 'in band',
        verdictTier: 'good' as const,
        notes: 'Refurb phone AU market typical range. Higher AOV usually means premium SKU mix.',
      },
      {
        metric: 'Gross margin (after imputation)',
        phonebot: p?.margin || 0,
        phonebotDisplay: `${((p?.margin || 0) * 100).toFixed(1)}%`,
        benchmark: '22-30%',
        verdict: 'top of band',
        verdictTier: 'good' as const,
        notes: 'Phonebot margin is healthy and improving. Locked finding: 26.5% → 28.5% YoY.',
      },
      {
        metric: 'Refund rate (revenue)',
        phonebot: p?.refundRateRev || 0,
        phonebotDisplay: `${((p?.refundRateRev || 0) * 100).toFixed(1)}%`,
        benchmark: '<8%',
        verdict: 'good',
        verdictTier: 'good' as const,
        notes: 'Below typical refurb refund rate. Xiaomi and AirPods historically high-refund — currently exited.',
      },
      {
        metric: 'Repeat customer rate (lifetime)',
        phonebot: p?.repeatRate || 0,
        phonebotDisplay: `${((p?.repeatRate || 0) * 100).toFixed(1)}%`,
        benchmark: '8-15%',
        verdict: 'low end',
        verdictTier: 'caution' as const,
        notes: 'Phonebot 5.1% across 14 months. Phone replacement cycle is long (24-36mo) so harder to repeat. Email + accessory cross-sell are the levers.',
      },
      {
        metric: 'CPA (paid spend / web orders)',
        phonebot: p?.cpa || 0,
        phonebotDisplay: `A$${(p?.cpa || 0).toFixed(0)}`,
        benchmark: 'A$50-100 e-commerce typical',
        verdict: 'good',
        verdictTier: 'good' as const,
        notes: 'CPA understates true cost (excludes inventory acquisition). But the relative number is competitive.',
      },
      {
        metric: 'Email open rate',
        phonebot: p?.emailOpen || 0,
        phonebotDisplay: `${((p?.emailOpen || 0) * 100).toFixed(1)}%`,
        benchmark: '20-30% (AU e-commerce)',
        verdict: 'in band',
        verdictTier: 'good' as const,
        notes: '24-26% Q1 2026. Halved during BFCM saturation; recovered Q1.',
      },
      {
        metric: 'Email click rate',
        phonebot: p?.emailClick || 0,
        phonebotDisplay: `${((p?.emailClick || 0) * 100).toFixed(1)}%`,
        benchmark: '1-3% (e-commerce)',
        verdict: 'middle of band',
        verdictTier: 'caution' as const,
        notes: 'Could improve with better segmentation. Brevo segmentation features under-used.',
      },
      {
        metric: 'Cart abandonment',
        phonebot: 0.665,
        phonebotDisplay: '66.5%',
        benchmark: '65-75% typical',
        verdict: 'in band',
        verdictTier: 'good' as const,
        notes: 'Cart→checkout drop ~33%; checkout→purchase ~73% based on GA4 funnel.',
      },
    ];
  }),

  // 6. Competitor watch
  competitorWatch: publicProcedure.query(async () => {
    return [
      {
        name: 'Reebelo',
        type: 'Direct competitor',
        positioning: 'AU/NZ refurb marketplace, multi-vendor, focused on iPhone + Samsung',
        threat: 'High',
        evidence: 'Appeared in GW data 19 clicks/24d in Apr 2026. Likely cause of iPhone Like New AOV -15% pricing pressure.',
        watchpoints: ['Price parity on top 5 iPhone Like New SKUs', 'Their share of "refurbished iphone" GSC clicks'],
      },
      {
        name: 'Mobileciti',
        type: 'Direct competitor',
        positioning: 'AU electronics retailer with refurb section. Mainstream brand, physical + online.',
        threat: 'Medium',
        evidence: 'Established player. Probably stealing some "refurbished phone australia" branded long-tail.',
        watchpoints: ['Their PMax shopping ads on iPhone keywords'],
      },
      {
        name: 'BackMarket',
        type: 'Global refurb marketplace, expanding in AU',
        positioning: 'Multi-vendor, certified-refurb badge, scale brand',
        threat: 'Medium → High over 12 months',
        evidence: 'Major US/EU presence. AU expansion in progress per public statements.',
        watchpoints: ['Their AU paid spend visibility (Google Ads Transparency Center)', 'Brand search "backmarket australia"'],
      },
      {
        name: 'JB Hi-Fi / Kogan',
        type: 'Mainstream retailer with refurb',
        positioning: 'Trust + scale, but refurb is ancillary not core',
        threat: 'Low-Medium',
        evidence: 'Brand-trust competitors but limited refurb depth.',
        watchpoints: ['When they run promo campaigns on refurb sections'],
      },
      {
        name: 'Cashify',
        type: 'Buyback-focused, expanding to direct sales',
        positioning: 'Originally Indian buyback company, expanding AU',
        threat: 'Low currently, watch',
        evidence: 'Buyback focus could intersect Phonebot\'s buyback/whatsapp lead-gen funnel.',
        watchpoints: ['Their AU brand search trajectory'],
      },
    ];
  }),

  // 7. Value-added insights — non-obvious findings worth surfacing
  valueAddedInsights: publicProcedure.query(async () => {
    return [
      {
        title: 'The 35% Unassigned bucket might BE the email layer',
        body: 'A$38k/mo of GP sits in PM-Unassigned with no session source. Brevo has 26k recipient reach with 26% open rate (~6,800 opens) and 1.77% click rate (~120 clicks per send). If a meaningful share of those clicks complete purchase via session-less flow (mobile mail app, server-side checkout), they would land in Unassigned. Strongest hypothesis worth testing with the UTM fix.',
        tier: 'inferred' as const,
      },
      {
        title: 'Brand harvest is a "borrowed asset", not a moat',
        body: 'Brand campaigns produce 60% of paid net profit on 14% of spend — but this depends on existing brand demand. The branded "phonebot" search dropped 32-44% concurrent with FB/AW cuts. If brand demand keeps decaying at this rate, brand-harvest profitability is a 12-18 month asset, not a moat. Either invest in upstream demand creation (FB holdout result will inform whether FB plays this role) OR accept the harvest decline.',
        tier: 'reconciled' as const,
      },
      {
        title: 'Apr 20 daily orders ticked back up — Easter halo or trend reversal?',
        body: 'Step 9 weekly drill noted the partial week of Apr 20 showed 27 orders/day vs 22-23 the prior weeks. Now (Apr 26) the 14-day baseline is 22.4 — meaning the Apr 20 spike did NOT sustain. Easter Sale was Apr 4 with 25k+ recipients; this is likely the lagged conversion landing, not a trend.',
        tier: 'inferred' as const,
      },
      {
        title: 'Store growth + GMB → web zero correlation = parallel businesses',
        body: 'Store grew +5/+10/+20% YoY. GMB views correlate ~0 with CMS web orders. These are structurally different funnels. Ranking dashboards by total business GP misses that the store and the web channel have different optimisation playbooks. Store needs local SEO + GMB; web needs paid + organic search. They share a brand and a customer pool but not a journey.',
        tier: 'reconciled' as const,
      },
      {
        title: 'iPhone Like New is the only segment with visible price pressure',
        body: 'Step 8 product-cliff diagnosis: every other category lost on volume, NOT price. AOV up across 7 of 9 brand × condition combos. iPhone Like New uniquely shows AOV -15% on flat volume — textbook competitive price pressure. If you act on price ANYWHERE, only act here. Don\'t blanket-discount the catalog.',
        tier: 'reconciled' as const,
      },
      {
        title: 'Repeat-customer median time-to-2nd is 31 days = accessory cross-sell, not replacement',
        body: 'Phonebot\'s 5.1% lifetime repeat rate is low for retail but understandable: phones replace every 24-36 months. The 31-day median to 2nd order suggests these are accessory/case/cable add-ons, NOT replacement phones. Brevo email is the natural channel — but Brevo currently has zero attribution to revenue. Fixing UTMs unlocks measurement of this entire layer.',
        tier: 'reconciled' as const,
      },
    ];
  }),
});
