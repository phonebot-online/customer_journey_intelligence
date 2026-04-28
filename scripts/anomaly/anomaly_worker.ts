/**
 * Standalone daily anomaly worker.
 *
 * Runs the same z-score tests as the dashboard's profitOps.anomalyScan procedure,
 * but designed to be cron-fired (e.g. nightly at 06:00 AEST) and email results via Brevo.
 *
 * Usage:
 *   tsx scripts/anomaly/anomaly_worker.ts
 *
 * Required env vars:
 *   BREVO_API_KEY       — Brevo API v3 key (Brevo dashboard → SMTP & API → API keys)
 *   ALERT_EMAIL_TO      — destination email (e.g. erroorfree@yahoo.com)
 *   ALERT_EMAIL_FROM    — verified sender email registered in your Brevo account
 *   ANOMALY_Z_THRESHOLD (optional, default 2.0)
 *
 * Cron suggestion (macOS / Linux):
 *   0 6 * * * cd /path/to/Customer\ Intelligence\ Dashboard && tsx scripts/anomaly/anomaly_worker.ts >> logs/anomaly.log 2>&1
 *
 * Or as a Claude Code scheduled agent:
 *   /schedule run scripts/anomaly/anomaly_worker.ts every weekday at 6am
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema, runQuery } from '../../app/api/lib/duckdb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO;
const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM;
const Z_THRESHOLD = parseFloat(process.env.ANOMALY_Z_THRESHOLD || '2.0');

interface Anomaly {
  date: string;
  channel: string;
  metric: string;
  value: number;
  mean: number;
  stddev: number;
  z_score: number;
  deviation_pct: number;
}

async function detectAnomalies(): Promise<Anomaly[]> {
  // Same SQL as the dashboard procedure, restricted to today's date for daily alerting
  const sql = `
    WITH unioned AS (
      SELECT date, 'Google Ads' as channel, 'cost' as metric, cost as value FROM fact_google_ads_daily_3m
      UNION ALL SELECT date, 'Google Ads', 'conversions', conversions FROM fact_google_ads_daily_3m
      UNION ALL SELECT date, 'Google Ads', 'conv_value', conversions_value FROM fact_google_ads_daily_3m
      UNION ALL SELECT date, 'Google Ads', 'roas', CASE WHEN cost > 0 THEN conversions_value / cost ELSE 0 END FROM fact_google_ads_daily_3m WHERE cost > 0
      UNION ALL SELECT date, 'Facebook', 'cost', cost FROM fact_facebook_ads_daily_3m
      UNION ALL SELECT date, 'Facebook', 'purchases', purchases FROM fact_facebook_ads_daily_3m
      UNION ALL SELECT date, 'Facebook', 'purchase_value', purchase_value FROM fact_facebook_ads_daily_3m
      UNION ALL SELECT date, 'Facebook', 'roas', CASE WHEN cost > 0 THEN purchase_value / cost ELSE 0 END FROM fact_facebook_ads_daily_3m WHERE cost > 0
      UNION ALL SELECT date, 'Bing', 'cost', cost FROM fact_bing_ads_daily_3m
      UNION ALL SELECT date, 'Bing', 'conversions', conversions FROM fact_bing_ads_daily_3m
      UNION ALL SELECT date, 'Bing', 'revenue', revenue FROM fact_bing_ads_daily_3m
      UNION ALL SELECT date, 'Web Orders', 'orders', orders FROM agg_cms_daily WHERE date >= CURRENT_DATE - INTERVAL '90 days'
      UNION ALL SELECT date, 'Web Orders', 'revenue', revenue FROM agg_cms_daily WHERE date >= CURRENT_DATE - INTERVAL '90 days'
      UNION ALL SELECT date, 'Web Orders', 'gp', gp FROM agg_cms_daily WHERE date >= CURRENT_DATE - INTERVAL '90 days'
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
      AND ABS((value - mean) / stddev) >= ${Z_THRESHOLD}
      AND date = (SELECT MAX(date) FROM unioned)
    ORDER BY ABS((value - mean) / stddev) DESC
  `;

  return await runQuery<Anomaly>(sql);
}

function fmt(value: number): string {
  if (value < 100) return value.toFixed(2);
  return Math.round(value).toLocaleString();
}

function buildHtml(anomalies: Anomaly[], date: string): string {
  const rows = anomalies.map(a => {
    const direction = a.z_score > 0 ? '↑' : '↓';
    const dirColor = a.z_score > 0 ? '#16a34a' : '#dc2626';
    const severity = Math.abs(a.z_score) >= 3 ? '🚨' : '⚠️';
    const pct = (a.deviation_pct * 100).toFixed(0);
    return `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600;">${severity} ${a.channel}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;font-family:monospace;color:#666;">${a.metric}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;">${fmt(a.value)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;color:#888;">${fmt(a.mean)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;color:${dirColor};font-weight:600;">${direction} ${pct}%</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;font-weight:600;">${a.z_score >= 0 ? '+' : ''}${a.z_score.toFixed(2)}σ</td>
      </tr>`;
  }).join('');

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:760px;margin:0 auto;color:#222;">
      <h2 style="margin-bottom:8px;">Phonebot anomaly scan — ${date}</h2>
      <p style="color:#555;margin-top:0;">${anomalies.length} metric${anomalies.length === 1 ? '' : 's'} outside ±${Z_THRESHOLD}σ of the trailing 28-day baseline.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;background:#fff;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
        <thead style="background:#f5f5f5;">
          <tr>
            <th style="padding:8px 12px;text-align:left;">Channel</th>
            <th style="padding:8px 12px;text-align:left;">Metric</th>
            <th style="padding:8px 12px;text-align:right;">Today</th>
            <th style="padding:8px 12px;text-align:right;">28d mean</th>
            <th style="padding:8px 12px;text-align:right;">Δ</th>
            <th style="padding:8px 12px;text-align:right;">z-score</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#888;font-size:12px;margin-top:16px;">
        Method: 28-day rolling z-score per (channel, metric). Today's value compared to the trailing window (excluding today).
        Configure threshold via <code>ANOMALY_Z_THRESHOLD</code> env var.
      </p>
    </div>
  `;
}

function buildText(anomalies: Anomaly[], date: string): string {
  const lines = anomalies.map(a => {
    const direction = a.z_score > 0 ? 'UP' : 'DOWN';
    const severity = Math.abs(a.z_score) >= 3 ? '!!' : '!';
    const pct = (a.deviation_pct * 100).toFixed(0);
    return `${severity} ${a.channel} / ${a.metric}: ${direction} ${pct}% — today ${fmt(a.value)} vs 28d mean ${fmt(a.mean)} (z=${a.z_score.toFixed(2)})`;
  }).join('\n');
  return `Phonebot anomaly scan — ${date}\n${anomalies.length} metric(s) outside ±${Z_THRESHOLD}σ:\n\n${lines}`;
}

async function sendEmail(anomalies: Anomaly[]): Promise<void> {
  if (anomalies.length === 0) {
    console.log('No anomalies today. Skipping email.');
    return;
  }

  if (!BREVO_API_KEY || !ALERT_EMAIL_TO || !ALERT_EMAIL_FROM) {
    console.log('Email config missing (BREVO_API_KEY / ALERT_EMAIL_TO / ALERT_EMAIL_FROM). Printing instead:');
    console.log(buildText(anomalies, anomalies[0].date));
    return;
  }

  const today = anomalies[0].date;
  const subject = `Phonebot anomaly scan — ${anomalies.length} flag${anomalies.length === 1 ? '' : 's'} (${today})`;

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
      subject,
      htmlContent: buildHtml(anomalies, today),
      textContent: buildText(anomalies, today),
    }),
  });

  if (!res.ok) {
    throw new Error(`Brevo API error: ${res.status} ${await res.text()}`);
  }
  console.log(`Sent ${anomalies.length} anomalies to ${ALERT_EMAIL_TO} via Brevo`);
}

async function main() {
  console.log(`Anomaly worker started. Threshold: z=${Z_THRESHOLD}`);
  await initSchema();
  const anomalies = await detectAnomalies();
  console.log(`Found ${anomalies.length} anomalies on most recent date`);
  await sendEmail(anomalies);
  process.exit(0);
}

main().catch((err) => {
  console.error('Anomaly worker failed:', err);
  process.exit(1);
});
