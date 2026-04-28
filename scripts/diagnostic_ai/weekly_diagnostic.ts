/**
 * Weekly diagnostic AI worker.
 *
 * Runs Monday morning, pulls data from the dashboard's tRPC procedures,
 * sends to Claude, writes a markdown memo + emails it via Brevo.
 *
 * Status: SCAFFOLD — needs ANTHROPIC_API_KEY and prompt iteration before going live.
 *
 * Usage:
 *   tsx scripts/diagnostic_ai/weekly_diagnostic.ts --dry-run    # writes to stdout, doesn't email
 *   tsx scripts/diagnostic_ai/weekly_diagnostic.ts                # emails + writes md
 *
 * Required env:
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   BREVO_API_KEY=xkeysib-...
 *   ALERT_EMAIL_TO=erroorfree@yahoo.com
 *   ALERT_EMAIL_FROM=<verified Brevo sender>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema, runQuery } from '../../app/api/lib/duckdb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO;
const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM;
const DRY_RUN = process.argv.includes('--dry-run');
const MODEL = 'claude-opus-4-7';

interface WeeklyData {
  week_ending: string;
  generated_at: string;
  // Filled in by gather()
  waste_headline: any;
  anomalies: any;
  loss_skus: any;
  brand_mix_shift: any;
  channel_revenue: any;
  inventory_pulse: any;
  topline_kpis: any;
}

async function gather(): Promise<WeeklyData> {
  await initSchema();

  // Run the same SQL as the dashboard procedures, but inline so we don't depend on the API server
  // being up. (You could alternatively hit the running tRPC server via http.)

  // Topline KPIs (last 7d vs prior 7d)
  const topline = await runQuery(`
    WITH last7 AS (
      SELECT SUM(orders) as orders, SUM(revenue) as revenue, SUM(gp) as gp
      FROM agg_cms_daily WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    ),
    prior7 AS (
      SELECT SUM(orders) as orders, SUM(revenue) as revenue, SUM(gp) as gp
      FROM agg_cms_daily
      WHERE date >= CURRENT_DATE - INTERVAL '14 days' AND date < CURRENT_DATE - INTERVAL '7 days'
    )
    SELECT last7.orders as orders_last7, prior7.orders as orders_prior7,
           last7.revenue as revenue_last7, prior7.revenue as revenue_prior7,
           last7.gp as gp_last7, prior7.gp as gp_prior7
    FROM last7, prior7
  `);

  // Anomalies (last 7d, z >= 2)
  const anomalies = await runQuery(`
    WITH unioned AS (
      SELECT date, 'Google Ads' as channel, 'cost' as metric, cost as value FROM fact_google_ads_daily_3m
      UNION ALL SELECT date, 'Google Ads', 'roas', CASE WHEN cost > 0 THEN conversions_value / cost ELSE 0 END FROM fact_google_ads_daily_3m WHERE cost > 0
      UNION ALL SELECT date, 'Facebook', 'roas', CASE WHEN cost > 0 THEN purchase_value / cost ELSE 0 END FROM fact_facebook_ads_daily_3m WHERE cost > 0
      UNION ALL SELECT date, 'Bing', 'cost', cost FROM fact_bing_ads_daily_3m
    ),
    windowed AS (
      SELECT
        date, channel, metric, value,
        AVG(value) OVER (PARTITION BY channel, metric ORDER BY date ROWS BETWEEN 28 PRECEDING AND 1 PRECEDING) as mean,
        STDDEV(value) OVER (PARTITION BY channel, metric ORDER BY date ROWS BETWEEN 28 PRECEDING AND 1 PRECEDING) as stddev
      FROM unioned
    )
    SELECT date::VARCHAR as date, channel, metric, value, mean, stddev,
           CASE WHEN stddev > 0 THEN (value - mean) / stddev ELSE 0 END as z
    FROM windowed
    WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      AND stddev > 0
      AND ABS((value - mean) / stddev) >= 2.0
    ORDER BY ABS((value - mean) / stddev) DESC
    LIMIT 30
  `);

  // SKU loss leaders
  const lossSkus = await runQuery(`
    SELECT s.title, s.brand, s.cost as spend, s.conversions, s.conversion_value,
           COALESCE(m.margin_pct, 0.10) as margin_pct,
           (s.conversion_value * COALESCE(m.margin_pct, 0.10)) - s.cost as net_profit
    FROM fact_aw_shopping_sku s
    LEFT JOIN agg_brand_margin m ON LOWER(s.brand) = m.brand
    WHERE s.cost >= 30 AND ((s.conversion_value * COALESCE(m.margin_pct, 0.10)) - s.cost) < 0
    ORDER BY net_profit ASC
    LIMIT 20
  `);

  // Brand mix-shift (last 3 months)
  const brandMix = await runQuery(`
    SELECT strftime(order_date, '%Y-%m') as month, COALESCE(Brand, 'Unknown') as brand,
           SUM(total)::DOUBLE as revenue, COUNT(*)::INTEGER as orders
    FROM fact_web_orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY month, brand
    HAVING orders >= 5
    ORDER BY month DESC, revenue DESC
  `);

  // Channel revenue (PM)
  const channelRev = await runQuery(`
    SELECT channel, sessions, purchases, revenue, gp
    FROM fact_pm_channel_revenue r LEFT JOIN fact_pm_channel_gp g USING (channel)
    ORDER BY revenue DESC
  `);

  // Inventory pulse
  const inventory = await runQuery(`
    SELECT brand,
           COUNT(*) as total,
           COUNT(CASE WHEN availability = 'in stock' THEN 1 END) as in_stock,
           COUNT(CASE WHEN availability = 'in stock' THEN 1 END) * 1.0 / COUNT(*) as in_stock_pct
    FROM fact_gmc_products GROUP BY brand HAVING total >= 5 ORDER BY total DESC
  `);

  // Waste headline
  const wasteH = await runQuery(`
    SELECT
      (SELECT SUM(cost) FROM fact_aw_shopping_sku WHERE cost > 0) as total_shopping_spend,
      (SELECT SUM(CASE WHEN net < 0 THEN -net ELSE 0 END) FROM (
        SELECT (s.conversion_value * COALESCE(m.margin_pct, 0.10)) - s.cost as net
        FROM fact_aw_shopping_sku s LEFT JOIN agg_brand_margin m ON LOWER(s.brand) = m.brand
      )) as negative_margin_loss
  `);

  return {
    week_ending: new Date().toISOString().slice(0, 10),
    generated_at: new Date().toISOString(),
    topline_kpis: topline[0],
    anomalies,
    loss_skus: lossSkus,
    brand_mix_shift: brandMix,
    channel_revenue: channelRev,
    inventory_pulse: inventory,
    waste_headline: wasteH[0],
  };
}

async function callClaude(systemPrompt: string, dataJson: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set. Sign up at console.anthropic.com');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      // Prompt caching: the system prompt rarely changes, so cache it. Saves ~80% on cost after first run.
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `This week's data (JSON):\n\n\`\`\`json\n${dataJson}\n\`\`\`\n\nWrite the memo.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json() as any;
  return json.content[0].text;
}

async function main() {
  console.log(`Diagnostic AI worker — ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('Gathering data...');
  const data = await gather();

  const dataJson = JSON.stringify(data, null, 2);
  console.log(`  Data payload: ${(dataJson.length / 1024).toFixed(1)}kb`);

  const systemPath = path.resolve(__dirname, 'prompts/system.md');
  const systemPrompt = fs.readFileSync(systemPath, 'utf-8');

  if (DRY_RUN && !ANTHROPIC_API_KEY) {
    console.log('\n=== System prompt ===\n', systemPrompt.slice(0, 500), '...\n');
    console.log('\n=== Data payload (preview) ===\n', dataJson.slice(0, 2000), '...\n');
    console.log('\nDry run complete. Set ANTHROPIC_API_KEY to test the full call.');
    return;
  }

  console.log('Calling Claude...');
  const memo = await callClaude(systemPrompt, dataJson);
  console.log(`  Got ${memo.length} chars back`);

  const outPath = path.resolve(__dirname, `../../app/data/weekly_diagnostic_${data.week_ending}.md`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, memo);
  console.log(`  Wrote ${outPath}`);

  if (BREVO_API_KEY && ALERT_EMAIL_TO && ALERT_EMAIL_FROM && !DRY_RUN) {
    // Convert markdown to a basic HTML wrapper. For richer rendering, pipe through a markdown library.
    const memoHtml = memo
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:760px;margin:0 auto;color:#222;line-height:1.5;"><p>${memoHtml}</p></div>`;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: ALERT_EMAIL_FROM, name: 'Phonebot Dashboard' },
        to: [{ email: ALERT_EMAIL_TO }],
        subject: `Phonebot weekly memo — ${data.week_ending}`,
        htmlContent: html,
        textContent: memo,
      }),
    });
    if (!res.ok) {
      throw new Error(`Brevo API error: ${res.status} ${await res.text()}`);
    }
    console.log(`  Emailed to ${ALERT_EMAIL_TO}`);
  }

  if (DRY_RUN) {
    console.log('\n=== Memo ===\n');
    console.log(memo);
  }
}

main().catch(err => {
  console.error('Diagnostic AI worker failed:', err);
  process.exit(1);
});
