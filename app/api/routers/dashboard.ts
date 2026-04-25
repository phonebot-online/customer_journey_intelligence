import { z } from 'zod';
import { router, publicProcedure } from '../middleware';
import { runQuery } from '../lib/duckdb';

const TimeWindow = z.enum(['1m', '3m', '6m', '12m']);

function getWindowDays(window: string): number {
  switch (window) {
    case '1m': return 30;
    case '3m': return 90;
    case '6m': return 180;
    case '12m': return 365;
    default: return 30;
  }
}

function getDateFilter(window: string): string {
  const days = getWindowDays(window);
  return `CURRENT_DATE - INTERVAL '${days} days'`;
}

export const dashboardRouter = router({
  ceoSummary: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const dateFilter = getDateFilter(input.window);

      const web = await runQuery<{ orders: number; revenue: number; gp: number; aov: number }>(`
        SELECT
          COUNT(*)::INTEGER as orders,
          SUM(total) as revenue,
          SUM(gp_imputed) as gp,
          AVG(total) as aov
        FROM fact_web_orders
        WHERE order_date >= ${dateFilter}
      `);

      const store = await runQuery<{ orders: number; revenue: number; gp: number; aov: number }>(`
        SELECT
          COUNT(*)::INTEGER as orders,
          SUM(total) as revenue,
          SUM(gross_profit) as gp,
          AVG(total) as aov
        FROM fact_store_orders
        WHERE order_date >= ${dateFilter}
      `);

      const adSpend = await runQuery<{ spend: number }>(`
        SELECT COALESCE(SUM(cost), 0) as spend FROM fact_google_ads_daily WHERE date >= ${dateFilter}
      `);
      const fbSpend = await runQuery<{ spend: number }>(`
        SELECT COALESCE(SUM(cost), 0) as spend FROM fact_facebook_ads_daily WHERE date >= ${dateFilter}
      `);
      const bingSpend = await runQuery<{ spend: number }>(`
        SELECT COALESCE(SUM(cost), 0) as spend FROM fact_bing_ads_daily WHERE date >= ${dateFilter}
      `);

      const webRefunds = await runQuery<{ refund_rate: number; refund_count: number }>(`
        SELECT
          COUNT(CASE WHEN was_refunded THEN 1 END)::DOUBLE / COUNT(*) as refund_rate,
          COUNT(CASE WHEN was_refunded THEN 1 END)::INTEGER as refund_count
        FROM fact_web_orders
        WHERE order_date >= ${dateFilter}
      `);

      const totalRevenue = (web[0]?.revenue || 0) + (store[0]?.revenue || 0);
      const totalGP = (web[0]?.gp || 0) + (store[0]?.gp || 0);
      const totalAdSpend = (adSpend[0]?.spend || 0) + (fbSpend[0]?.spend || 0) + (bingSpend[0]?.spend || 0);

      return {
        webOrders: web[0]?.orders || 0,
        webRevenue: web[0]?.revenue || 0,
        webGP: web[0]?.gp || 0,
        webAOV: web[0]?.aov || 0,
        storeOrders: store[0]?.orders || 0,
        storeRevenue: store[0]?.revenue || 0,
        storeGP: store[0]?.gp || 0,
        storeAOV: store[0]?.aov || 0,
        totalRevenue,
        totalGP,
        blendedMargin: totalRevenue > 0 ? totalGP / totalRevenue : 0,
        totalAdSpend,
        roas: totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0,
        webRefundRate: webRefunds[0]?.refund_rate || 0,
        webRefundCount: webRefunds[0]?.refund_count || 0,
      };
    }),

  weeklyTrend: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const dateFilter = getDateFilter(input.window);

      const webTrend = await runQuery<{ week: string; orders: number; revenue: number; gp: number }>(`
        SELECT
          strftime(order_date, '%Y-%W') as week,
          COUNT(*) as orders,
          SUM(total) as revenue,
          SUM(gp_imputed) as gp
        FROM fact_web_orders
        WHERE order_date >= ${dateFilter}
        GROUP BY week
        ORDER BY week
      `);

      const storeTrend = await runQuery<{ week: string; orders: number; revenue: number; gp: number }>(`
        SELECT
          strftime(order_date, '%Y-%W') as week,
          COUNT(*) as orders,
          SUM(total) as revenue,
          SUM(gross_profit) as gp
        FROM fact_store_orders
        WHERE order_date >= ${dateFilter}
        GROUP BY week
        ORDER BY week
      `);

      const adTrend = await runQuery<{ week: string; spend: number }>(`
        SELECT
          strftime(date, '%Y-%W') as week,
          SUM(cost) as spend
        FROM (
          SELECT date, cost FROM fact_google_ads_daily
          UNION ALL
          SELECT date, cost FROM fact_facebook_ads_daily
          UNION ALL
          SELECT date, cost FROM fact_bing_ads_daily
        )
        WHERE date >= ${dateFilter}
        GROUP BY week
        ORDER BY week
      `);

      return { webTrend, storeTrend, adTrend };
    }),

  channelMix: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      // Only 1m has ProfitMetrics channel data; others return placeholder
      if (input.window !== '1m') {
        return { channels: [], caveat: 'Channel-level profit data only available for 1m window' };
      }

      const channels = await runQuery<{
        channel: string;
        sessions: number;
        purchases: number;
        revenue: number;
        gp: number;
        margin: number;
      }>(`
        SELECT
          r.channel,
          r.sessions,
          r.purchases,
          r.revenue,
          g.gp,
          CASE WHEN r.revenue > 0 THEN g.gp / r.revenue ELSE 0 END as margin
        FROM fact_pm_channel_revenue r
        JOIN fact_pm_channel_gp g ON r.channel = g.channel
        ORDER BY g.gp DESC
      `);

      const totalGP = channels.reduce((s, c) => s + (c.gp || 0), 0);
      const totalRev = channels.reduce((s, c) => s + (c.revenue || 0), 0);

      return {
        channels: channels.map(c => ({
          ...c,
          gpShare: totalGP > 0 ? c.gp / totalGP : 0,
          revShare: totalRev > 0 ? c.revenue / totalRev : 0,
        })),
        totalGP,
        totalRev,
      };
    }),

  platformClaimVsCMS: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const dateFilter = getDateFilter(input.window);

      const cmsRev = await runQuery<{ revenue: number }>(`
        SELECT SUM(total) as revenue FROM fact_web_orders WHERE order_date >= ${dateFilter}
      `);

      const google = await runQuery<{ spend: number; claimed_rev: number }>(`
        SELECT SUM(cost) as spend, SUM(conversions_value) as claimed_rev FROM fact_google_ads_daily WHERE date >= ${dateFilter}
      `);

      const fb = await runQuery<{ spend: number; claimed_rev: number }>(`
        SELECT SUM(cost) as spend, SUM(purchase_value) as claimed_rev FROM fact_facebook_ads_daily WHERE date >= ${dateFilter}
      `);

      const bing = await runQuery<{ spend: number; claimed_rev: number }>(`
        SELECT SUM(cost) as spend, SUM(revenue) as claimed_rev FROM fact_bing_ads_daily WHERE date >= ${dateFilter}
      `);

      const cmsRevenue = cmsRev[0]?.revenue || 0;

      return [
        {
          channel: 'Google Ads',
          spend: google[0]?.spend || 0,
          platformClaimedRev: google[0]?.claimed_rev || 0,
          cmsDerivedROAS: google[0]?.spend > 0 ? (google[0]?.claimed_rev || 0) / google[0]?.spend : 0,
          claimRatio: cmsRevenue > 0 ? (google[0]?.claimed_rev || 0) / cmsRevenue : 0,
        },
        {
          channel: 'Facebook',
          spend: fb[0]?.spend || 0,
          platformClaimedRev: fb[0]?.claimed_rev || 0,
          cmsDerivedROAS: fb[0]?.spend > 0 ? (fb[0]?.claimed_rev || 0) / fb[0]?.spend : 0,
          claimRatio: cmsRevenue > 0 ? (fb[0]?.claimed_rev || 0) / cmsRevenue : 0,
        },
        {
          channel: 'Bing',
          spend: bing[0]?.spend || 0,
          platformClaimedRev: bing[0]?.claimed_rev || 0,
          cmsDerivedROAS: bing[0]?.spend > 0 ? (bing[0]?.claimed_rev || 0) / bing[0]?.spend : 0,
          claimRatio: cmsRevenue > 0 ? (bing[0]?.claimed_rev || 0) / cmsRevenue : 0,
        },
      ];
    }),

  refundByBrand: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const dateFilter = getDateFilter(input.window);
      return runQuery<{
        brand: string;
        orders: number;
        refunded: number;
        refund_rate: number;
      }>(`
        SELECT
          COALESCE(Brand, 'Unknown') as brand,
          COUNT(*) as orders,
          COUNT(CASE WHEN was_refunded THEN 1 END) as refunded,
          COUNT(CASE WHEN was_refunded THEN 1 END)::DOUBLE / COUNT(*) as refund_rate
        FROM fact_web_orders
        WHERE order_date >= ${dateFilter}
        GROUP BY brand
        HAVING COUNT(*) >= 10
        ORDER BY refund_rate DESC
      `);
    }),

  gpImputationStats: publicProcedure
    .query(async () => {
      return runQuery<{
        total_orders: number;
        imputed_orders: number;
        imputed_pct: number;
        avg_actual_gp: number;
        avg_imputed_gp: number;
      }>(`
        SELECT
          COUNT(*) as total_orders,
          COUNT(CASE WHEN "Gross Profit" = 0 OR "Gross Profit" IS NULL THEN 1 END) as imputed_orders,
          COUNT(CASE WHEN "Gross Profit" = 0 OR "Gross Profit" IS NULL THEN 1 END)::DOUBLE / COUNT(*) as imputed_pct,
          AVG(CASE WHEN "Gross Profit" > 0 THEN "Gross Profit" END) as avg_actual_gp,
          AVG(CASE WHEN "Gross Profit" = 0 OR "Gross Profit" IS NULL THEN gp_imputed END) as avg_imputed_gp
        FROM fact_web_orders
      `);
    }),
});
