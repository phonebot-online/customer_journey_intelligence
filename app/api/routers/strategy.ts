import { z } from 'zod';
import { router, publicProcedure } from '../middleware';
import { runQuery } from '../lib/duckdb';
import { pearsonR, bestLag, herfindahl, concentrationLabel, correlationTier, concurrencyLift } from '../lib/synergy';
import { CHANNEL_CURVES, forecastScenario, PLANNING_PRESETS, type PlanningMode } from '../lib/scenarios';

const TimeWindow = z.enum(['1m', '3m', '6m', '12m']);

function getDateFilter(window: string): string {
  const days = window === '1m' ? 30 : window === '3m' ? 90 : window === '6m' ? 180 : 365;
  return `CURRENT_DATE - INTERVAL '${days} days'`;
}

// Aligned daily series across multiple sources, joined on date.
async function getDailySeries(window: string): Promise<{ date: string; cmsOrders: number; cmsRevenue: number; cmsGp: number; awSpend: number; fbSpend: number; fbPurchases: number; bingSpend: number; gscBranded: number; gscNonBranded: number; gmbViews: number; brevoSendDay: number }[]> {
  const dateFilter = getDateFilter(window);

  // Build a single query that joins all daily aggregates by date.
  return runQuery(`
    WITH dates AS (
      SELECT DISTINCT DATE(order_date) as date FROM fact_web_orders WHERE order_date >= ${dateFilter}
    ),
    cms AS (
      SELECT DATE(order_date) as date,
             COUNT(*)::INTEGER as orders,
             SUM(total)::DOUBLE as revenue,
             SUM(gp_imputed)::DOUBLE as gp
      FROM fact_web_orders WHERE order_date >= ${dateFilter} GROUP BY date
    ),
    aw AS (
      SELECT date, SUM(cost)::DOUBLE as spend FROM fact_google_ads_daily WHERE date >= ${dateFilter} GROUP BY date
    ),
    fb AS (
      SELECT date, SUM(cost)::DOUBLE as spend, SUM(purchases)::INTEGER as purchases FROM fact_facebook_ads_daily WHERE date >= ${dateFilter} GROUP BY date
    ),
    bing AS (
      SELECT date, SUM(cost)::DOUBLE as spend FROM fact_bing_ads_daily WHERE date >= ${dateFilter} GROUP BY date
    ),
    gscB AS (
      SELECT date, clicks::INTEGER as clicks FROM fact_search_console_daily WHERE branded = 'branded'
    ),
    gscN AS (
      SELECT date, clicks::INTEGER as clicks FROM fact_search_console_daily WHERE branded = 'non-branded'
    ),
    gmb AS (
      SELECT date, SUM(total_views)::INTEGER as views FROM fact_gmb_daily WHERE date >= ${dateFilter} GROUP BY date
    ),
    brevo AS (
      SELECT date, COUNT(*)::INTEGER as sends FROM fact_brevo_campaigns WHERE date >= ${dateFilter} GROUP BY date
    )
    SELECT
      d.date,
      COALESCE(cms.orders, 0) as cmsOrders,
      COALESCE(cms.revenue, 0) as cmsRevenue,
      COALESCE(cms.gp, 0) as cmsGp,
      COALESCE(aw.spend, 0) as awSpend,
      COALESCE(fb.spend, 0) as fbSpend,
      COALESCE(fb.purchases, 0) as fbPurchases,
      COALESCE(bing.spend, 0) as bingSpend,
      COALESCE(gscB.clicks, 0) as gscBranded,
      COALESCE(gscN.clicks, 0) as gscNonBranded,
      COALESCE(gmb.views, 0) as gmbViews,
      CASE WHEN brevo.sends > 0 THEN 1 ELSE 0 END as brevoSendDay
    FROM dates d
    LEFT JOIN cms ON d.date = cms.date
    LEFT JOIN aw ON d.date = aw.date
    LEFT JOIN fb ON d.date = fb.date
    LEFT JOIN bing ON d.date = bing.date
    LEFT JOIN gscB ON d.date = gscB.date
    LEFT JOIN gscN ON d.date = gscN.date
    LEFT JOIN gmb ON d.date = gmb.date
    LEFT JOIN brevo ON d.date = brevo.date
    ORDER BY d.date
  `);
}

