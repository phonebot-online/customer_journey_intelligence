import { router, publicProcedure } from '../middleware';
import { runQuery, initSchema, getDataPath } from '../lib/duckdb';
import fs from 'fs';

export const adminRouter = router({
  // List all loaded tables with row counts + most-recent dates + source file freshness
  dataSourceLedger: publicProcedure.query(async () => {
    const tables = [
      { table: 'fact_web_orders', label: 'CMS Web Orders', dateCol: 'order_date', file: '12_month/cms_manual/cms_orders_v4_with_refunds.csv' },
      { table: 'fact_store_orders', label: 'Store POS Orders', dateCol: 'order_date', file: '12_month/melbourne_store_sales/store_orders_full_history.csv' },
      { table: 'fact_store_refunds', label: 'Store Refunds', dateCol: 'refund_date', file: '12_month/melbourne_store_sales/store_refunds_full_history.csv' },
      { table: 'fact_google_ads_daily', label: 'Google Ads Daily', dateCol: 'date', file: '1_month/google_ads/account_daily_1m.csv' },
      { table: 'fact_facebook_ads_daily', label: 'Facebook Ads Daily', dateCol: 'date', file: '1_month/facebook_ads/account_daily_1m.csv' },
      { table: 'fact_bing_ads_daily', label: 'Bing Ads Daily', dateCol: 'date', file: '1_month/bing_ads/campaign_daily_1m.csv' },
      { table: 'fact_ga4_channel', label: 'GA4 Channel Summary', dateCol: null, file: '1_month/ga4/channel_summary_30d_AU.csv' },
      { table: 'fact_search_console_daily', label: 'Search Console Daily', dateCol: 'date', file: '1_month/search_console/branded_daily_1m.csv' },
      { table: 'fact_gmb_daily', label: 'GMB Daily', dateCol: 'date', file: '1_month/gmb/locations_daily_1m.csv' },
      { table: 'fact_brevo_campaigns', label: 'Brevo Campaigns', dateCol: 'date', file: '12_month/brevo/campaigns_12m.csv' },
      { table: 'fact_pm_channel_gp', label: 'ProfitMetrics Channel GP', dateCol: null, file: '1_month/profit_metrics/channel_gp_30d.csv' },
      { table: 'fact_pm_channel_revenue', label: 'ProfitMetrics Channel Rev', dateCol: null, file: '1_month/profit_metrics/channel_revenue_30d.csv' },
    ];

    const results = [];
    for (const t of tables) {
      try {
        const dateSql = t.dateCol ? `MAX(${t.dateCol})::DATE as max_date, MIN(${t.dateCol})::DATE as min_date` : `NULL as max_date, NULL as min_date`;
        const row = await runQuery<{ count: number; min_date: string | null; max_date: string | null }>(`
          SELECT COUNT(*)::INTEGER as count, ${dateSql} FROM ${t.table}
        `);
        let fileMtime: string | null = null;
        let fileSize = 0;
        let fileExists = false;
        try {
          const stat = fs.statSync(getDataPath(t.file));
          fileMtime = stat.mtime.toISOString().slice(0, 10);
          fileSize = stat.size;
          fileExists = true;
        } catch {}
        const ageDays = fileMtime ? Math.floor((Date.now() - new Date(fileMtime).getTime()) / 86400000) : null;
        results.push({
          table: t.label,
          rows: row[0]?.count || 0,
          minDate: row[0]?.min_date,
          maxDate: row[0]?.max_date,
          file: t.file,
          fileExists,
          fileLastModified: fileMtime,
          fileSize,
          ageDays,
          freshness: ageDays === null ? 'unknown' : ageDays === 0 ? 'today' : ageDays === 1 ? 'yesterday' : `${ageDays} days old`,
          status: !fileExists ? 'missing' : ageDays === null ? 'unknown' : ageDays > 14 ? 'stale' : ageDays > 7 ? 'aging' : 'fresh',
        });
      } catch (e: any) {
        results.push({ table: t.label, rows: 0, minDate: null, maxDate: null, file: t.file, fileExists: false, fileLastModified: null, fileSize: 0, ageDays: null, freshness: 'error', status: 'error', error: e.message });
      }
    }
    return results;
  }),

  // Re-init schema (re-reads CSVs into DuckDB without server restart)
  refreshSchema: publicProcedure.mutation(async () => {
    const start = Date.now();
    await initSchema();
    return { success: true, durationMs: Date.now() - start, refreshedAt: new Date().toISOString() };
  }),
});
