import { z } from 'zod';
import { router, publicProcedure } from '../middleware';
import { runQuery } from '../lib/duckdb';

const TimeWindow = z.enum(['1m', '3m', '6m', '12m']);

function getDateFilter(window: string): string {
  const days = window === '1m' ? 30 : window === '3m' ? 90 : window === '6m' ? 180 : 365;
  return `CURRENT_DATE - INTERVAL '${days} days'`;
}

export const sourcesRouter = router({
  paidDaily: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const dateFilter = getDateFilter(input.window);

      const google = await runQuery<{ date: string; cost: number; clicks: number; conversions: number; revenue: number }>(`
        SELECT date, cost, clicks, conversions, conversions_value as revenue
        FROM fact_google_ads_daily
        WHERE date >= ${dateFilter}
        ORDER BY date
      `);

      const fb = await runQuery<{ date: string; cost: number; impressions: number; clicks: number; purchases: number; revenue: number }>(`
        SELECT date, cost, impressions, clicks as clicks, purchases, purchase_value as revenue
        FROM fact_facebook_ads_daily
        WHERE date >= ${dateFilter}
        ORDER BY date
      `);

      const bing = await runQuery<{ date: string; cost: number; impressions: number; clicks: number; conversions: number; revenue: number }>(`
        SELECT date, SUM(cost) as cost, SUM(impressions) as impressions, SUM(clicks) as clicks, SUM(conversions) as conversions, SUM(revenue) as revenue
        FROM fact_bing_ads_daily
        WHERE date >= ${dateFilter}
        GROUP BY date
        ORDER BY date
      `);

      return { google, facebook: fb, bing };
    }),

  searchConsole: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      if (input.window !== '1m') {
        return { daily: [], caveat: 'Search Console daily only available for 1m window; use 12m weekly for longer trends' };
      }
      const daily = await runQuery<{ date: string; branded: string; clicks: number; impressions: number; ctr: number; position: number }>(`
        SELECT date, branded, clicks, impressions, ctr, position
        FROM fact_search_console_daily
        ORDER BY date, branded
      `);
      return { daily };
    }),

  gmb: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const dateFilter = getDateFilter(input.window);
      const daily = await runQuery<{ date: string; total_views: number; views_on_search: number; views_on_maps: number; total_actions: number; phone_calls: number; directions_requests: number; website_visits: number }>(`
        SELECT
          date,
          SUM(total_views) as total_views,
          SUM(views_on_search) as views_on_search,
          SUM(views_on_maps) as views_on_maps,
          SUM(total_actions) as total_actions,
          SUM(phone_calls) as phone_calls,
          SUM(directions_requests) as directions_requests,
          SUM(website_visits) as website_visits
        FROM fact_gmb_daily
        WHERE date >= ${dateFilter}
        GROUP BY date
        ORDER BY date
      `);
      return { daily };
    }),

  brevo: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const dateFilter = getDateFilter(input.window);
      const campaigns = await runQuery<{
        campaign_name: string;
        sends: number;
        delivered: number;
        opens_unique: number;
        clicks_unique: number;
        open_rate: number;
        click_rate: number;
        unsubscribes: number;
      }>(`
        SELECT
          campaign_name,
          SUM(recipients) as sends,
          SUM(delivered) as delivered,
          SUM(opens_unique) as opens_unique,
          SUM(clicks_unique) as clicks_unique,
          SUM(opens_unique)::DOUBLE / NULLIF(SUM(delivered), 0) as open_rate,
          SUM(clicks_unique)::DOUBLE / NULLIF(SUM(delivered), 0) as click_rate,
          SUM(unsubscribes) as unsubscribes
        FROM fact_brevo_campaigns
        WHERE date >= ${dateFilter}
        GROUP BY campaign_name
        ORDER BY sends DESC
      `);

      const monthly = await runQuery<{
        month: string;
        campaigns: number;
        sends: number;
        opens: number;
        clicks: number;
        open_rate: number;
      }>(`
        SELECT
          strftime(date, '%Y-%m') as month,
          COUNT(DISTINCT campaign_name) as campaigns,
          SUM(recipients) as sends,
          SUM(opens_unique) as opens,
          SUM(clicks_unique) as clicks,
          SUM(opens_unique)::DOUBLE / NULLIF(SUM(delivered), 0) as open_rate
        FROM fact_brevo_campaigns
        WHERE date >= ${dateFilter}
        GROUP BY month
        ORDER BY month
      `);

      return { campaigns, monthly };
    }),

  cohortRetention: publicProcedure
    .query(async () => {
      // Build monthly cohorts from web orders by Email
      return runQuery<{
        cohort_month: string;
        cohort_size: number;
        month_0: number;
        month_1: number;
        month_2: number;
        month_3: number;
        month_6: number;
      }>(`
        WITH first_orders AS (
          SELECT Email, MIN(DATE_TRUNC('month', order_date)) as cohort_month
          FROM fact_web_orders
          WHERE Email IS NOT NULL AND Email != ''
          GROUP BY Email
        ),
        cohort_sizes AS (
          SELECT cohort_month, COUNT(*) as cohort_size
          FROM first_orders
          GROUP BY cohort_month
        ),
        orders_with_cohort AS (
          SELECT
            f.cohort_month,
            DATE_DIFF('month', f.cohort_month, DATE_TRUNC('month', o.order_date)) as months_since_first,
            o.Email
          FROM fact_web_orders o
          JOIN first_orders f ON o.Email = f.Email
        )
        SELECT
          cs.cohort_month,
          cs.cohort_size::INTEGER as cohort_size,
          COUNT(DISTINCT CASE WHEN owc.months_since_first = 0 THEN owc.Email END)::DOUBLE / cs.cohort_size as month_0,
          COUNT(DISTINCT CASE WHEN owc.months_since_first = 1 THEN owc.Email END)::DOUBLE / cs.cohort_size as month_1,
          COUNT(DISTINCT CASE WHEN owc.months_since_first = 2 THEN owc.Email END)::DOUBLE / cs.cohort_size as month_2,
          COUNT(DISTINCT CASE WHEN owc.months_since_first = 3 THEN owc.Email END)::DOUBLE / cs.cohort_size as month_3,
          COUNT(DISTINCT CASE WHEN owc.months_since_first = 6 THEN owc.Email END)::DOUBLE / cs.cohort_size as month_6
        FROM cohort_sizes cs
        LEFT JOIN orders_with_cohort owc ON cs.cohort_month = owc.cohort_month
        GROUP BY cs.cohort_month, cs.cohort_size
        HAVING cs.cohort_size >= 10
        ORDER BY cs.cohort_month DESC
        LIMIT 12
      `);
    }),

  webDaily: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const dateFilter = getDateFilter(input.window);
      return runQuery<{ date: string; orders: number; revenue: number; gp: number; aov: number }>(`
        SELECT
          DATE(order_date) as date,
          COUNT(*) as orders,
          SUM(total) as revenue,
          SUM(gp_imputed) as gp,
          AVG(total) as aov
        FROM fact_web_orders
        WHERE order_date >= ${dateFilter}
        GROUP BY date
        ORDER BY date
      `);
    }),

  storeDaily: publicProcedure
    .input(z.object({ window: TimeWindow }))
    .query(async ({ input }) => {
      const dateFilter = getDateFilter(input.window);
      return runQuery<{ date: string; orders: number; revenue: number; gp: number; aov: number }>(`
        SELECT
          DATE(order_date) as date,
          COUNT(*) as orders,
          SUM(total) as revenue,
          SUM(gross_profit) as gp,
          AVG(total) as aov
        FROM fact_store_orders
        WHERE order_date >= ${dateFilter}
        GROUP BY date
        ORDER BY date
      `);
    }),
});