export const strategyRouter = router({
  // 1. Standalone platform value — per-channel role, contribution, dependence flag.
  standalonePlatforms: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const dateFilter = getDateFilter(input.window);

      // Per-channel PM-attributed numbers (1m only — locked data)
      const pmChannels = input.window === '1m' ? await runQuery<{ channel: string; sessions: number; purchases: number; revenue: number; gp: number }>(`
        SELECT r.channel, r.sessions, r.purchases, r.revenue, g.gp
        FROM fact_pm_channel_revenue r LEFT JOIN fact_pm_channel_gp g ON r.channel = g.channel
        ORDER BY g.gp DESC NULLS LAST
      `) : [];

      // Paid spend by platform
      const aw = await runQuery<{ spend: number }>(`SELECT COALESCE(SUM(cost), 0)::DOUBLE as spend FROM fact_google_ads_daily WHERE date >= ${dateFilter}`);
      const fb = await runQuery<{ spend: number }>(`SELECT COALESCE(SUM(cost), 0)::DOUBLE as spend FROM fact_facebook_ads_daily WHERE date >= ${dateFilter}`);
      const bing = await runQuery<{ spend: number }>(`SELECT COALESCE(SUM(cost), 0)::DOUBLE as spend FROM fact_bing_ads_daily WHERE date >= ${dateFilter}`);

      const awSpend = aw[0]?.spend || 0;
      const fbSpend = fb[0]?.spend || 0;
      const bingSpend = bing[0]?.spend || 0;

      // Map PM channels back to platforms (rough: Cross-network + Paid Search + Paid Shopping → AW + Bing share)
      const findChan = (name: string) => pmChannels.find(c => c.channel === name);
      const awGP = (findChan('Cross-network')?.gp || 0) + (findChan('Paid Search')?.gp || 0) * 0.85 + (findChan('Paid Shopping')?.gp || 0) * 0.85;
      const bingGP = (findChan('Paid Search')?.gp || 0) * 0.15 + (findChan('Paid Shopping')?.gp || 0) * 0.15;
      const fbGP = findChan('Paid Social')?.gp || 0;
      const organicGP = (findChan('Organic Search')?.gp || 0) + (findChan('Organic Social')?.gp || 0) + (findChan('Organic Shopping')?.gp || 0);
      const directGP = findChan('Direct')?.gp || 0;
      const referralGP = findChan('Referral')?.gp || 0;
      const unassignedGP = findChan('Unassigned')?.gp || 0;

      const platforms = [
        {
          key: 'google_ads', label: 'Google Ads', spend: awSpend, gp: awGP, realRoas: awSpend > 0 ? awGP / awSpend : 0,
          role: 'Direct converter + brand harvester', confidence: 'confirmed' as const,
          standaloneViable: true, dependence: 'Brand campaigns (60% of paid net profit) depend on upstream demand creation',
          tier: 'reconciled' as const,
        },
        {
          key: 'facebook', label: 'Facebook + IG', spend: fbSpend, gp: fbGP, realRoas: fbSpend > 0 ? fbGP / fbSpend : 0,
          role: 'Suspected demand creator (upper-funnel) — broken tracking', confidence: 'unconfirmed' as const,
          standaloneViable: false, dependence: 'Net loss attributable; net contribution unknown until holdout test',
          tier: 'inferred' as const,
        },
        {
          key: 'bing', label: 'Bing Ads', spend: bingSpend, gp: bingGP, realRoas: bingSpend > 0 ? bingGP / bingSpend : 0,
          role: 'Mini-Google clone, very efficient at small scale', confidence: 'confirmed' as const,
          standaloneViable: true, dependence: 'Limited by query volume',
          tier: 'reconciled' as const,
        },
        {
          key: 'organic', label: 'Search Console / Organic', spend: 0, gp: organicGP, realRoas: 0,
          role: 'Demand floor + content discovery (research queries)', confidence: 'confirmed' as const,
          standaloneViable: true, dependence: 'Declining commercial-query share',
          tier: 'reconciled' as const,
        },
        {
          key: 'email', label: 'Brevo / Email', spend: 0, gp: 0, realRoas: 0,
          role: 'Repeat-purchase amplifier + cross-sell (assist-only, no $ visible)', confidence: 'inferred' as const,
          standaloneViable: false, dependence: 'Invisible without UTM fix on outbound links',
          tier: 'uncertain' as const,
        },
        {
          key: 'gmb', label: 'GMB', spend: 0, gp: 0, realRoas: 0,
          role: 'Store-walk-in driver only — separate funnel', confidence: 'confirmed' as const,
          standaloneViable: true, dependence: 'No web overlap; store-side only',
          tier: 'reconciled' as const,
        },
        {
          key: 'direct', label: 'Direct + Referral', spend: 0, gp: directGP + referralGP, realRoas: 0,
          role: 'Brand-recall conversions + word-of-mouth', confidence: 'confirmed' as const,
          standaloneViable: false, dependence: 'Downstream of every other channel',
          tier: 'reconciled' as const,
        },
        {
          key: 'unassigned', label: 'PM Unassigned (server-side)', spend: 0, gp: unassignedGP, realRoas: 0,
          role: 'Cross-touch / server-side / email-completion conversions', confidence: 'inferred' as const,
          standaloneViable: false, dependence: 'Composition unknown — investigate ProfitMetrics population logic',
          tier: 'uncertain' as const,
        },
      ];

      return platforms;
    }),

  // 2. Concentration vs diversification (HHI on attributed PM-GP shares)
  concentrationScore: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      if (input.window !== '1m') {
        return { hhi: null, label: null, channels: [], caveat: 'Channel-level PM data only available for 1m window.' };
      }
      const channels = await runQuery<{ channel: string; gp: number }>(`
        SELECT channel, gp FROM fact_pm_channel_gp WHERE gp > 0 ORDER BY gp DESC
      `);
      const total = channels.reduce((s, c) => s + (c.gp || 0), 0);
      const shares = channels.map(c => ({ channel: c.channel, gp: c.gp || 0, share: total > 0 ? (c.gp || 0) / total : 0 }));
      const hhi = herfindahl(shares.map(s => s.share));
      return {
        hhi,
        label: concentrationLabel(hhi),
        channels: shares,
        caveat: 'HHI includes Unassigned bucket (35% of GP) which is server-side / cross-touch. Excluding it would shift toward "diversified".',
      };
    }),

  // 3. Synergy matrix — pairwise correlations + lag analysis
  synergyMatrix: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const series = await getDailySeries(input.window);
      if (series.length < 7) {
        return { signals: [], n: series.length, caveat: 'Insufficient daily data for correlation analysis (need ≥7 days).' };
      }

      // Pre-extract numeric series
      const cmsOrders = series.map(s => s.cmsOrders);
      const gscBranded = series.map(s => s.gscBranded);
      const awSpend = series.map(s => s.awSpend);
      const fbSpend = series.map(s => s.fbSpend);
      const bingSpend = series.map(s => s.bingSpend);
      const gmbViews = series.map(s => s.gmbViews);
      const brevoSendDay = series.map(s => s.brevoSendDay);
      const gscNonBranded = series.map(s => s.gscNonBranded);

      // Test pairs: (driver, outcome) with best lag in 0..7
      const tests = [
        { driver: 'AW spend', outcome: 'CMS orders', a: awSpend, b: cmsOrders, hypothesis: 'Direct conversion driver' },
        { driver: 'FB spend', outcome: 'CMS orders', a: fbSpend, b: cmsOrders, hypothesis: 'Direct or upper-funnel?' },
        { driver: 'Bing spend', outcome: 'CMS orders', a: bingSpend, b: cmsOrders, hypothesis: 'Small-volume direct converter' },
        { driver: 'FB spend', outcome: 'GSC branded clicks', a: fbSpend, b: gscBranded, hypothesis: 'FB drives brand search demand?' },
        { driver: 'AW spend', outcome: 'GSC branded clicks', a: awSpend, b: gscBranded, hypothesis: 'AW retargeting reinforces brand recall?' },
        { driver: 'GSC branded clicks', outcome: 'CMS orders', a: gscBranded, b: cmsOrders, hypothesis: 'Brand demand → conversions' },
        { driver: 'GSC non-branded clicks', outcome: 'CMS orders', a: gscNonBranded, b: cmsOrders, hypothesis: 'Organic discovery → conversions' },
        { driver: 'GMB views', outcome: 'CMS orders', a: gmbViews, b: cmsOrders, hypothesis: 'GMB → web orders (expected: zero)' },
        { driver: 'Brevo send day', outcome: 'CMS orders', a: brevoSendDay, b: cmsOrders, hypothesis: 'Email send → same-day conversion lift' },
        { driver: 'AW spend', outcome: 'FB spend', a: awSpend, b: fbSpend, hypothesis: 'Are they varied together? (confounder check)' },
      ];

      const signals = tests.map(t => {
        const r0 = pearsonR(t.a, t.b);
        const lagBest = bestLag(t.a, t.b, 7);
        return {
          driver: t.driver,
          outcome: t.outcome,
          hypothesis: t.hypothesis,
          rLag0: r0,
          bestLagDays: lagBest.lag,
          bestLagR: lagBest.r,
          tier: correlationTier(lagBest.r, t.a.length),
          n: t.a.length,
        };
      });

      return { signals, n: series.length, caveat: 'Correlations are observational, not causal. Significance is heuristic, not formal.' };
    }),

  // 4. Per-day series for charting
  dailyAlignedSeries: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      return getDailySeries(input.window);
    }),

  // 5. Scenario forecast
  forecastScenario: publicProcedure
    .input(z.object({
      aw: z.number().min(0).max(5000),
      fb: z.number().min(0).max(2000),
      bing: z.number().min(0).max(1000),
    }))
    .query(async ({ input }) => {
      return forecastScenario(input);
    }),

  // 6. Planning mode preset
  planningMode: publicProcedure
    .input(z.object({ mode: z.enum(['cheap', 'sweet', 'aggressive']) }))
    .query(async ({ input }) => {
      const preset = PLANNING_PRESETS[input.mode];
      const forecast = forecastScenario({ aw: preset.aw, fb: preset.fb, bing: preset.bing });
      return {
        mode: input.mode,
        allocation: { aw: preset.aw, fb: preset.fb, bing: preset.bing },
        rationale: preset.rationale,
        risks: preset.risks,
        actions: preset.actions,
        forecast,
      };
    }),

  // 7. Compare planning modes side-by-side
  comparePlanningModes: publicProcedure
    .query(async () => {
      const modes: PlanningMode[] = ['cheap', 'sweet', 'aggressive'];
      return modes.map(m => {
        const preset = PLANNING_PRESETS[m];
        const forecast = forecastScenario({ aw: preset.aw, fb: preset.fb, bing: preset.bing });
        return {
          mode: m,
          allocation: { aw: preset.aw, fb: preset.fb, bing: preset.bing },
          rationale: preset.rationale,
          risks: preset.risks,
          actions: preset.actions,
          forecast,
        };
      });
    }),

  // 8. Channel saturating-curve metadata (for transparency)
  channelCurves: publicProcedure
    .query(async () => {
      return Object.values(CHANNEL_CURVES).map(c => ({
        key: c.key,
        label: c.label,
        minSpend: c.minSpend,
        maxSpend: c.maxSpend,
        dataPoints: c.dataPoints,
        // Sample the curve at regular intervals
        curvePoints: Array.from({ length: 21 }, (_, i) => {
          const spend = c.minSpend + (c.maxSpend - c.minSpend) * (i / 20);
          return { spend, efficiency: c.curve(spend), gp: spend * c.curve(spend) };
        }),
      }));
    }),

  // 9. Concurrency lift — for each pair (driver, outcome), compare outcome on driver-active vs driver-paused days.
  // Driver "active" defined either as binary (Brevo send-day) or as above-median spend day (paid channels).
  concurrencyLifts: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const series = await getDailySeries(input.window);
      if (series.length < 7) {
        return { tests: [], n: series.length, caveat: 'Need ≥7 days for concurrency analysis.' };
      }

      // Helper: median-split a paid channel's spend to get "high-spend" days
      const medianOf = (arr: number[]) => {
        const sorted = [...arr].filter(v => v > 0).sort((a, b) => a - b);
        return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
      };
      const fbMed = medianOf(series.map(s => s.fbSpend));
      const awMed = medianOf(series.map(s => s.awSpend));
      const bingMed = medianOf(series.map(s => s.bingSpend));

      const brevoSendDays = new Set(series.filter(s => s.brevoSendDay > 0).map(s => s.date));
      const fbHighDays = new Set(series.filter(s => s.fbSpend > fbMed).map(s => s.date));
      const awHighDays = new Set(series.filter(s => s.awSpend > awMed).map(s => s.date));
      const bingHighDays = new Set(series.filter(s => s.bingSpend > bingMed).map(s => s.date));

      // For each test, compute lift on chosen outcome (CMS orders default)
      const buildSeries = (key: 'cmsOrders' | 'cmsRevenue' | 'cmsGp' | 'gscBranded') =>
        series.map(s => ({ date: s.date, efficiency: s[key] }));

      const tests = [
        {
          name: 'Brevo send-day → CMS orders',
          hypothesis: 'Days with email campaign send produce more CMS orders',
          ...concurrencyLift(buildSeries('cmsOrders'), brevoSendDays),
          driver: 'Brevo send (binary)',
          outcome: 'CMS orders',
        },
        {
          name: 'Brevo send-day → CMS revenue',
          hypothesis: 'Days with email send produce more revenue',
          ...concurrencyLift(buildSeries('cmsRevenue'), brevoSendDays),
          driver: 'Brevo send (binary)',
          outcome: 'CMS revenue',
        },
        {
          name: 'High AW spend day → CMS orders',
          hypothesis: 'Days with above-median AW spend produce more CMS orders',
          ...concurrencyLift(buildSeries('cmsOrders'), awHighDays),
          driver: `AW spend > A$${awMed.toFixed(0)}`,
          outcome: 'CMS orders',
        },
        {
          name: 'High FB spend day → CMS orders',
          hypothesis: 'Days with above-median FB spend produce more CMS orders',
          ...concurrencyLift(buildSeries('cmsOrders'), fbHighDays),
          driver: `FB spend > A$${fbMed.toFixed(0)}`,
          outcome: 'CMS orders',
        },
        {
          name: 'High FB spend day → branded search',
          hypothesis: 'High-FB days drive concurrent branded "phonebot" search demand',
          ...concurrencyLift(buildSeries('gscBranded'), fbHighDays),
          driver: `FB spend > A$${fbMed.toFixed(0)}`,
          outcome: 'GSC branded clicks',
        },
        {
          name: 'High Bing spend day → CMS orders',
          hypothesis: 'Days with above-median Bing spend produce more CMS orders',
          ...concurrencyLift(buildSeries('cmsOrders'), bingHighDays),
          driver: `Bing spend > A$${bingMed.toFixed(0)}`,
          outcome: 'CMS orders',
        },
      ];

      return {
        tests: tests.map(t => ({
          ...t,
          liftPct: t.lift !== null ? t.lift * 100 : null,
        })),
        n: series.length,
        caveat: 'Concurrency lift = (active_mean / paused_mean) - 1. Observational only — does not prove causation. Common-cause confounders (promo days, weekday seasonality) may inflate lift estimates.',
      };
    }),

  // 10. Journey stage decomposition by channel (1m only — needs channel-level funnel events)
  journeyStages: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      if (input.window !== '1m') {
        return {
          aggregate: null,
          byChannel: [],
          caveat: 'Channel-level funnel data only available for 1m (GA4 channel summary 30d).',
        };
      }

      // GA4 channel-level funnel
      const channels = await runQuery<{
        channel: string;
        sessions: number;
        new_users: number;
        purchases: number;
        revenue: number;
        add_to_carts: number;
        checkouts: number;
      }>(`
        SELECT channel, sessions, new_users, purchases, revenue, add_to_carts, checkouts
        FROM fact_ga4_channel
        ORDER BY sessions DESC
      `);

      // Aggregate funnel
      const sums = channels.reduce((acc, c) => ({
        sessions: acc.sessions + (c.sessions || 0),
        new_users: acc.new_users + (c.new_users || 0),
        addToCarts: acc.addToCarts + (c.add_to_carts || 0),
        checkouts: acc.checkouts + (c.checkouts || 0),
        purchases: acc.purchases + (c.purchases || 0),
      }), { sessions: 0, new_users: 0, addToCarts: 0, checkouts: 0, purchases: 0 });

      // Demand-stage upstream signals
      const demand = await runQuery<{ gsc_clicks: number; gmb_views: number; brevo_sends: number }>(`
        SELECT
          (SELECT COALESCE(SUM(clicks), 0) FROM fact_search_console_daily) as gsc_clicks,
          (SELECT COALESCE(SUM(total_views), 0) FROM fact_gmb_daily) as gmb_views,
          (SELECT COALESCE(SUM(recipients), 0) FROM fact_brevo_campaigns WHERE date >= CURRENT_DATE - INTERVAL '30 days') as brevo_sends
      `);

      // CMS truth (web orders + revenue)
      const cms = await runQuery<{ orders: number; revenue: number; gp: number; repeat_orders: number }>(`
        SELECT
          COUNT(*)::INTEGER as orders,
          SUM(total)::DOUBLE as revenue,
          SUM(gp_imputed)::DOUBLE as gp,
          (
            SELECT COUNT(*)::INTEGER FROM (
              SELECT Email, COUNT(*) as n FROM fact_web_orders
              WHERE Email IS NOT NULL AND Email != '' AND order_date >= CURRENT_DATE - INTERVAL '30 days'
              GROUP BY Email HAVING COUNT(*) > 1
            )
          ) as repeat_orders
        FROM fact_web_orders WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
      `);

      return {
        aggregate: {
          // Demand stage (upstream, multi-source)
          demand: {
            gscClicks: demand[0]?.gsc_clicks || 0,
            gmbViews: demand[0]?.gmb_views || 0,
            brevoSends: demand[0]?.brevo_sends || 0,
            label: 'Demand signals (organic search clicks + map views + email reach)',
          },
          sessions: sums.sessions,
          newUsers: sums.new_users,
          addToCarts: sums.addToCarts,
          checkouts: sums.checkouts,
          purchasesGA4: sums.purchases,
          purchasesCMS: cms[0]?.orders || 0,
          revenueCMS: cms[0]?.revenue || 0,
          gpCMS: cms[0]?.gp || 0,
          repeatCustomers: cms[0]?.repeat_orders || 0,
          // Drop-off rates
          sessionToCart: sums.sessions > 0 ? sums.addToCarts / sums.sessions : 0,
          cartToCheckout: sums.addToCarts > 0 ? sums.checkouts / sums.addToCarts : 0,
          checkoutToPurchase: sums.checkouts > 0 ? sums.purchases / sums.checkouts : 0,
          sessionToPurchase: sums.sessions > 0 ? sums.purchases / sums.sessions : 0,
        },
        byChannel: channels.map(c => ({
          channel: c.channel,
          sessions: c.sessions || 0,
          addToCarts: c.add_to_carts || 0,
          checkouts: c.checkouts || 0,
          purchases: c.purchases || 0,
          sessionToCart: c.sessions > 0 ? (c.add_to_carts || 0) / c.sessions : 0,
          cartToCheckout: c.add_to_carts > 0 ? (c.checkouts || 0) / c.add_to_carts : 0,
          checkoutToPurchase: c.checkouts > 0 ? (c.purchases || 0) / c.checkouts : 0,
          sessionToPurchase: c.sessions > 0 ? (c.purchases || 0) / c.sessions : 0,
        })),
        caveat: 'GA4 last-click attribution undercounts ~20% vs CMS truth. Email assist invisible without UTMs. Repeat customer count uses Email join on web orders only (excludes store walk-ins).',
      };
    }),

  // 11. FB Holdout tracker — given a start date, computes baseline and post-test averages.
  holdoutTracker: publicProcedure
    .input(z.object({ holdoutStartDate: z.string().nullable() }))
    .query(async ({ input }) => {
      // Always provide pre-test baseline = trailing 14 days from the most recent CMS date
      const baseline = await runQuery<{ date: string; orders: number; revenue: number; gp: number }>(`
        SELECT
          DATE(order_date) as date,
          COUNT(*)::INTEGER as orders,
          SUM(total)::DOUBLE as revenue,
          SUM(gp_imputed)::DOUBLE as gp
        FROM fact_web_orders
        WHERE order_date >= (SELECT MAX(order_date) - INTERVAL '14 days' FROM fact_web_orders)
          AND order_date < (SELECT MAX(order_date) FROM fact_web_orders)
        GROUP BY date ORDER BY date
      `);

      const baselineAvg = baseline.length > 0 ? {
        ordersPerDay: baseline.reduce((s, d) => s + d.orders, 0) / baseline.length,
        revPerDay: baseline.reduce((s, d) => s + d.revenue, 0) / baseline.length,
        gpPerDay: baseline.reduce((s, d) => s + d.gp, 0) / baseline.length,
        days: baseline.length,
      } : { ordersPerDay: 0, revPerDay: 0, gpPerDay: 0, days: 0 };

      // GSC branded baseline
      const gscBaseline = await runQuery<{ avg_clicks: number; days: number }>(`
        SELECT AVG(clicks)::DOUBLE as avg_clicks, COUNT(*)::INTEGER as days
        FROM fact_search_console_daily
        WHERE branded = 'branded'
          AND date >= (SELECT MAX(date) - INTERVAL '14 days' FROM fact_search_console_daily)
      `);

      let postTest: { date: string; orders: number; revenue: number; gp: number }[] = [];
      let postTestAvg = null;
      let dayOfTest = 0;
      let decision: { outcome: string; action: string; tier: string } | null = null;

      if (input.holdoutStartDate) {
        postTest = await runQuery<{ date: string; orders: number; revenue: number; gp: number }>(`
          SELECT
            DATE(order_date) as date,
            COUNT(*)::INTEGER as orders,
            SUM(total)::DOUBLE as revenue,
            SUM(gp_imputed)::DOUBLE as gp
          FROM fact_web_orders
          WHERE order_date >= '${input.holdoutStartDate}'
          GROUP BY date ORDER BY date
        `);
        dayOfTest = postTest.length;

        if (postTest.length >= 1) {
          postTestAvg = {
            ordersPerDay: postTest.reduce((s, d) => s + d.orders, 0) / postTest.length,
            revPerDay: postTest.reduce((s, d) => s + d.revenue, 0) / postTest.length,
            gpPerDay: postTest.reduce((s, d) => s + d.gp, 0) / postTest.length,
            days: postTest.length,
          };

          // Decision logic per Step 10: only valid after day 14
          if (dayOfTest >= 14) {
            const ordersChange = (postTestAvg.ordersPerDay - baselineAvg.ordersPerDay) / baselineAvg.ordersPerDay;
            if (ordersChange >= -0.05) {
              decision = {
                outcome: `A. Non-incremental (${(ordersChange * 100).toFixed(1)}% vs baseline)`,
                action: 'Cut FB Cold permanently. Reallocate ~A$2,070/30d to PMax (Samsung) or Bing Shopping. Locks +A$3-4k/mo.',
                tier: 'reconciled',
              };
            } else if (ordersChange >= -0.15) {
              decision = {
                outcome: `B. Mild incremental (${(ordersChange * 100).toFixed(1)}% vs baseline)`,
                action: 'Restore FB Cold at HALF budget (~A$45/day = A$1,335/30d). Half cost, half contribution — net positive vs current full spend.',
                tier: 'inferred',
              };
            } else {
              decision = {
                outcome: `C. Strong incremental (${(ordersChange * 100).toFixed(1)}% vs baseline)`,
                action: 'Restore FB Cold at FULL budget. Accept platform attribution undercounts reality. Refocus optimization on reducing cost-per-purchase within Cold.',
                tier: 'inferred',
              };
            }
          }
        }
      }

      return {
        baseline: {
          window: baseline.length > 0 ? `${baseline[0].date} to ${baseline[baseline.length - 1].date}` : 'unavailable',
          avg: baselineAvg,
          gscBrandedAvg: gscBaseline[0]?.avg_clicks || 0,
          dayByDay: baseline,
        },
        postTest: input.holdoutStartDate ? {
          window: postTest.length > 0 ? `${postTest[0].date} to ${postTest[postTest.length - 1].date}` : 'no data yet',
          avg: postTestAvg,
          dayByDay: postTest,
          dayOfTest,
        } : null,
        decision,
        protocol: {
          campaign: 'Cold | TOF | 2 ad sets | DPA+Vids+image | Must creatives',
          duration: '14 days',
          method: 'Pause campaign in Meta Ads Manager (account act_14359173). Status: Off (not delete).',
          decisionMatrix: [
            { outcome: 'Non-incremental (within ±5%)', action: 'Cut FB Cold permanently' },
            { outcome: 'Mild incremental (-5 to -15%)', action: 'Restore at half budget' },
            { outcome: 'Strong incremental (>-15%)', action: 'Restore at full budget' },
            { outcome: 'Confounded (weather/AW change/holiday)', action: 'Re-run for 14 days clean' },
          ],
        },
      };
    }),
});
