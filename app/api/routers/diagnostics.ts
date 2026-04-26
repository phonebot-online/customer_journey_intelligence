import { router, publicProcedure } from '../middleware';
import { runQuery } from '../lib/duckdb';

// Inventory restoration targets (locked from Step 8 product-cliff diagnosis)
const INVENTORY_TARGETS: Record<string, { sep25Monthly: number; collapsed: boolean }> = {
  MacBook: { sep25Monthly: 20700, collapsed: true },
  iPad: { sep25Monthly: 97567, collapsed: true },
  AirPods: { sep25Monthly: 7500, collapsed: true },
  Xiaomi: { sep25Monthly: 5964, collapsed: true },
  Huawei: { sep25Monthly: 1500, collapsed: true },
};

export const diagnosticsRouter = router({
  // 1. Brand × Condition mix-shift trend over months
  brandConditionMixShift: publicProcedure.query(async () => {
    const monthly = await runQuery<{
      month: string;
      brand: string;
      orders: number;
      revenue: number;
      gp: number;
      aov: number;
    }>(`
      SELECT
        strftime(order_date, '%Y-%m') as month,
        COALESCE(Brand, 'Unknown') as brand,
        COUNT(*)::INTEGER as orders,
        SUM(total)::DOUBLE as revenue,
        SUM(gp_imputed)::DOUBLE as gp,
        AVG(total)::DOUBLE as aov
      FROM fact_web_orders
      WHERE order_date >= CURRENT_DATE - INTERVAL '420 days'
      GROUP BY month, brand
      HAVING orders >= 5
      ORDER BY month, revenue DESC
    `);

    // Reshape: months × brands matrix
    const months = [...new Set(monthly.map(r => r.month))].sort();
    const brands = [...new Set(monthly.map(r => r.brand))];

    const revByMonth: Record<string, Record<string, number>> = {};
    const ordersByMonth: Record<string, Record<string, number>> = {};
    const aovByMonth: Record<string, Record<string, number>> = {};

    monthly.forEach(r => {
      revByMonth[r.month] = revByMonth[r.month] || {};
      ordersByMonth[r.month] = ordersByMonth[r.month] || {};
      aovByMonth[r.month] = aovByMonth[r.month] || {};
      revByMonth[r.month][r.brand] = r.revenue;
      ordersByMonth[r.month][r.brand] = r.orders;
      aovByMonth[r.month][r.brand] = r.aov;
    });

    // Time series with one row per month, columns per brand
    const revSeries = months.map(month => {
      const row: any = { month };
      brands.forEach(b => { row[b] = revByMonth[month]?.[b] || 0; });
      return row;
    });

    return { revSeries, brands, months };
  }),

  // 2. Refund rate by brand × month
  refundByBrandTime: publicProcedure.query(async () => {
    const monthly = await runQuery<{
      month: string;
      brand: string;
      orders: number;
      refunded: number;
      refund_rate: number;
      refund_revenue: number;
    }>(`
      SELECT
        strftime(order_date, '%Y-%m') as month,
        COALESCE(Brand, 'Unknown') as brand,
        COUNT(*)::INTEGER as orders,
        COUNT(CASE WHEN was_refunded THEN 1 END)::INTEGER as refunded,
        (COUNT(CASE WHEN was_refunded THEN 1 END)::DOUBLE / COUNT(*)) as refund_rate,
        COALESCE(SUM(CASE WHEN was_refunded THEN total END), 0)::DOUBLE as refund_revenue
      FROM fact_web_orders
      WHERE order_date >= CURRENT_DATE - INTERVAL '420 days'
      GROUP BY month, brand
      HAVING orders >= 10
      ORDER BY month, brand
    `);

    const months = [...new Set(monthly.map(r => r.month))].sort();
    const brands = [...new Set(monthly.map(r => r.brand))];

    const matrix: Record<string, Record<string, number>> = {};
    monthly.forEach(r => {
      matrix[r.month] = matrix[r.month] || {};
      matrix[r.month][r.brand] = r.refund_rate;
    });

    const series = months.map(month => {
      const row: any = { month };
      brands.forEach(b => { row[b] = matrix[month]?.[b] || null; });
      return row;
    });

    // Top high-refund brands (lifetime)
    const lifetime = await runQuery<{ brand: string; orders: number; refunded: number; refund_rate: number }>(`
      SELECT
        COALESCE(Brand, 'Unknown') as brand,
        COUNT(*)::INTEGER as orders,
        COUNT(CASE WHEN was_refunded THEN 1 END)::INTEGER as refunded,
        (COUNT(CASE WHEN was_refunded THEN 1 END)::DOUBLE / COUNT(*)) as refund_rate
      FROM fact_web_orders
      GROUP BY brand
      HAVING orders >= 30
      ORDER BY refund_rate DESC
    `);

    return { series, brands, months, lifetime };
  }),

  // 3. Inventory restoration tracker — categories that collapsed in Step 8 product-cliff
  inventoryTracker: publicProcedure.query(async () => {
    const monthly = await runQuery<{ month: string; brand: string; orders: number; revenue: number }>(`
      SELECT
        strftime(order_date, '%Y-%m') as month,
        COALESCE(Brand, 'Unknown') as brand,
        COUNT(*)::INTEGER as orders,
        COALESCE(SUM(total), 0)::DOUBLE as revenue
      FROM fact_web_orders
      WHERE order_date >= CURRENT_DATE - INTERVAL '420 days'
        AND COALESCE(Brand, 'Unknown') IN ('MacBook', 'iPad', 'AirPods', 'Xiaomi', 'Huawei')
      GROUP BY month, brand
      ORDER BY month
    `);

    const months = [...new Set(monthly.map(r => r.month))].sort();

    const categories = Object.keys(INVENTORY_TARGETS).map(brand => {
      const target = INVENTORY_TARGETS[brand];
      const series = months.map(m => {
        const row = monthly.find(r => r.month === m && r.brand === brand);
        return { month: m, revenue: row?.revenue || 0, orders: row?.orders || 0 };
      });
      const recentRev = series.slice(-1)[0]?.revenue || 0;
      const peak = Math.max(...series.map(s => s.revenue));
      return {
        brand,
        targetMonthly: target.sep25Monthly,
        recentRevenue: recentRev,
        peakRevenue: peak,
        gapVsPeak: peak - recentRev,
        recoveryPct: peak > 0 ? recentRev / peak : 0,
        series,
      };
    });

    const totalGap = categories.reduce((s, c) => s + c.gapVsPeak, 0);

    return { categories, totalGap, months };
  }),

  // 4. Geographic distribution — state + postcode
  geography: publicProcedure.query(async () => {
    // Web orders by state
    const webByState = await runQuery<{ state: string; orders: number; revenue: number; gp: number }>(`
      SELECT
        COALESCE(State, '(none)') as state,
        COUNT(*)::INTEGER as orders,
        COALESCE(SUM(total), 0)::DOUBLE as revenue,
        COALESCE(SUM(gp_imputed), 0)::DOUBLE as gp
      FROM fact_web_orders
      GROUP BY state
      ORDER BY revenue DESC
    `);

    // Top postcodes (web)
    const webByPostcode = await runQuery<{ postcode: string; state: string; orders: number; revenue: number }>(`
      SELECT
        postcode,
        COALESCE(State, '(none)') as state,
        COUNT(*)::INTEGER as orders,
        COALESCE(SUM(total), 0)::DOUBLE as revenue
      FROM fact_web_orders
      WHERE postcode IS NOT NULL AND postcode != ''
      GROUP BY postcode, state
      ORDER BY revenue DESC
      LIMIT 25
    `);

    // Store by postcode (Reservoir VIC = 3073)
    const storeByPostcode = await runQuery<{ postcode: string; orders: number; revenue: number; is_local: boolean }>(`
      SELECT
        postcode,
        COUNT(*)::INTEGER as orders,
        COALESCE(SUM(total), 0)::DOUBLE as revenue,
        (postcode IN ('3073', '3083', '3087', '3072')) as is_local
      FROM fact_store_orders
      WHERE postcode IS NOT NULL AND postcode != ''
      GROUP BY postcode
      ORDER BY revenue DESC
      LIMIT 30
    `);

    // Store local-vs-tourist split
    const storeSplit = await runQuery<{ is_local: boolean; orders: number; revenue: number }>(`
      SELECT
        (postcode IN ('3073', '3083', '3087', '3072')) as is_local,
        COUNT(*)::INTEGER as orders,
        COALESCE(SUM(total), 0)::DOUBLE as revenue
      FROM fact_store_orders
      WHERE postcode IS NOT NULL AND postcode != ''
      GROUP BY is_local
    `);

    return { webByState, webByPostcode, storeByPostcode, storeSplit };
  }),

  // 5. PM Unassigned investigation — what we know and don't
  unassignedInvestigation: publicProcedure.query(async () => {
    // Pull current Unassigned numbers
    const pm = await runQuery<{ revenue: number; gp: number; sessions: number; purchases: number }>(`
      SELECT
        COALESCE((SELECT revenue FROM fact_pm_channel_revenue WHERE channel = 'Unassigned'), 0)::DOUBLE as revenue,
        COALESCE((SELECT gp FROM fact_pm_channel_gp WHERE channel = 'Unassigned'), 0)::DOUBLE as gp,
        COALESCE((SELECT sessions FROM fact_pm_channel_revenue WHERE channel = 'Unassigned'), 0)::INTEGER as sessions,
        COALESCE((SELECT purchases FROM fact_pm_channel_revenue WHERE channel = 'Unassigned'), 0)::INTEGER as purchases
    `);

    const totalGp = await runQuery<{ total: number }>(`
      SELECT SUM(gp)::DOUBLE as total FROM fact_pm_channel_gp
    `);

    return {
      sessions: pm[0]?.sessions || 0,
      purchases: pm[0]?.purchases || 0,
      revenue: pm[0]?.revenue || 0,
      gp: pm[0]?.gp || 0,
      shareOfTotalGp: totalGp[0]?.total ? (pm[0]?.gp || 0) / totalGp[0].total : 0,
      hypotheses: [
        {
          hypothesis: 'Server-side checkout completions',
          evidence: '2,496 sessions but 315 purchases = 12.6% session→purchase rate (vs 1-3% typical). Suggests these are post-conversion server events, not anonymous traffic.',
          probability: 'High',
          test: 'Check ProfitMetrics setup: are server-side conversion events being logged without a session identifier?',
        },
        {
          hypothesis: 'Email-link clicks completing checkout via Direct',
          evidence: 'Brevo has 26k recipients/30d. Mobile email apps strip referrer headers. Click → direct visit → buy → no source attribution.',
          probability: 'High',
          test: 'Add UTM tagging to Brevo outbound links (Action Center P1). After 30 days, see if Email channel grows and Unassigned shrinks.',
        },
        {
          hypothesis: 'iOS/Safari Intelligent Tracking Prevention (ITP)',
          evidence: 'Apple devices = ~50% of AU mobile traffic. ITP truncates session data after 7 days; cross-domain tracking fails.',
          probability: 'Medium',
          test: 'Compare iOS vs Android share of Unassigned — needs GA4 deviceCategory join (not currently in PM property).',
        },
        {
          hypothesis: 'Buyback completion or trade-in flow',
          evidence: 'Phonebot has whatsapp buyback funnel. If buyback credits convert to purchases without session continuity, they would land in Unassigned.',
          probability: 'Medium',
          test: 'Check whether buyback completions trigger a CMS order with a specific source flag.',
        },
        {
          hypothesis: 'Bot or non-human conversion tracking error',
          evidence: 'Less likely but cannot rule out. Phonebot\'s purchase events have a known fbclid bug — might also affect other tracking.',
          probability: 'Low',
          test: 'Audit recent Unassigned conversions for plausibility (matching real CMS orders).',
        },
      ],
      knownNumbers: [
        { metric: 'Unassigned share of GP (1m)', value: '35.2%' },
        { metric: 'Unassigned share of GP (12m)', value: '~40%' },
        { metric: 'Sessions in Unassigned (30d)', value: '2,496' },
        { metric: 'Purchases in Unassigned (30d)', value: '315 (vs 720 CMS truth = 44%)' },
        { metric: 'Avg revenue per Unassigned purchase', value: 'A$478' },
        { metric: 'Implied AOV vs total CMS', value: 'A$478 vs A$528 — slightly lower (suggests email-amplified purchases of accessories?)' },
      ],
      draftEmail: `Subject: ProfitMetrics — clarification on "Unassigned" channel composition for Phonebot (account 488618020)

Hi ProfitMetrics support,

We're seeing approximately 35% of attributed gross profit landing in the "Unassigned" channel category for our Phonebot account (GA4 property 488618020 — Phonebot ProfitMetrics Gross Profit). At our current scale this is ~A$38k/month of GP that we cannot route to a specific channel.

Could you help us understand:

1. What event types or session conditions cause a conversion to land in Unassigned? Specifically:
   - Are server-side conversion API events without a sessionSourceMedium routed there?
   - Are email-link clicks where the mobile mail app strips the referrer header routed there?
   - Are conversions where the Apple ITP cookie expired before purchase routed there?

2. Is there a way to break down the Unassigned bucket in your reporting? E.g. by underlying event source, server vs client, or some flag we could expose?

3. Are there changes we could make to our pixel implementation, attribution model, or session expiry settings to reduce the Unassigned share?

For context, our Brevo email reach is ~26k recipients/30d with 24-26% open rate, and we have a known fbclid persistence bug on the Facebook Pixel side that we are working to fix — so we suspect a non-trivial portion of Unassigned is email/FB completions losing source attribution, but we want to confirm before allocating.

Thanks
[Phonebot]`,
    };
  }),

  // 6. Repeat by acquisition channel — best-effort, limited by no order-level UTM
  repeatByChannel: publicProcedure.query(async () => {
    // We have no order-level channel attribution. Best proxy:
    // - join CMS orders by Email
    // - first-time orders (per Email) attributed to whatever GA4 says about that month's channel mix
    // - assume the proportion of first-time buyers in each channel matches that month's channel mix
    // This is a weak proxy. Be very explicit about it.

    const cohorts = await runQuery<{ cohort_month: string; cohort_size: number; m1: number; m3: number; m6: number; m12: number }>(`
      WITH first_orders AS (
        SELECT Email, MIN(DATE_TRUNC('month', order_date)) as cohort_month
        FROM fact_web_orders
        WHERE Email IS NOT NULL AND Email != ''
        GROUP BY Email
      ),
      cohort_sizes AS (
        SELECT cohort_month, COUNT(*)::INTEGER as cohort_size FROM first_orders GROUP BY cohort_month
      ),
      orders_with_cohort AS (
        SELECT f.cohort_month, DATE_DIFF('month', f.cohort_month, DATE_TRUNC('month', o.order_date)) as months_since, o.Email
        FROM fact_web_orders o JOIN first_orders f ON o.Email = f.Email
      )
      SELECT
        cs.cohort_month,
        cs.cohort_size,
        (COUNT(DISTINCT CASE WHEN owc.months_since = 1 THEN owc.Email END)::DOUBLE / cs.cohort_size) as m1,
        (COUNT(DISTINCT CASE WHEN owc.months_since = 3 THEN owc.Email END)::DOUBLE / cs.cohort_size) as m3,
        (COUNT(DISTINCT CASE WHEN owc.months_since = 6 THEN owc.Email END)::DOUBLE / cs.cohort_size) as m6,
        (COUNT(DISTINCT CASE WHEN owc.months_since = 12 THEN owc.Email END)::DOUBLE / cs.cohort_size) as m12
      FROM cohort_sizes cs
      LEFT JOIN orders_with_cohort owc ON cs.cohort_month = owc.cohort_month
      GROUP BY cs.cohort_month, cs.cohort_size
      HAVING cs.cohort_size >= 30
      ORDER BY cs.cohort_month
    `);

    // For per-channel approximation, use GA4 channel summary as the most recent month's channel mix
    const channelMix = await runQuery<{ channel: string; sessions: number; purchases: number }>(`
      SELECT channel, sessions, purchases FROM fact_ga4_channel ORDER BY purchases DESC
    `);

    const totalPurch = channelMix.reduce((s, c) => s + c.purchases, 0);

    // If we assume each channel's repeat rate ≈ overall repeat rate (we have no better signal), all channels look identical
    // Be explicit that this is the limitation. Surface the total cohort + a "limitation" panel.
    return {
      cohorts,
      channelMix: channelMix.map(c => ({
        ...c,
        share: totalPurch > 0 ? c.purchases / totalPurch : 0,
      })),
      limitation: 'Cannot compute per-channel repeat rate from on-disk data. CMS orders have no utm_source/medium/campaign field, so we cannot tag a customer\'s ACQUISITION channel. Best we can do: show overall cohort retention + the channel mix of the most recent month as approximation.',
      whatWouldUnlockThis: [
        'Add UTM capture to CMS order records (see UTM implementation guide)',
        'Add Customer Match upload to Google Ads / Meta to retarget existing buyers (separate from attribution)',
        'BigQuery export of GA4 + join to CMS orders by user_pseudo_id (requires BigQuery setup)',
      ],
    };
  }),

  // 7. Multi-window comparison — paid efficiency at 1m/3m/6m/12m.
  // Uses LOCKED data points from cross_checks/step7_LOCKED_multiwindow_triangulation.md because the
  // current on-disk daily tables only hold 1m of data. CMS truth is computed live from web orders.
  multiWindowEfficiency: publicProcedure.query(async () => {
    // Locked Step 7 multi-window numbers (per platform, avg per day)
    const locked = [
      { window: '1m',  days: 30,  aw_spend: 637,  aw_efficiency: 2.49, fb_spend: 243, fb_efficiency: 0.08, bing_spend: 57,  bing_efficiency: 3.50 },
      { window: '3m',  days: 90,  aw_spend: 926,  aw_efficiency: 1.81, fb_spend: 260, fb_efficiency: 0.08, bing_spend: 65,  bing_efficiency: 3.20 },
      { window: '6m',  days: 180, aw_spend: 1242, aw_efficiency: 1.37, fb_spend: 317, fb_efficiency: 0.10, bing_spend: 70,  bing_efficiency: 3.10 },
      { window: '12m', days: 365, aw_spend: 1299, aw_efficiency: 1.27, fb_spend: 399, fb_efficiency: 0.09, bing_spend: 75,  bing_efficiency: 3.00 },
    ];

    // CMS truth from live data (this DOES span 12 months in fact_web_orders)
    const cms = await runQuery<{ window: string; cms_orders: number; cms_revenue: number; cms_gp: number }>(`
      WITH win AS (
        SELECT '1m' as window, 30 as days, CURRENT_DATE - INTERVAL '30 days' as start
        UNION ALL SELECT '3m', 90, CURRENT_DATE - INTERVAL '90 days'
        UNION ALL SELECT '6m', 180, CURRENT_DATE - INTERVAL '180 days'
        UNION ALL SELECT '12m', 365, CURRENT_DATE - INTERVAL '365 days'
      )
      SELECT
        w.window,
        COALESCE((SELECT COUNT(*)::DOUBLE / w.days FROM fact_web_orders WHERE order_date >= w.start), 0) as cms_orders,
        COALESCE((SELECT SUM(total) / w.days FROM fact_web_orders WHERE order_date >= w.start), 0)::DOUBLE as cms_revenue,
        COALESCE((SELECT SUM(gp_imputed) / w.days FROM fact_web_orders WHERE order_date >= w.start), 0)::DOUBLE as cms_gp
      FROM win w
      ORDER BY w.days
    `);

    return locked.map(l => {
      const cmsRow = cms.find(c => c.window === l.window) || { cms_orders: 0, cms_revenue: 0, cms_gp: 0 };
      return {
        ...l,
        cms_orders: cmsRow.cms_orders,
        cms_revenue: cmsRow.cms_revenue,
        cms_gp: cmsRow.cms_gp,
        aw_net_per_day: l.aw_spend * (l.aw_efficiency - 1),
        fb_net_per_day: l.fb_spend * (l.fb_efficiency - 1),
        bing_net_per_day: l.bing_spend * (l.bing_efficiency - 1),
      };
    });
  }),
});
