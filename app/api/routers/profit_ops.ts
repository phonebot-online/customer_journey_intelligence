import { z } from 'zod';
import { router, publicProcedure } from '../middleware';
import { runQuery } from '../lib/duckdb';
import { bqQuery, bqAvailable } from '../lib/bq';

// Profit Ops — analyses targeted at finding waste and lifting net profit.
// Each procedure stays self-contained so the dashboard can render any subset on demand.

export const profitOpsRouter = router({
  // 1. Branded search cannibalization audit.
  // Premise: a chunk of paid clicks on branded queries ("phonebot", "phonebot reservoir", etc.)
  // would have arrived organically anyway. Industry estimates: 70-90% of branded paid clicks
  // are recoverable as organic if you pause. We expose paid spend on branded campaigns,
  // organic branded clicks, and a recovery-rate slider's worth of waste.
  brandedCannibalization: publicProcedure
    .input(z.object({ recoveryRate: z.number().min(0).max(1).default(0.8) }).optional())
    .query(async ({ input }) => {
      const recoveryRate = input?.recoveryRate ?? 0.8;

      // Paid branded campaigns (heuristic: name contains "(B)" or "Phonebot" without "PMax")
      const paidBranded = await runQuery<{
        campaign: string; source_medium: string; sessions: number; purchases: number; revenue: number; gp: number;
      }>(`
        WITH rev AS (
          SELECT campaign, source_medium, sessions, purchases, revenue
          FROM fact_pm_campaign_revenue
          WHERE source_medium LIKE '%cpc%'
            AND (campaign LIKE '%(B)%' OR LOWER(campaign) LIKE '%brand%' OR LOWER(campaign) LIKE '%phonebot (b)%')
        ),
        gp AS (
          SELECT campaign, source_medium, gp
          FROM fact_pm_campaign_gp
          WHERE source_medium LIKE '%cpc%'
            AND (campaign LIKE '%(B)%' OR LOWER(campaign) LIKE '%brand%' OR LOWER(campaign) LIKE '%phonebot (b)%')
        )
        SELECT rev.campaign, rev.source_medium, rev.sessions, rev.purchases, rev.revenue, COALESCE(gp.gp, 0) as gp
        FROM rev LEFT JOIN gp ON rev.campaign = gp.campaign AND rev.source_medium = gp.source_medium
        ORDER BY rev.revenue DESC
      `);

      // Total Google Ads spend last 30d (account-level — we don't have campaign-level cost in PM)
      const adSpend = await runQuery<{ total_cost: number; total_conv_value: number }>(`
        SELECT
          SUM(cost)::DOUBLE as total_cost,
          SUM(conversions_value)::DOUBLE as total_conv_value
        FROM fact_google_ads_daily
      `);

      // Branded campaign cost share — proxy via ProfitMetrics revenue share applied to total spend.
      // (PM doesn't expose cost. Best signal we have without a campaign-level cost CSV.)
      const allCpc = await runQuery<{ total_revenue: number; total_gp: number }>(`
        SELECT
          SUM(revenue)::DOUBLE as total_revenue,
          (SELECT SUM(gp) FROM fact_pm_campaign_gp WHERE source_medium LIKE '%cpc%')::DOUBLE as total_gp
        FROM fact_pm_campaign_revenue
        WHERE source_medium LIKE '%cpc%'
      `);

      const brandedRevenue = paidBranded.reduce((s, r) => s + r.revenue, 0);
      const brandedGp = paidBranded.reduce((s, r) => s + r.gp, 0);
      const totalCpcRevenue = allCpc[0]?.total_revenue || 0;
      const revenueShare = totalCpcRevenue > 0 ? brandedRevenue / totalCpcRevenue : 0;
      const estimatedBrandedSpend = (adSpend[0]?.total_cost || 0) * revenueShare;

      // Organic branded clicks last 30d for context
      const organicBranded = await runQuery<{ branded_clicks: number; nonbranded_clicks: number; unknown_clicks: number }>(`
        SELECT
          COALESCE(SUM(CASE WHEN branded = 'branded' THEN clicks END), 0)::INTEGER as branded_clicks,
          COALESCE(SUM(CASE WHEN branded = 'non-branded' THEN clicks END), 0)::INTEGER as nonbranded_clicks,
          COALESCE(SUM(CASE WHEN branded = '(unknown)' THEN clicks END), 0)::INTEGER as unknown_clicks
        FROM fact_search_console_daily
      `);

      // Top branded queries (organic) — to confirm there's healthy organic demand to capture
      const topQueries = await runQuery<{ query: string; clicks: number; impressions: number; position: number }>(`
        SELECT query, clicks, impressions, position
        FROM fact_sc_top_queries
        WHERE branded = 'branded'
        ORDER BY clicks DESC
        LIMIT 10
      `);

      // Waste estimate
      const wasteAnnualised = estimatedBrandedSpend * recoveryRate * 12;

      return {
        paidBranded,
        estimatedBrandedSpend30d: estimatedBrandedSpend,
        revenueShare,
        brandedRevenue,
        brandedGp,
        organicBranded: organicBranded[0],
        topQueries,
        wasteEstimateMonthly: estimatedBrandedSpend * recoveryRate,
        wasteEstimateAnnual: wasteAnnualised,
        recoveryRate,
        method: 'Branded campaign cost estimated by applying ProfitMetrics revenue-share of branded campaigns to total Google Ads spend (no per-campaign cost in CSVs). Recovery rate is industry default 0.7-0.9 — slide to your assumption.',
        validation: 'To confirm: run a 2-week geo holdout. Pause branded campaigns in one Australian state, leave on in another. Compare total revenue (paid + organic). Real recovery rate falls out of the comparison.',
      };
    }),

  // 2. Out-of-stock spend leak detector.
  // Crosses brand-level GMC stock against Shopping ad spend. SKU-level join is blocked
  // (GMC snapshot has no offer_id). Brand-level still surfaces obvious leaks.
  oosSpendLeak: publicProcedure
    .input(z.object({ window: z.enum(['7d', '30d']).default('30d') }).optional())
    .query(async ({ input }) => {
      const win = input?.window ?? '30d';
      const table = win === '7d' ? 'fact_aw_shopping_sku_7d' : 'fact_aw_shopping_sku';

      // Per-brand: spend, conversion rate, GMC in-stock %
      const byBrand = await runQuery<{
        brand: string;
        spend: number; clicks: number; impressions: number; conversions: number; conversion_value: number;
        gmc_total: number; gmc_in_stock: number; gmc_oos: number; in_stock_pct: number;
        ctr: number; cvr: number; roas: number;
        estimated_oos_waste: number;
      }>(`
        WITH aw AS (
          SELECT LOWER(brand) as brand,
                 SUM(cost)::DOUBLE as spend,
                 SUM(clicks)::INTEGER as clicks,
                 SUM(impressions)::INTEGER as impressions,
                 SUM(conversions)::DOUBLE as conversions,
                 SUM(conversion_value)::DOUBLE as conversion_value
          FROM ${table}
          WHERE cost > 0
          GROUP BY LOWER(brand)
        ),
        gmc AS (
          SELECT LOWER(brand) as brand,
                 COUNT(*)::INTEGER as total,
                 COUNT(CASE WHEN availability = 'in stock' THEN 1 END)::INTEGER as in_stock,
                 COUNT(CASE WHEN availability != 'in stock' THEN 1 END)::INTEGER as oos
          FROM fact_gmc_products GROUP BY LOWER(brand)
        )
        SELECT
          aw.brand,
          aw.spend, aw.clicks, aw.impressions, aw.conversions, aw.conversion_value,
          COALESCE(gmc.total, 0) as gmc_total,
          COALESCE(gmc.in_stock, 0) as gmc_in_stock,
          COALESCE(gmc.oos, 0) as gmc_oos,
          CASE WHEN gmc.total > 0 THEN gmc.in_stock::DOUBLE / gmc.total ELSE NULL END as in_stock_pct,
          CASE WHEN aw.impressions > 0 THEN aw.clicks::DOUBLE / aw.impressions ELSE 0 END as ctr,
          CASE WHEN aw.clicks > 0 THEN aw.conversions / aw.clicks ELSE 0 END as cvr,
          CASE WHEN aw.spend > 0 THEN aw.conversion_value / aw.spend ELSE 0 END as roas,
          -- Crude estimate: ad dollars going to OOS-heavy brand pages.
          -- Caveat: Google should suppress OOS, so this is wasted impression $$ from feed lag, not 100% literal.
          CASE
            WHEN gmc.total >= 5 AND aw.spend > 0
            THEN aw.spend * (1 - (gmc.in_stock::DOUBLE / NULLIF(gmc.total, 0)))
            ELSE 0
          END as estimated_oos_waste
        FROM aw INNER JOIN gmc ON aw.brand = gmc.brand
        WHERE aw.spend > 0
        ORDER BY estimated_oos_waste DESC
      `);

      const totalSpend = byBrand.reduce((s, r) => s + r.spend, 0);
      const totalEstimatedWaste = byBrand.reduce((s, r) => s + (r.estimated_oos_waste || 0), 0);

      // Brands with strong OOS exposure (in_stock < 50%) and meaningful spend ($50+)
      const flagged = byBrand.filter(r => r.in_stock_pct !== null && r.in_stock_pct < 0.5 && r.spend > 50);

      return {
        byBrand,
        flagged,
        totalSpend,
        totalEstimatedWaste,
        wastePctOfSpend: totalSpend > 0 ? totalEstimatedWaste / totalSpend : 0,
        window: win,
        limitations: [
          'GMC snapshot lacks offer_id, blocking SKU-level stock × ad-spend joins. Brand-level only.',
          'Google Shopping should auto-suppress OOS items, so "waste" is feed-lag waste, not impressions to literal OOS pages. Conservative estimate.',
          'A SKU-level fix requires re-exporting GMC with `offer_id` (which is the same Id as Shopping `OfferId`).',
        ],
      };
    }),

  // 3. SKU "should-not-advertise" with aging-inventory holding-cost model.
  // For each SKU compute: estimated GP from ads = conv_value × brand_margin% — ad_spend.
  // If GP < 0 → on its face, stop advertising.
  // BUT: aging inventory has depreciation cost. Holding longer = market price drops + capital tied up.
  // Decision: pause if (ad spend saved) > (depreciation cost during extra weeks-to-sell without ads).
  shouldNotAdvertise: publicProcedure
    .input(z.object({
      window: z.enum(['7d', '30d']).default('30d'),
      monthlyDepreciationPct: z.number().min(0).max(0.2).default(0.025),  // 2.5%/mo for refurb electronics
      organicVelocityRatio: z.number().min(0).max(1).default(0.4),         // % of sales that'd happen organically without ads
      minSpend: z.number().default(30),
    }).optional())
    .query(async ({ input }) => {
      const win = input?.window ?? '30d';
      const depPct = input?.monthlyDepreciationPct ?? 0.025;
      const orgVel = input?.organicVelocityRatio ?? 0.4;
      const minSpend = input?.minSpend ?? 30;
      const table = win === '7d' ? 'fact_aw_shopping_sku_7d' : 'fact_aw_shopping_sku';
      const days = win === '7d' ? 7 : 30;

      // SKU-level economics. Margin% from agg_brand_margin (web orders 180d, refund-net).
      const skus = await runQuery<{
        offer_id: string; title: string; brand: string; campaign_name: string;
        spend: number; clicks: number; impressions: number; conversions: number; conversion_value: number;
        margin_pct: number; estimated_gp_from_ads: number; net_profit_from_ads: number;
        cost_per_conversion: number; estimated_avg_price: number;
        sales_per_day_with_ads: number; sales_per_day_without_ads: number;
        days_to_sell_remaining_without_ads_per_unit: number;
        depreciation_cost_per_month_per_unit: number;
        decision: string; decision_reason: string;
        net_savings_if_paused_per_month: number;
      }>(`
        WITH base AS (
          SELECT
            s.offer_id, s.title, LOWER(s.brand) as brand, s.campaign_name,
            s.cost as spend, s.clicks, s.impressions, s.conversions, s.conversion_value,
            COALESCE(m.margin_pct, 0.10) as margin_pct,  -- fall back to 10% if brand has no signal
            CASE WHEN s.conversions > 0 THEN s.conversion_value / s.conversions ELSE 0 END as estimated_avg_price,
            s.conversions / ${days}.0 as sales_per_day_with_ads
          FROM ${table} s
          LEFT JOIN agg_brand_margin m ON LOWER(s.brand) = m.brand
          WHERE s.cost >= ${minSpend}
        )
        SELECT
          *,
          conversion_value * margin_pct as estimated_gp_from_ads,
          (conversion_value * margin_pct) - spend as net_profit_from_ads,
          CASE WHEN conversions > 0 THEN spend / conversions ELSE NULL END as cost_per_conversion,
          sales_per_day_with_ads * ${orgVel} as sales_per_day_without_ads,
          -- if 1 unit sells per day with ads, organic alone sells 0.4/day → 1 unit takes 1/0.4=2.5 days
          CASE
            WHEN sales_per_day_with_ads > 0 AND ${orgVel} > 0
            THEN (1.0 / (sales_per_day_with_ads * ${orgVel})) - (1.0 / sales_per_day_with_ads)
            ELSE NULL
          END as days_to_sell_remaining_without_ads_per_unit,
          estimated_avg_price * ${depPct} as depreciation_cost_per_month_per_unit,
          -- pause savings monthly = ad spend × (30/window_days)
          (spend * 30.0 / ${days}) as ad_spend_per_month,
          CASE
            WHEN sales_per_day_with_ads > 0 AND ${orgVel} > 0
            THEN
              (spend * 30.0 / ${days})
              - (estimated_avg_price * ${depPct} * sales_per_day_with_ads * 30
                  * ((1.0 / (sales_per_day_with_ads * ${orgVel})) - (1.0 / sales_per_day_with_ads)) / 30)
            ELSE (spend * 30.0 / ${days})
          END as net_savings_if_paused_per_month,
          CASE
            -- Hard pause: net profit from ads is negative AND depreciation cost is small
            WHEN ((conversion_value * margin_pct) - spend) < -${minSpend}/2
              THEN 'PAUSE'
            -- Reduce: marginally negative, can probably bid-cap
            WHEN ((conversion_value * margin_pct) - spend) < 0
              THEN 'REDUCE_BIDS'
            -- Net positive, but ROAS suggests overspending — diminishing returns territory
            WHEN spend > 0 AND (conversion_value / spend) < 2.0
              THEN 'OPTIMIZE_BIDS'
            ELSE 'KEEP'
          END as decision,
          CASE
            WHEN ((conversion_value * margin_pct) - spend) < -${minSpend}/2
              THEN 'Ad spend exceeds estimated GP from ad-driven sales — money is leaving the building.'
            WHEN ((conversion_value * margin_pct) - spend) < 0
              THEN 'Marginally negative. Lower bids or restrict to high-intent keywords; full pause may forfeit organic-pull benefits.'
            WHEN spend > 0 AND (conversion_value / spend) < 2.0
              THEN 'Sub-2x ROAS. Likely diminishing returns at current bid; cap CPC and let the auction tell you.'
            ELSE 'Profitable on ads. Keep running.'
          END as decision_reason
        FROM base
        ORDER BY net_profit_from_ads ASC
      `);

      // Aging-inventory override: if SKU is loss-making but pausing has high depreciation cost, KEEP
      const enriched = skus.map(s => {
        if (s.decision === 'PAUSE' && s.net_savings_if_paused_per_month < 0) {
          // Depreciation cost during slower-organic-selling exceeds ad savings → keep paying for ads
          return {
            ...s,
            decision: 'KEEP_DESPITE_LOSS',
            decision_reason: `Counter-intuitive but math checks out: pausing saves $${s.spend * 30 / days | 0}/mo in ad spend, but slowing sales velocity by ${(1 - orgVel) * 100 | 0}% triggers ${s.depreciation_cost_per_month_per_unit ? '$' + (s.depreciation_cost_per_month_per_unit | 0) + '/mo/unit' : ''} in market-price depreciation. Net of holding cost, ads are cheaper than waiting.`,
          };
        }
        return s;
      });

      // Aggregate decision summary
      const summary = {
        pause: enriched.filter(s => s.decision === 'PAUSE'),
        reduce: enriched.filter(s => s.decision === 'REDUCE_BIDS'),
        optimize: enriched.filter(s => s.decision === 'OPTIMIZE_BIDS'),
        keep: enriched.filter(s => s.decision === 'KEEP'),
        keepDespiteLoss: enriched.filter(s => s.decision === 'KEEP_DESPITE_LOSS'),
      };

      const totalPauseSavings = summary.pause.reduce((s, r) => s + r.net_savings_if_paused_per_month, 0);
      const totalReduceSavings = summary.reduce.reduce((s, r) => s + Math.max(0, -r.net_profit_from_ads), 0) * 30 / days;

      return {
        skus: enriched.slice(0, 200),  // cap UI
        summary: {
          pauseCount: summary.pause.length,
          reduceCount: summary.reduce.length,
          optimizeCount: summary.optimize.length,
          keepCount: summary.keep.length,
          keepDespiteLossCount: summary.keepDespiteLoss.length,
          totalSpendAnalysed: enriched.reduce((s, r) => s + r.spend, 0),
          estimatedMonthlySavings: totalPauseSavings + totalReduceSavings,
        },
        assumptions: {
          monthlyDepreciationPct: depPct,
          organicVelocityRatio: orgVel,
          minSpend,
          window: win,
          fallbackMarginPct: 0.10,
          marginSource: 'agg_brand_margin (web orders, last 180d, refund-net)',
        },
        caveats: [
          'GP per SKU estimated as (Shopping conversion_value) × (brand-level margin%). Real margin per SKU varies by condition grade, age, and stock cost — this is a directional estimate.',
          'Organic velocity assumed at 40% of paid velocity. Calibrate this with a 2-week SKU-level pause test on a non-critical SKU.',
          'Depreciation rate of 2.5%/month applies broadly to refurb electronics. Override per-category if you have better numbers.',
          'Diminishing-returns boundary at 2x ROAS is heuristic. The real number depends on your blended margin and overhead.',
        ],
      };
    }),

  // 4. Anomaly detection — z-score-based daily metric monitoring across ad + sales tables.
  // For each metric: compute trailing 28d mean & stddev (excluding today), z-score for today,
  // flag |z| > 2.
  anomalyScan: publicProcedure
    .input(z.object({ zThreshold: z.number().default(2.0) }).optional())
    .query(async ({ input }) => {
      const z = input?.zThreshold ?? 2.0;

      const anomalies = await runQuery<{
        date: string; channel: string; metric: string;
        value: number; mean: number; stddev: number; z_score: number;
        deviation_pct: number;
      }>(`
        WITH unioned AS (
          -- Google Ads
          SELECT date, 'Google Ads' as channel, 'cost' as metric, cost as value FROM fact_google_ads_daily_3m
          UNION ALL SELECT date, 'Google Ads', 'conversions', conversions FROM fact_google_ads_daily_3m
          UNION ALL SELECT date, 'Google Ads', 'conv_value', conversions_value FROM fact_google_ads_daily_3m
          UNION ALL SELECT date, 'Google Ads', 'roas',
            CASE WHEN cost > 0 THEN conversions_value / cost ELSE 0 END
            FROM fact_google_ads_daily_3m WHERE cost > 0

          -- Facebook
          UNION ALL SELECT date, 'Facebook', 'cost', cost FROM fact_facebook_ads_daily_3m
          UNION ALL SELECT date, 'Facebook', 'purchases', purchases FROM fact_facebook_ads_daily_3m
          UNION ALL SELECT date, 'Facebook', 'purchase_value', purchase_value FROM fact_facebook_ads_daily_3m
          UNION ALL SELECT date, 'Facebook', 'roas',
            CASE WHEN cost > 0 THEN purchase_value / cost ELSE 0 END
            FROM fact_facebook_ads_daily_3m WHERE cost > 0

          -- Bing
          UNION ALL SELECT date, 'Bing', 'cost', cost FROM fact_bing_ads_daily_3m
          UNION ALL SELECT date, 'Bing', 'conversions', conversions FROM fact_bing_ads_daily_3m
          UNION ALL SELECT date, 'Bing', 'revenue', revenue FROM fact_bing_ads_daily_3m

          -- CMS web orders (revenue, GP, orders)
          UNION ALL SELECT date, 'Web Orders', 'orders', orders FROM agg_cms_daily WHERE date >= CURRENT_DATE - INTERVAL '90 days'
          UNION ALL SELECT date, 'Web Orders', 'revenue', revenue FROM agg_cms_daily WHERE date >= CURRENT_DATE - INTERVAL '90 days'
          UNION ALL SELECT date, 'Web Orders', 'gp', gp FROM agg_cms_daily WHERE date >= CURRENT_DATE - INTERVAL '90 days'

          -- Search Console (only ~30d available daily)
          UNION ALL SELECT date, 'Organic Search', 'clicks', SUM(clicks) FROM fact_search_console_daily GROUP BY date
        ),
        windowed AS (
          SELECT
            date, channel, metric, value,
            AVG(value) OVER (PARTITION BY channel, metric ORDER BY date ROWS BETWEEN 28 PRECEDING AND 1 PRECEDING) as mean,
            STDDEV(value) OVER (PARTITION BY channel, metric ORDER BY date ROWS BETWEEN 28 PRECEDING AND 1 PRECEDING) as stddev,
            COUNT(*) OVER (PARTITION BY channel, metric ORDER BY date ROWS BETWEEN 28 PRECEDING AND 1 PRECEDING) as n
          FROM unioned
        )
        SELECT
          date::VARCHAR as date, channel, metric, value, mean, stddev,
          CASE WHEN stddev > 0 THEN (value - mean) / stddev ELSE 0 END as z_score,
          CASE WHEN mean > 0 THEN (value - mean) / mean ELSE 0 END as deviation_pct
        FROM windowed
        WHERE n >= 14
          AND stddev > 0
          AND ABS((value - mean) / stddev) >= ${z}
        ORDER BY ABS((value - mean) / stddev) DESC, date DESC
        LIMIT 200
      `);

      // Group by date to make the UI scannable
      const byDate: Record<string, typeof anomalies> = {};
      anomalies.forEach(a => {
        const d = a.date;
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(a);
      });

      return {
        anomalies,
        byDate: Object.entries(byDate).map(([date, items]) => ({ date, items })).sort((a, b) => b.date.localeCompare(a.date)),
        threshold: z,
        method: '28-day rolling z-score per (channel, metric). Flag |z| ≥ threshold. Excludes today from window so today is the test point.',
      };
    }),

  // 5a. SKU-level OOS spend leak — joins Shopping SKU spend to GMC stock by offer_id.
  // Now that GMC has offer_id (Supermetrics MCP fetch 2026-04-29), this works at SKU granularity.
  oosSpendLeakBySku: publicProcedure
    .input(z.object({ window: z.enum(['7d', '30d']).default('30d') }).optional())
    .query(async ({ input }) => {
      const win = input?.window ?? '30d';
      const table = win === '7d' ? 'fact_aw_shopping_sku_7d' : 'fact_aw_shopping_sku';

      // Per-SKU: ad spend, GMC availability, brand-level margin → estimated waste
      const skus = await runQuery<{
        offer_id: string; title: string; brand: string; campaign_name: string;
        availability: string; price: number;
        spend: number; clicks: number; impressions: number; conversions: number; conversion_value: number;
        roas: number; cvr: number; ctr: number;
        gmc_match: boolean;
        decision: string;
      }>(`
        SELECT
          s.offer_id::VARCHAR as offer_id,
          s.title,
          s.brand,
          s.campaign_name,
          COALESCE(g.availability, 'NOT_IN_GMC') as availability,
          COALESCE(g.price, 0) as price,
          s.cost as spend,
          s.clicks,
          s.impressions,
          s.conversions,
          s.conversion_value,
          CASE WHEN s.cost > 0 THEN s.conversion_value / s.cost ELSE 0 END as roas,
          CASE WHEN s.clicks > 0 THEN s.conversions / s.clicks ELSE 0 END as cvr,
          CASE WHEN s.impressions > 0 THEN s.clicks::DOUBLE / s.impressions ELSE 0 END as ctr,
          (g.offer_id IS NOT NULL) as gmc_match,
          CASE
            WHEN g.availability = 'out of stock' AND s.cost > 0 THEN 'PAUSE_OOS'
            WHEN g.availability = 'preorder' AND s.cost > 5 AND s.conversions = 0 THEN 'PAUSE_PREORDER'
            WHEN g.offer_id IS NULL AND s.cost > 0 THEN 'INVESTIGATE_NOT_IN_FEED'
            WHEN g.availability = 'in stock' AND s.cost > 0 AND s.conversions = 0 AND s.clicks > 20 THEN 'REVIEW_NO_CONV_DESPITE_STOCK'
            ELSE 'OK'
          END as decision
        FROM ${table} s
        LEFT JOIN fact_gmc_products_unique g ON s.offer_id::VARCHAR = g.offer_id
        WHERE s.cost > 0
        ORDER BY
          CASE
            WHEN g.availability = 'out of stock' THEN 1
            WHEN g.availability = 'preorder' THEN 2
            WHEN g.offer_id IS NULL THEN 3
            ELSE 4
          END,
          s.cost DESC
      `);

      const summary = {
        oosSpend: skus.filter(s => s.availability === 'out of stock').reduce((a, b) => a + b.spend, 0),
        preorderSpend: skus.filter(s => s.availability === 'preorder').reduce((a, b) => a + b.spend, 0),
        notInFeedSpend: skus.filter(s => !s.gmc_match).reduce((a, b) => a + b.spend, 0),
        totalSpend: skus.reduce((a, b) => a + b.spend, 0),
        oosCount: skus.filter(s => s.availability === 'out of stock').length,
        preorderCount: skus.filter(s => s.availability === 'preorder').length,
        notInFeedCount: skus.filter(s => !s.gmc_match).length,
        skuCount: skus.length,
      };

      return {
        skus: skus.slice(0, 200),
        oosSkus: skus.filter(s => s.availability === 'out of stock'),
        preorderSkus: skus.filter(s => s.availability === 'preorder'),
        notInFeedSkus: skus.filter(s => !s.gmc_match),
        summary,
        window: win,
      };
    }),

  // 5b. Wasted search terms — per search term, GP-weighted negative-keyword candidates.
  // Real GP is unknown per term; estimated as conversion_value × brand-margin% (avg over web orders).
  wastedSearchTerms: publicProcedure
    .input(z.object({
      minCost: z.number().default(5),
      minClicks: z.number().default(10),
    }).optional())
    .query(async ({ input }) => {
      const minCost = input?.minCost ?? 5;
      const minClicks = input?.minClicks ?? 10;

      // Use the overall blended margin from web orders as the default; can refine per-term later
      const blendedMargin = await runQuery<{ margin_pct: number }>(`
        SELECT
          COALESCE(SUM(gp_imputed) / NULLIF(SUM(total), 0), 0.10) as margin_pct
        FROM fact_web_orders
        WHERE order_date >= CURRENT_DATE - INTERVAL '180 days'
          AND total > 0 AND NOT was_refunded
      `);
      const m = blendedMargin[0]?.margin_pct ?? 0.10;

      const terms = await runQuery<{
        search_term: string; campaign_name: string; ad_group_name: string; branded: string;
        cost: number; clicks: number; impressions: number; conversions: number; conversion_value: number;
        cpc: number; cvr: number; cost_per_conv: number; estimated_gp: number; net_profit: number;
        decision: string; decision_reason: string;
      }>(`
        SELECT
          search_term, campaign_name, ad_group_name, branded,
          cost, clicks, impressions, conversions, conversion_value,
          CASE WHEN clicks > 0 THEN cost / clicks ELSE 0 END as cpc,
          CASE WHEN clicks > 0 THEN conversions / clicks ELSE 0 END as cvr,
          CASE WHEN conversions > 0 THEN cost / conversions ELSE NULL END as cost_per_conv,
          conversion_value * ${m} as estimated_gp,
          (conversion_value * ${m}) - cost as net_profit,
          CASE
            WHEN conversions = 0 AND cost >= ${minCost} AND clicks >= ${minClicks}
              THEN 'NEGATIVE_KEYWORD_CANDIDATE'
            WHEN conversions > 0 AND ((conversion_value * ${m}) - cost) < 0
              THEN 'LOSS_ON_GP'
            WHEN conversions > 0 AND ((conversion_value * ${m}) - cost) >= 0 AND ((conversion_value * ${m}) - cost) < cost * 0.2
              THEN 'THIN_MARGIN'
            ELSE 'OK'
          END as decision,
          CASE
            WHEN conversions = 0 AND cost >= ${minCost} AND clicks >= ${minClicks}
              THEN 'Spent ≥$' || ${minCost} || ' across ≥' || ${minClicks} || ' clicks with zero conversions. Add as negative keyword.'
            WHEN conversions > 0 AND ((conversion_value * ${m}) - cost) < 0
              THEN 'GP from this term less than ad spend on it. Reduce bid or restrict match type.'
            WHEN conversions > 0 AND ((conversion_value * ${m}) - cost) < cost * 0.2
              THEN 'Marginally profitable. Watch CVR for 14 days; if it drops, raise the floor.'
            ELSE 'Profitable.'
          END as decision_reason
        FROM fact_aw_search_terms
        WHERE cost > 0
        ORDER BY net_profit ASC
      `);

      const negativeCandidates = terms.filter(t => t.decision === 'NEGATIVE_KEYWORD_CANDIDATE');
      const lossTerms = terms.filter(t => t.decision === 'LOSS_ON_GP');
      const thinMarginTerms = terms.filter(t => t.decision === 'THIN_MARGIN');

      const totalNegativeWaste = negativeCandidates.reduce((s, t) => s + t.cost, 0);
      const totalLossWaste = lossTerms.reduce((s, t) => s + Math.max(0, -t.net_profit), 0);

      return {
        terms: terms.slice(0, 300),
        negativeCandidates: negativeCandidates.slice(0, 100),
        lossTerms: lossTerms.slice(0, 50),
        thinMarginTerms: thinMarginTerms.slice(0, 50),
        summary: {
          totalTerms: terms.length,
          negativeCount: negativeCandidates.length,
          lossCount: lossTerms.length,
          thinMarginCount: thinMarginTerms.length,
          totalNegativeWaste,
          totalLossWaste,
          totalRecoverable30d: totalNegativeWaste + totalLossWaste,
          totalRecoverableAnnual: (totalNegativeWaste + totalLossWaste) * 12,
        },
        assumptions: {
          blendedMarginPct: m,
          minCost,
          minClicks,
          marginSource: 'fact_web_orders 180d (blended GP/Revenue, refund-net)',
        },
      };
    }),

  // 6. Headline waste estimate — top-line "money on the table" number for the dashboard hero card.
  wasteHeadline: publicProcedure.query(async () => {
    const branded = await runQuery<{ branded_revenue: number; total_revenue: number; total_cost: number }>(`
      WITH branded AS (
        SELECT SUM(revenue)::DOUBLE as branded_revenue
        FROM fact_pm_campaign_revenue
        WHERE source_medium LIKE '%cpc%'
          AND (campaign LIKE '%(B)%' OR LOWER(campaign) LIKE '%phonebot (b)%')
      ),
      cpc AS (
        SELECT SUM(revenue)::DOUBLE as total_revenue
        FROM fact_pm_campaign_revenue
        WHERE source_medium LIKE '%cpc%'
      ),
      cost AS (
        SELECT SUM(cost)::DOUBLE as total_cost
        FROM fact_google_ads_daily
      )
      SELECT branded.branded_revenue, cpc.total_revenue, cost.total_cost FROM branded, cpc, cost
    `);

    const oos = await runQuery<{ oos_waste: number }>(`
      WITH aw AS (
        SELECT LOWER(brand) as brand, SUM(cost)::DOUBLE as spend FROM fact_aw_shopping_sku WHERE cost > 0 GROUP BY brand
      ),
      gmc AS (
        SELECT LOWER(brand) as brand,
               COUNT(CASE WHEN availability = 'in stock' THEN 1 END)::DOUBLE / COUNT(*)::DOUBLE as in_stock_pct,
               COUNT(*) as total
        FROM fact_gmc_products GROUP BY brand
      )
      SELECT SUM(aw.spend * (1 - gmc.in_stock_pct))::DOUBLE as oos_waste
      FROM aw INNER JOIN gmc ON aw.brand = gmc.brand
      WHERE gmc.total >= 5
    `);

    const negativeMarginSpend = await runQuery<{ loss_skus: number; total_loss: number }>(`
      WITH base AS (
        SELECT
          s.cost,
          s.conversion_value * COALESCE(m.margin_pct, 0.10) as gp,
          (s.conversion_value * COALESCE(m.margin_pct, 0.10)) - s.cost as net
        FROM fact_aw_shopping_sku s
        LEFT JOIN agg_brand_margin m ON LOWER(s.brand) = m.brand
        WHERE s.cost >= 30
      )
      SELECT COUNT(*)::INTEGER as loss_skus, SUM(CASE WHEN net < 0 THEN -net ELSE 0 END)::DOUBLE as total_loss
      FROM base WHERE net < 0
    `);

    const brandedRev = branded[0]?.branded_revenue || 0;
    const totalRev = branded[0]?.total_revenue || 0;
    const totalCost = branded[0]?.total_cost || 0;
    const brandedSpend = totalRev > 0 ? totalCost * (brandedRev / totalRev) : 0;
    const brandedWaste = brandedSpend * 0.8;  // 80% recovery assumption

    const oosWaste = oos[0]?.oos_waste || 0;
    const negMargin = negativeMarginSpend[0]?.total_loss || 0;
    const total = brandedWaste + oosWaste + negMargin;

    return {
      brandedCannibalization30d: brandedWaste,
      oosFeedLag30d: oosWaste,
      negativeMarginSku30d: negMargin,
      total30d: total,
      totalAnnualised: total * 12,
      lossSkuCount: negativeMarginSpend[0]?.loss_skus || 0,
      caveat: 'These are estimates with explicit assumptions (80% branded recovery, brand-level OOS proxy, brand-margin × SKU conversion_value for GP). Validate the largest line with a holdout test before acting at full scale.',
    };
  }),

  // === BigQuery-backed procedures (live GA4 export, project bigquery-api-494711) ===
  // These run actual BQ queries via the `bq` CLI on each call.
  // Cached in-process for 5 min to avoid re-billing on every dashboard render.

  // BQ status — does this machine have bq installed + how much data has landed?
  bqStatus: publicProcedure.query(async () => {
    const available = await bqAvailable();
    if (!available) {
      return { available: false, days: 0, earliest: null, latest: null, totalEvents: 0, error: 'bq CLI not installed on this machine' };
    }
    try {
      const rows = await bqQuery<{ days: number; earliest: string; latest: string; total_events: number }>(`
        SELECT
          COUNT(DISTINCT event_date) AS days,
          MIN(event_date) AS earliest,
          MAX(event_date) AS latest,
          COUNT(*) AS total_events
        FROM \`bigquery-api-494711.analytics_284223207.vw_events_flat\`
      `);
      const r = rows[0];
      return {
        available: true,
        days: Number(r.days) || 0,
        earliest: r.earliest,
        latest: r.latest,
        totalEvents: Number(r.total_events) || 0,
      };
    } catch (e: any) {
      return { available: false, days: 0, earliest: null, latest: null, totalEvents: 0, error: e.message };
    }
  }),

  // BQ click-ID capture rate per channel — the killer attribution finding
  bqClickIdCapture: publicProcedure.query(async () => {
    const rows = await bqQuery<{
      source: string; medium: string; sessions: number;
      w_gclid: number; w_fbclid: number; w_msclkid: number;
      pct_with_gclid: number; pct_with_fbclid: number; pct_with_msclkid: number;
    }>(`
      SELECT
        source, medium,
        COUNT(*) AS sessions,
        COUNTIF(gclid IS NOT NULL) AS w_gclid,
        COUNTIF(fbclid IS NOT NULL) AS w_fbclid,
        COUNTIF(msclkid IS NOT NULL) AS w_msclkid,
        ROUND(COUNTIF(gclid IS NOT NULL) / NULLIF(COUNT(*), 0) * 100, 1) AS pct_with_gclid,
        ROUND(COUNTIF(fbclid IS NOT NULL) / NULLIF(COUNT(*), 0) * 100, 1) AS pct_with_fbclid,
        ROUND(COUNTIF(msclkid IS NOT NULL) / NULLIF(COUNT(*), 0) * 100, 1) AS pct_with_msclkid
      FROM \`bigquery-api-494711.analytics_284223207.vw_sessions\`
      WHERE source IN ('google', 'bing', 'fb', 'facebook', 'msn') OR medium IN ('cpc', 'paid')
      GROUP BY source, medium
      HAVING sessions >= 5
      ORDER BY sessions DESC
      LIMIT 30
    `);
    return rows.map(r => ({ ...r, sessions: Number(r.sessions), w_gclid: Number(r.w_gclid), w_fbclid: Number(r.w_fbclid), w_msclkid: Number(r.w_msclkid) }));
  }),

  // BQ channel attribution — what GA4 says happened
  bqChannelAttribution: publicProcedure.query(async () => {
    const rows = await bqQuery<{
      source: string; medium: string; sessions: number;
      purchases: number; revenue: number; aov: number;
    }>(`
      SELECT
        COALESCE(NULLIF(source, ''), '(none)') AS source,
        COALESCE(NULLIF(medium, ''), '(none)') AS medium,
        COUNT(*) AS sessions,
        SUM(purchase_count) AS purchases,
        ROUND(SUM(purchase_revenue), 0) AS revenue,
        ROUND(SUM(purchase_revenue) / NULLIF(SUM(purchase_count), 0), 0) AS aov
      FROM \`bigquery-api-494711.analytics_284223207.vw_sessions\`
      GROUP BY source, medium
      ORDER BY revenue DESC NULLS LAST
      LIMIT 25
    `);
    return rows.map(r => ({ ...r, sessions: Number(r.sessions), purchases: Number(r.purchases || 0), revenue: Number(r.revenue || 0), aov: Number(r.aov || 0) }));
  }),

  // BQ conversion funnel by channel
  bqFunnelByChannel: publicProcedure.query(async () => {
    const rows = await bqQuery<{
      source: string; medium: string;
      sessions: number; w_view: number; w_atc: number; w_co: number; w_purchase: number;
      pct_view: number; view_to_atc: number; atc_to_co: number; co_to_buy: number;
    }>(`
      SELECT
        COALESCE(NULLIF(source, ''), '(none)') AS source,
        COALESCE(NULLIF(medium, ''), '(none)') AS medium,
        COUNT(*) AS sessions,
        COUNTIF(view_item_count > 0) AS w_view,
        COUNTIF(add_to_cart_count > 0) AS w_atc,
        COUNTIF(begin_checkout_count > 0) AS w_co,
        COUNTIF(purchase_count > 0) AS w_purchase,
        ROUND(COUNTIF(view_item_count > 0) / NULLIF(COUNT(*), 0) * 100, 1) AS pct_view,
        ROUND(COUNTIF(add_to_cart_count > 0) / NULLIF(COUNTIF(view_item_count > 0), 0) * 100, 1) AS view_to_atc,
        ROUND(COUNTIF(begin_checkout_count > 0) / NULLIF(COUNTIF(add_to_cart_count > 0), 0) * 100, 1) AS atc_to_co,
        ROUND(COUNTIF(purchase_count > 0) / NULLIF(COUNTIF(begin_checkout_count > 0), 0) * 100, 1) AS co_to_buy
      FROM \`bigquery-api-494711.analytics_284223207.vw_sessions\`
      GROUP BY source, medium
      HAVING sessions >= 30
      ORDER BY sessions DESC
      LIMIT 20
    `);
    return rows.map(r => ({
      ...r,
      sessions: Number(r.sessions), w_view: Number(r.w_view), w_atc: Number(r.w_atc),
      w_co: Number(r.w_co), w_purchase: Number(r.w_purchase),
    }));
  }),

  // BQ landing page performance — top entry pages by sessions × CVR × revenue.
  // For Phonebot: identifies which product/category pages convert best, surfaces
  // page-level GTM tag misconfigs (low click-id capture on a single landing page),
  // and finds high-traffic-low-CVR pages worth a UX fix vs scaling ad spend on winners.
  bqLandingPages: publicProcedure
    .input(z.object({
      minSessions: z.number().default(20),
      paidOnly: z.boolean().default(false),
    }).optional())
    .query(async ({ input }) => {
      const minSessions = input?.minSessions ?? 20;
      const paidOnly = input?.paidOnly ?? false;
      const paidFilter = paidOnly
        ? `AND (medium IN ('cpc', 'paid', 'paid_search', 'paid_social') OR gclid IS NOT NULL OR fbclid IS NOT NULL OR msclkid IS NOT NULL)`
        : '';

      const rows = await bqQuery<{
        landing_page: string;
        sessions: number;
        purchases: number;
        revenue: number;
        cvr: number;
        aov: number;
        view_item_rate: number;
        atc_rate: number;
        co_rate: number;
        click_id_capture_pct: number;
        avg_pageviews: number;
        avg_duration_sec: number;
      }>(`
        SELECT
          landing_page,
          COUNT(*) AS sessions,
          SUM(purchase_count) AS purchases,
          ROUND(SUM(purchase_revenue), 0) AS revenue,
          ROUND(SUM(purchase_count) / NULLIF(COUNT(*), 0) * 100, 2) AS cvr,
          ROUND(SUM(purchase_revenue) / NULLIF(SUM(purchase_count), 0), 0) AS aov,
          ROUND(COUNTIF(view_item_count > 0) / NULLIF(COUNT(*), 0) * 100, 1) AS view_item_rate,
          ROUND(COUNTIF(add_to_cart_count > 0) / NULLIF(COUNT(*), 0) * 100, 1) AS atc_rate,
          ROUND(COUNTIF(begin_checkout_count > 0) / NULLIF(COUNT(*), 0) * 100, 1) AS co_rate,
          ROUND(
            COUNTIF(gclid IS NOT NULL OR fbclid IS NOT NULL OR msclkid IS NOT NULL)
            / NULLIF(COUNTIF(medium IN ('cpc', 'paid', 'paid_search', 'paid_social')), 0) * 100,
            1
          ) AS click_id_capture_pct,
          ROUND(AVG(pageviews), 1) AS avg_pageviews,
          ROUND(AVG(session_duration_sec), 0) AS avg_duration_sec
        FROM \`bigquery-api-494711.analytics_284223207.vw_sessions\`
        WHERE landing_page IS NOT NULL
          AND landing_page != ''
          ${paidFilter}
        GROUP BY landing_page
        HAVING sessions >= ${minSessions}
        ORDER BY sessions DESC
        LIMIT 50
      `);

      const normalized = rows.map(r => ({
        ...r,
        sessions: Number(r.sessions),
        purchases: Number(r.purchases || 0),
        revenue: Number(r.revenue || 0),
        cvr: Number(r.cvr || 0),
        aov: Number(r.aov || 0),
        view_item_rate: Number(r.view_item_rate || 0),
        atc_rate: Number(r.atc_rate || 0),
        co_rate: Number(r.co_rate || 0),
        click_id_capture_pct: r.click_id_capture_pct == null ? null : Number(r.click_id_capture_pct),
        avg_pageviews: Number(r.avg_pageviews || 0),
        avg_duration_sec: Number(r.avg_duration_sec || 0),
      }));

      const totalSessions = normalized.reduce((s, r) => s + r.sessions, 0);
      const totalRevenue = normalized.reduce((s, r) => s + r.revenue, 0);
      const blendedCvr = totalSessions > 0
        ? normalized.reduce((s, r) => s + r.purchases, 0) / totalSessions * 100
        : 0;

      // Categorise: high-traffic + above-blended CVR → SCALE; high-traffic + below → FIX UX; low-traffic + high CVR → SCALE TRAFFIC
      const sessionMedian = normalized.length > 0
        ? [...normalized].sort((a, b) => a.sessions - b.sessions)[Math.floor(normalized.length / 2)].sessions
        : 0;
      const categorised = normalized.map(r => {
        const highTraffic = r.sessions >= sessionMedian;
        const aboveBlended = r.cvr > blendedCvr;
        let tag: 'SCALE_AD_SPEND' | 'FIX_UX' | 'SCALE_TRAFFIC' | 'NEUTRAL';
        let reason: string;
        if (highTraffic && aboveBlended) {
          tag = 'SCALE_AD_SPEND';
          reason = 'Top-quartile traffic AND above-blended CVR. Fertile ground for more ad spend or wider targeting.';
        } else if (highTraffic && !aboveBlended) {
          tag = 'FIX_UX';
          reason = 'High traffic but below-blended CVR. UX/copy/price audit before adding more spend.';
        } else if (!highTraffic && aboveBlended) {
          tag = 'SCALE_TRAFFIC';
          reason = 'Converts above blend but starved for traffic. SEO/ads/email push could 10x revenue from this page.';
        } else {
          tag = 'NEUTRAL';
          reason = 'Low traffic AND below-blended CVR. Watch but no urgent action.';
        }
        return { ...r, tag, reason };
      });

      // Pull window stats so the caveat reflects how much data has actually landed
      const windowRow = await bqQuery<{ days: number; earliest: string; latest: string }>(`
        SELECT
          COUNT(DISTINCT event_date) AS days,
          MIN(event_date) AS earliest,
          MAX(event_date) AS latest
        FROM \`bigquery-api-494711.analytics_284223207.vw_events_flat\`
      `);
      const days = Number(windowRow[0]?.days || 0);
      const earliest = windowRow[0]?.earliest || '?';
      const latest = windowRow[0]?.latest || '?';

      return {
        rows: categorised,
        summary: {
          pageCount: categorised.length,
          totalSessions,
          totalRevenue,
          blendedCvr,
          scaleAdSpendCount: categorised.filter(r => r.tag === 'SCALE_AD_SPEND').length,
          fixUxCount: categorised.filter(r => r.tag === 'FIX_UX').length,
          scaleTrafficCount: categorised.filter(r => r.tag === 'SCALE_TRAFFIC').length,
        },
        paidOnly,
        minSessions,
        windowDays: days,
        windowEarliest: earliest,
        windowLatest: latest,
        caveats: [
          `BigQuery GA4 export window: ${days} day${days === 1 ? '' : 's'} (${earliest} → ${latest}). CVR and revenue are ${days < 7 ? 'directional, not strategic — wait for 7+ days for confident decisions' : 'usable for trend reads, but still light for tail-end pages'}.`,
          'click_id_capture_pct is the % of paid sessions on this landing page that retained a click ID. Below 80% on a paid page suggests a GTM tag firing issue specific to that template.',
          'Categorisation uses session-count median as the high/low-traffic split. Once 14d of data is available the tier boundaries should be re-set against a longer baseline.',
        ],
      };
    }),

  // BQ session capture rate on purchase events — corroborates ProfitMetrics' 68% claim
  bqSessionCapture: publicProcedure.query(async () => {
    const rows = await bqQuery<{
      total_purchases: number; with_session_id: number; with_user_pseudo_id: number;
      with_transaction_id: number; pct_with_session: number;
      unique_transactions: number; total_revenue: number;
    }>(`
      SELECT
        COUNT(*) AS total_purchases,
        COUNTIF(ga_session_id IS NOT NULL) AS with_session_id,
        COUNTIF(user_pseudo_id IS NOT NULL) AS with_user_pseudo_id,
        COUNTIF(transaction_id IS NOT NULL) AS with_transaction_id,
        ROUND(COUNTIF(ga_session_id IS NOT NULL) / COUNT(*) * 100, 1) AS pct_with_session,
        COUNT(DISTINCT transaction_id) AS unique_transactions,
        ROUND(SUM(purchase_revenue), 0) AS total_revenue
      FROM \`bigquery-api-494711.analytics_284223207.vw_events_flat\`
      WHERE event_name = 'purchase'
    `);
    const r = rows[0];
    return {
      totalPurchases: Number(r?.total_purchases || 0),
      withSessionId: Number(r?.with_session_id || 0),
      withUserPseudoId: Number(r?.with_user_pseudo_id || 0),
      withTransactionId: Number(r?.with_transaction_id || 0),
      pctWithSession: Number(r?.pct_with_session || 0),
      uniqueTransactions: Number(r?.unique_transactions || 0),
      totalRevenue: Number(r?.total_revenue || 0),
    };
  }),
});
