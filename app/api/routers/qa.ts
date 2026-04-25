import { router, publicProcedure } from '../middleware';
import { runQuery } from '../lib/duckdb';

export const qaRouter = router({
  dataAvailability: publicProcedure.query(async () => {
    const tables = [
      { name: 'fact_web_orders', label: 'CMS Web Orders', dateCol: 'order_date' },
      { name: 'fact_store_orders', label: 'Store POS Orders', dateCol: 'order_date' },
      { name: 'fact_store_refunds', label: 'Store Refunds', dateCol: 'refund_date' },
      { name: 'fact_google_ads_daily', label: 'Google Ads Daily', dateCol: 'date' },
      { name: 'fact_facebook_ads_daily', label: 'Facebook Ads Daily', dateCol: 'date' },
      { name: 'fact_bing_ads_daily', label: 'Bing Ads Daily', dateCol: 'date' },
      { name: 'fact_ga4_channel', label: 'GA4 Channel Summary', dateCol: null },
      { name: 'fact_search_console_daily', label: 'Search Console Daily', dateCol: 'date' },
      { name: 'fact_gmb_daily', label: 'GMB Daily', dateCol: 'date' },
      { name: 'fact_brevo_campaigns', label: 'Brevo Campaigns', dateCol: 'date' },
      { name: 'fact_pm_channel_gp', label: 'ProfitMetrics Channel GP', dateCol: null },
      { name: 'fact_pm_channel_revenue', label: 'ProfitMetrics Channel Revenue', dateCol: null },
    ];

    const results = [];
    for (const t of tables) {
      try {
        const dateSql = t.dateCol
          ? `MIN(${t.dateCol})::DATE as min_date, MAX(${t.dateCol})::DATE as max_date`
          : `NULL as min_date, NULL as max_date`;
        const row = await runQuery<{ count: number; min_date: string | null; max_date: string | null }>(`
          SELECT COUNT(*)::INTEGER as count, ${dateSql} FROM ${t.name}
        `);
        results.push({
          table: t.label,
          rows: row[0]?.count || 0,
          dateRange: row[0]?.min_date && row[0]?.max_date
            ? `${row[0].min_date} → ${row[0].max_date}`
            : t.dateCol ? 'No dates' : 'Aggregate only',
          status: row[0]?.count > 0 ? 'available' : 'empty',
        });
      } catch (e: any) {
        results.push({
          table: t.label,
          rows: 0,
          dateRange: 'Error',
          status: 'error',
          error: e.message,
        });
      }
    }

    return results;
  }),

  qualityFlags: publicProcedure.query(async () => {
    const flags = [];

    // GP imputation flag
    const gpImp = await runQuery<{ imputed_pct: number; imputed_count: number; total: number }>(`
      SELECT
        COUNT(CASE WHEN "Gross Profit" = 0 OR "Gross Profit" IS NULL THEN 1 END)::DOUBLE / COUNT(*) as imputed_pct,
        COUNT(CASE WHEN "Gross Profit" = 0 OR "Gross Profit" IS NULL THEN 1 END) as imputed_count,
        COUNT(*) as total
      FROM fact_web_orders
    `);
    flags.push({
      category: 'GP Imputation',
      status: gpImp[0]?.imputed_pct > 0.1 ? 'warn' : 'pass',
      message: `${(gpImp[0]?.imputed_pct * 100).toFixed(1)}% of web orders (${gpImp[0]?.imputed_count} / ${gpImp[0]?.total}) have imputed GP`,
      detail: 'Method: Brand × Condition median margin',
    });

    // Store refund unlinkability
    flags.push({
      category: 'Store Refunds',
      status: 'warn',
      message: 'Store refund Order IDs do not match store orders file',
      detail: 'Treat refunds as aggregate adjustment only; cannot link to individual orders',
    });

    // Platform over-attribution
    flags.push({
      category: 'Paid Attribution',
      status: 'warn',
      message: 'Platform-reported conversions sum to ~96% of CMS web revenue',
      detail: 'Severe double-counting expected. Use ProfitMetrics or CMS-derived ROAS for decisions.',
    });

    // Missing months
    flags.push({
      category: 'Coverage Gap',
      status: 'warn',
      message: 'CMS web history missing Jul–Nov 2025',
      detail: '5 months missing in 14-month span. 6m/12m comparisons are partial.',
    });

    // Accessory/repair GP caveat
    flags.push({
      category: 'Store Margin',
      status: 'warn',
      message: 'Store accessory/repair GP may be overstated',
      detail: 'Cost Price not tracked for many SKUs. Device margins (22.7%) are reliable.',
    });

    return flags;
  }),
});
