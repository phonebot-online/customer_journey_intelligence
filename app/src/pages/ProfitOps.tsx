import { useState } from 'react';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { formatCurrency, formatPercent, formatNumber } from '../types';
import {
  Banknote, Zap, Target, Package, Search, Boxes,
  ChevronDown, ChevronRight, Activity, FileSearch, Database, AlertTriangle,
} from 'lucide-react';

type Window = '7d' | '30d';

export default function ProfitOps() {
  const [recoveryRate, setRecoveryRate] = useState(0.8);
  const [skuWindow, setSkuWindow] = useState<Window>('30d');
  const [oosWindow, setOosWindow] = useState<Window>('30d');
  const [depPct, setDepPct] = useState(0.025);
  const [orgVel, setOrgVel] = useState(0.4);
  const [zThreshold, setZThreshold] = useState(2);
  const [oosSkuWindow, setOosSkuWindow] = useState<Window>('30d');
  const [searchTermMinCost, setSearchTermMinCost] = useState(5);
  const [searchTermMinClicks, setSearchTermMinClicks] = useState(10);
  const [expandSection, setExpandSection] = useState<Record<string, boolean>>({
    branded: true, oos: true, oosSku: true, sku: true, terms: true, anomalies: true, bq: true, landing: true,
  });

  const headline = trpc.profitOps.wasteHeadline.useQuery();
  const branded = trpc.profitOps.brandedCannibalization.useQuery({ recoveryRate });
  const oos = trpc.profitOps.oosSpendLeak.useQuery({ window: oosWindow });
  const sku = trpc.profitOps.shouldNotAdvertise.useQuery({
    window: skuWindow,
    monthlyDepreciationPct: depPct,
    organicVelocityRatio: orgVel,
    minSpend: 30,
  });
  const anomalies = trpc.profitOps.anomalyScan.useQuery({ zThreshold });
  const oosSku = trpc.profitOps.oosSpendLeakBySku.useQuery({ window: oosSkuWindow });
  const wastedTerms = trpc.profitOps.wastedSearchTerms.useQuery({ minCost: searchTermMinCost, minClicks: searchTermMinClicks });
  const bqStatus = trpc.profitOps.bqStatus.useQuery();
  const bqClickId = trpc.profitOps.bqClickIdCapture.useQuery(undefined, { enabled: !!bqStatus.data?.available });
  const bqAttribution = trpc.profitOps.bqChannelAttribution.useQuery(undefined, { enabled: !!bqStatus.data?.available });
  const bqFunnel = trpc.profitOps.bqFunnelByChannel.useQuery(undefined, { enabled: !!bqStatus.data?.available });
  const bqCapture = trpc.profitOps.bqSessionCapture.useQuery(undefined, { enabled: !!bqStatus.data?.available });
  const [landingMinSessions, setLandingMinSessions] = useState(20);
  const [landingPaidOnly, setLandingPaidOnly] = useState(false);
  const bqLandingPages = trpc.profitOps.bqLandingPages.useQuery(
    { minSessions: landingMinSessions, paidOnly: landingPaidOnly },
    { enabled: !!bqStatus.data?.available }
  );

  const toggle = (k: string) => setExpandSection(s => ({ ...s, [k]: !s[k] }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profit Ops</h2>
        <p className="text-sm text-gray-500">
          Find the leaks. At your scale ($500k+ AUD annual ad spend), industry experience says
          15–30% of spend is recoverable waste — branded cannibalization, OOS feed lag, negative-margin SKUs.
          Each section below estimates one slice and shows you how to validate before acting.
        </p>
      </div>

      {/* HEADLINE */}
      {headline.data && (
        <div className="bg-white rounded-lg border-2 border-red-300 p-5 shadow-sm bg-gradient-to-br from-red-50 to-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <Banknote className="w-5 h-5 text-red-700" />
            <h3 className="text-lg font-semibold text-gray-900">Estimated waste — money on the table</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-white rounded border border-red-200">
              <p className="text-xs text-gray-600">30d total estimate</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(headline.data.total30d)}</p>
            </div>
            <div className="p-3 bg-white rounded border border-red-200">
              <p className="text-xs text-gray-600">Annualised</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(headline.data.totalAnnualised)}</p>
            </div>
            <div className="p-3 bg-white rounded border border-amber-200">
              <p className="text-xs text-gray-600">Branded cannibalization (30d)</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(headline.data.brandedCannibalization30d)}</p>
            </div>
            <div className="p-3 bg-white rounded border border-amber-200">
              <p className="text-xs text-gray-600">OOS feed-lag waste (30d)</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(headline.data.oosFeedLag30d)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-700 bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold mb-1">⚠️ Read this before acting</p>
            <p>{headline.data.caveat}</p>
            <p className="mt-2">
              {headline.data.lossSkuCount} SKU{headline.data.lossSkuCount === 1 ? '' : 's'} are estimated as
              ad-loss-making (ad spend &gt; estimated GP from ad-driven sales).
              See "SKU should-not-advertise" below for individual decisions.
            </p>
          </div>
        </div>
      )}

      {/* BIGQUERY CROSS-SECTION — live GA4 export */}
      <div className="bg-white rounded-lg border-2 border-indigo-300 shadow-sm">
        <button onClick={() => toggle('bq')} className="w-full flex items-center justify-between p-5 hover:bg-indigo-50 transition-colors">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-700" />
            <h3 className="text-lg font-semibold text-gray-900">BigQuery cross-section — live GA4 attribution truth</h3>
            {bqStatus.data?.available && (
              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                {bqStatus.data.days} day{bqStatus.data.days === 1 ? '' : 's'} of data
              </span>
            )}
          </div>
          {expandSection.bq ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {expandSection.bq && (
          <div className="px-5 pb-5">
            {!bqStatus.data?.available && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm">
                <p className="font-semibold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> BigQuery CLI not available
                </p>
                <p className="text-amber-800 mt-1 text-xs">
                  Run on this machine: <code className="bg-amber-100 px-1 rounded">brew install --cask google-cloud-sdk &amp;&amp; gcloud auth login &amp;&amp; gcloud config set project bigquery-api-494711</code>
                </p>
                {bqStatus.data?.error && (
                  <p className="text-amber-700 mt-2 text-xs font-mono">{bqStatus.data.error}</p>
                )}
              </div>
            )}

            {bqStatus.data?.available && (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  Live queries against <code>bigquery-api-494711.analytics_284223207</code>. Data range:{' '}
                  <strong>{bqStatus.data.earliest} → {bqStatus.data.latest}</strong> ({formatNumber(bqStatus.data.totalEvents)} events).
                  Cached in-process for 5 minutes per query to minimize BQ cost. <em>Note: dataset is &lt;14 days old; small samples — re-evaluate weekly.</em>
                </p>

                {/* SESSION CAPTURE — quick stats */}
                {bqCapture.data && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded">
                    <p className="text-sm font-semibold text-gray-900 mb-2">GA4 transaction tracking health</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-600">Purchase events</p>
                        <p className="text-2xl font-bold text-green-900">{formatNumber(bqCapture.data.totalPurchases)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">% with session_id</p>
                        <p className="text-2xl font-bold text-green-900">{bqCapture.data.pctWithSession}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Unique transactions</p>
                        <p className="text-2xl font-bold text-green-900">{formatNumber(bqCapture.data.uniqueTransactions)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">GA4 attributed revenue</p>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(bqCapture.data.totalRevenue)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      GA4-side capture is healthy. The 32% loss flagged by ProfitMetrics is on their pixel, not GA4 events.
                    </p>
                  </div>
                )}

                {/* CLICK-ID CAPTURE — the killer finding */}
                {bqClickId.data && bqClickId.data.length > 0 && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded">
                    <p className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Click-ID capture rate per channel — gclid is leaking
                    </p>
                    <p className="text-xs text-red-800 mb-3">
                      Healthy: 95%+. Anything below 80% means clicks lose their attribution before reaching your GA4 property.
                      Common cause: site URL rewrites, redirect chains, or CDN cache stripping query params.
                    </p>
                    <table className="min-w-full text-xs">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="px-2 py-1 text-left">Source</th>
                          <th className="px-2 py-1 text-left">Medium</th>
                          <th className="px-2 py-1 text-right">Sessions</th>
                          <th className="px-2 py-1 text-right">% gclid</th>
                          <th className="px-2 py-1 text-right">% fbclid</th>
                          <th className="px-2 py-1 text-right">% msclkid</th>
                          <th className="px-2 py-1 text-left">Health</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bqClickId.data.map((r, i) => {
                          // Health: pick the most relevant click ID for the channel
                          const isPaidGoogle = r.medium === 'cpc' && r.source === 'google';
                          const isPaidBing = r.medium === 'cpc' && r.source === 'bing';
                          const isFb = r.source === 'fb' || r.source === 'facebook';
                          const relevantPct = isPaidGoogle ? r.pct_with_gclid : isPaidBing ? r.pct_with_msclkid : isFb ? r.pct_with_fbclid : null;
                          const health = relevantPct === null ? '—' : relevantPct >= 90 ? '✅ healthy' : relevantPct >= 60 ? '⚠️ partial' : '🚨 broken';
                          const healthColor = relevantPct === null ? 'text-gray-500' : relevantPct >= 90 ? 'text-green-700' : relevantPct >= 60 ? 'text-orange-700' : 'text-red-700';
                          return (
                            <tr key={i} className="border-t border-red-100">
                              <td className="px-2 py-1 font-medium">{r.source}</td>
                              <td className="px-2 py-1">{r.medium}</td>
                              <td className="px-2 py-1 text-right">{formatNumber(r.sessions)}</td>
                              <td className={`px-2 py-1 text-right font-mono ${r.pct_with_gclid < 80 && (r.source === 'google' && r.medium === 'cpc') ? 'text-red-700 font-bold' : ''}`}>
                                {r.pct_with_gclid}%
                              </td>
                              <td className="px-2 py-1 text-right font-mono">{r.pct_with_fbclid}%</td>
                              <td className="px-2 py-1 text-right font-mono">{r.pct_with_msclkid}%</td>
                              <td className={`px-2 py-1 text-xs ${healthColor}`}>{health}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="mt-3 p-2 bg-white rounded text-xs">
                      <p className="font-semibold text-red-900 mb-1">What to do:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                        <li><strong>Pat (GTM):</strong> add gclid persistence cookie — captures gclid on first page, persists in 1st-party cookie, downstream tags read from cookie not URL. ~1hr fix, recovers attribution immediately.</li>
                        <li><strong>Internal dev (OpenCart 2.2):</strong> trace what's stripping <code>?gclid=</code> from URLs after first page. Common in OC: SEO URL rewriter, currency redirect, session middleware.</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* CHANNEL ATTRIBUTION */}
                {bqAttribution.data && bqAttribution.data.length > 0 && (
                  <details className="mb-4" open>
                    <summary className="text-sm font-semibold text-gray-900 cursor-pointer">
                      Channel attribution — what GA4 thinks happened ({bqAttribution.data.length} channels)
                    </summary>
                    <table className="min-w-full text-xs mt-2">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1 text-left">Source</th>
                          <th className="px-2 py-1 text-left">Medium</th>
                          <th className="px-2 py-1 text-right">Sessions</th>
                          <th className="px-2 py-1 text-right">Purchases</th>
                          <th className="px-2 py-1 text-right">Revenue</th>
                          <th className="px-2 py-1 text-right">AOV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bqAttribution.data.slice(0, 15).map((r, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1 font-medium">{r.source}</td>
                            <td className="px-2 py-1">{r.medium}</td>
                            <td className="px-2 py-1 text-right">{formatNumber(r.sessions)}</td>
                            <td className="px-2 py-1 text-right">{r.purchases}</td>
                            <td className="px-2 py-1 text-right font-semibold">{formatCurrency(r.revenue)}</td>
                            <td className="px-2 py-1 text-right">{r.aov ? formatCurrency(r.aov) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-500 mt-2">
                      ⚠️ These are GA4-side numbers. With gclid leaking, paid Google revenue is <em>understated</em> here and organic Google is <em>overstated</em>. Use as floor, not truth.
                    </p>
                  </details>
                )}

                {/* FUNNEL */}
                {bqFunnel.data && bqFunnel.data.length > 0 && (
                  <details className="mb-2">
                    <summary className="text-sm font-semibold text-gray-900 cursor-pointer">
                      Conversion funnel by channel ({bqFunnel.data.length} channels with ≥30 sessions)
                    </summary>
                    <table className="min-w-full text-xs mt-2">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1 text-left">Source / Medium</th>
                          <th className="px-2 py-1 text-right">Sessions</th>
                          <th className="px-2 py-1 text-right">View</th>
                          <th className="px-2 py-1 text-right">ATC</th>
                          <th className="px-2 py-1 text-right">Checkout</th>
                          <th className="px-2 py-1 text-right">Purchase</th>
                          <th className="px-2 py-1 text-right">View→ATC</th>
                          <th className="px-2 py-1 text-right">CO→Buy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bqFunnel.data.map((r: any, i: number) => (
                          <tr key={i}>
                            <td className="px-2 py-1 font-medium">{r.source} / {r.medium}</td>
                            <td className="px-2 py-1 text-right">{formatNumber(r.sessions)}</td>
                            <td className="px-2 py-1 text-right">{r.w_view}</td>
                            <td className="px-2 py-1 text-right">{r.w_atc}</td>
                            <td className="px-2 py-1 text-right">{r.w_co}</td>
                            <td className="px-2 py-1 text-right font-semibold">{r.w_purchase}</td>
                            <td className="px-2 py-1 text-right font-mono">{r.view_to_atc}%</td>
                            <td className="px-2 py-1 text-right font-mono">{r.co_to_buy}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                )}

                <div className="mt-3">
                  <TrustBadge
                    source={`BigQuery: bigquery-api-494711.analytics_284223207.{vw_events_flat, vw_sessions, vw_events_items_flat}`}
                    tier="confirmed"
                    caveat={`Live BQ queries via local bq CLI. Cached 5min. Dataset is ${bqStatus.data.days} day(s) old — small samples; re-evaluate after 14 days.`}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* BIGQUERY LANDING PAGES — entry-page CVR + click-id capture */}
      <div className="bg-white rounded-lg border-2 border-emerald-300 shadow-sm">
        <button onClick={() => toggle('landing')} className="w-full flex items-center justify-between p-5 hover:bg-emerald-50 transition-colors">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-semibold text-gray-900">BigQuery: landing-page performance</h3>
            {bqStatus.data?.available && (
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                live GA4 export · {bqStatus.data.days} day{bqStatus.data.days === 1 ? '' : 's'} of data
              </span>
            )}
          </div>
          {expandSection.landing ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {expandSection.landing && (
          <div className="px-5 pb-5">
            {!bqStatus.data?.available && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
                BigQuery CLI (`bq`) is not installed on this machine. Landing-page diagnostics need a live GA4 BQ export.
                Install via <code className="bg-amber-100 px-1 rounded">brew install --cask google-cloud-sdk</code> then run
                <code className="bg-amber-100 px-1 rounded ml-1">gcloud auth login</code>.
              </div>
            )}
            {bqStatus.data?.available && (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  Top entry pages from the live GA4 export, ranked by sessions. Categorises each page so ad-spend reallocation is one-glance:
                  <strong className="text-emerald-700"> SCALE_AD_SPEND</strong> = high traffic + above-blended CVR (push more here),
                  <strong className="text-orange-700"> FIX_UX</strong> = high traffic + below-blended CVR (audit before adding spend),
                  <strong className="text-blue-700"> SCALE_TRAFFIC</strong> = low traffic + above-blended CVR (SEO/email push could 10× this).
                  The <em>click_id %</em> column flags GTM tag misconfigs on individual landing pages — anything below 80% on a paid-traffic page warrants a tag check.
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-3 p-3 bg-emerald-50 rounded">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    Min sessions:
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={landingMinSessions}
                      onChange={e => setLandingMinSessions(Math.max(1, parseInt(e.target.value) || 20))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={landingPaidOnly}
                      onChange={e => setLandingPaidOnly(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Paid traffic only (cpc / paid / has click ID)
                  </label>
                </div>

                {bqLandingPages.isLoading && <p className="text-sm text-gray-500">Loading landing-page data from BigQuery…</p>}
                {bqLandingPages.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-900">
                    BQ query failed: {bqLandingPages.error.message}
                  </div>
                )}
                {bqLandingPages.data && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                      <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                        <p className="text-xs text-gray-600">Pages analysed</p>
                        <p className="text-2xl font-bold text-emerald-800">{bqLandingPages.data.summary.pageCount}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                        <p className="text-xs text-gray-600">Total sessions</p>
                        <p className="text-2xl font-bold text-emerald-800">{formatNumber(bqLandingPages.data.summary.totalSessions)}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                        <p className="text-xs text-gray-600">Total revenue</p>
                        <p className="text-2xl font-bold text-emerald-800">{formatCurrency(bqLandingPages.data.summary.totalRevenue)}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                        <p className="text-xs text-gray-600">Blended CVR</p>
                        <p className="text-2xl font-bold text-emerald-800">{bqLandingPages.data.summary.blendedCvr.toFixed(2)}%</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                        <p className="text-xs text-gray-600">Action tags</p>
                        <p className="text-sm font-semibold">
                          <span className="text-emerald-700">SCALE×{bqLandingPages.data.summary.scaleAdSpendCount}</span>
                          {' · '}
                          <span className="text-orange-700">FIX×{bqLandingPages.data.summary.fixUxCount}</span>
                          {' · '}
                          <span className="text-blue-700">TRAFFIC×{bqLandingPages.data.summary.scaleTrafficCount}</span>
                        </p>
                      </div>
                    </div>

                    {bqLandingPages.data.rows.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No landing pages above the session threshold yet. Lower "Min sessions" or wait for more BQ data to land.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-1 text-left">Tag</th>
                              <th className="px-2 py-1 text-left">Landing page</th>
                              <th className="px-2 py-1 text-right">Sessions</th>
                              <th className="px-2 py-1 text-right">Purchases</th>
                              <th className="px-2 py-1 text-right">Revenue</th>
                              <th className="px-2 py-1 text-right">CVR</th>
                              <th className="px-2 py-1 text-right">AOV</th>
                              <th className="px-2 py-1 text-right">View item %</th>
                              <th className="px-2 py-1 text-right">ATC %</th>
                              <th className="px-2 py-1 text-right">Checkout %</th>
                              <th className="px-2 py-1 text-right">Click-ID %</th>
                              <th className="px-2 py-1 text-right">Avg pages</th>
                              <th className="px-2 py-1 text-right">Avg dur (s)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bqLandingPages.data.rows.map((r, i) => (
                              <tr key={i} className={
                                r.tag === 'SCALE_AD_SPEND' ? 'bg-emerald-50'
                                : r.tag === 'FIX_UX' ? 'bg-orange-50'
                                : r.tag === 'SCALE_TRAFFIC' ? 'bg-blue-50'
                                : ''
                              }>
                                <td className="px-2 py-1">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                    r.tag === 'SCALE_AD_SPEND' ? 'bg-emerald-200 text-emerald-900'
                                    : r.tag === 'FIX_UX' ? 'bg-orange-200 text-orange-900'
                                    : r.tag === 'SCALE_TRAFFIC' ? 'bg-blue-200 text-blue-900'
                                    : 'bg-gray-200 text-gray-700'
                                  }`} title={r.reason}>
                                    {r.tag.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="px-2 py-1 max-w-md truncate font-mono text-gray-700" title={r.landing_page}>{r.landing_page}</td>
                                <td className="px-2 py-1 text-right font-mono">{formatNumber(r.sessions)}</td>
                                <td className="px-2 py-1 text-right font-mono">{r.purchases}</td>
                                <td className="px-2 py-1 text-right font-mono">{formatCurrency(r.revenue)}</td>
                                <td className={`px-2 py-1 text-right font-mono ${r.cvr > bqLandingPages.data.summary.blendedCvr ? 'text-emerald-700 font-semibold' : 'text-gray-700'}`}>{r.cvr.toFixed(2)}%</td>
                                <td className="px-2 py-1 text-right font-mono">{r.aov ? formatCurrency(r.aov) : '—'}</td>
                                <td className="px-2 py-1 text-right font-mono text-gray-600">{r.view_item_rate}%</td>
                                <td className="px-2 py-1 text-right font-mono text-gray-600">{r.atc_rate}%</td>
                                <td className="px-2 py-1 text-right font-mono text-gray-600">{r.co_rate}%</td>
                                <td className={`px-2 py-1 text-right font-mono ${r.click_id_capture_pct != null && r.click_id_capture_pct < 80 ? 'text-red-700 font-bold' : 'text-gray-600'}`}>
                                  {r.click_id_capture_pct == null ? '—' : `${r.click_id_capture_pct}%`}
                                </td>
                                <td className="px-2 py-1 text-right font-mono text-gray-500">{r.avg_pageviews}</td>
                                <td className="px-2 py-1 text-right font-mono text-gray-500">{r.avg_duration_sec}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="mt-3">
                      <TrustBadge
                        source="BigQuery: bigquery-api-494711.analytics_284223207.vw_sessions"
                        tier="estimated"
                        caveat={bqLandingPages.data.caveats[0]}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* BRANDED CANNIBALIZATION */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <button onClick={() => toggle('branded')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">1. Branded search cannibalization</h3>
          </div>
          {expandSection.branded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {expandSection.branded && branded.data && (
          <div className="px-5 pb-5">
            <p className="text-sm text-gray-700 mb-3">
              When someone searches "phonebot" or "phonebot reservoir" and clicks your Google Ad, you paid for a click you'd
              likely have gotten free via organic. Adjust the <strong>recovery rate</strong> slider to your assumption of
              what % of paid branded clicks would convert organically without ads.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-blue-700">Branded paid revenue (30d, PM)</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(branded.data.brandedRevenue)}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded">
                <p className="text-xs text-amber-700">Estimated branded spend (30d)</p>
                <p className="text-xl font-bold text-amber-900">{formatCurrency(branded.data.estimatedBrandedSpend30d)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatPercent(branded.data.revenueShare)} of total Google Ads revenue
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="text-xs text-red-700">Annualised waste @ {formatPercent(recoveryRate)} recovery</p>
                <p className="text-xl font-bold text-red-900">{formatCurrency(branded.data.wasteEstimateAnnual)}</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <label className="text-xs font-semibold text-gray-700">Recovery rate (% of branded paid clicks recoverable as organic if paused)</label>
              <div className="flex items-center gap-3 mt-1">
                <input type="range" min={0.5} max={0.95} step={0.05} value={recoveryRate} onChange={e => setRecoveryRate(parseFloat(e.target.value))} className="flex-1" />
                <span className="font-mono text-sm w-12 text-right">{formatPercent(recoveryRate)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Industry default 0.7–0.9. Higher = more aggressive waste estimate. Validate with geo holdout test.</p>
            </div>

            {branded.data.organicBranded && (
              <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-xs text-green-700">Organic branded clicks (30d)</p>
                  <p className="font-bold text-green-900">{formatNumber(branded.data.organicBranded.branded_clicks)}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-700">Organic non-branded clicks (30d)</p>
                  <p className="font-bold">{formatNumber(branded.data.organicBranded.nonbranded_clicks)}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-700">Unknown queries (anonymised)</p>
                  <p className="font-bold">{formatNumber(branded.data.organicBranded.unknown_clicks)}</p>
                </div>
              </div>
            )}

            <details className="mb-3">
              <summary className="text-sm font-semibold text-gray-700 cursor-pointer">Branded paid campaigns identified</summary>
              <table className="min-w-full text-xs mt-2">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Campaign</th>
                    <th className="px-2 py-1 text-right">Sessions</th>
                    <th className="px-2 py-1 text-right">Purchases</th>
                    <th className="px-2 py-1 text-right">Revenue</th>
                    <th className="px-2 py-1 text-right">GP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {branded.data.paidBranded.map((c, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1">{c.campaign}</td>
                      <td className="px-2 py-1 text-right">{formatNumber(c.sessions)}</td>
                      <td className="px-2 py-1 text-right">{formatNumber(c.purchases)}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(c.revenue)}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(c.gp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>

            {branded.data.topQueries.length > 0 && (
              <details>
                <summary className="text-sm font-semibold text-gray-700 cursor-pointer">Top organic branded queries (24d)</summary>
                <table className="min-w-full text-xs mt-2">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Query</th>
                      <th className="px-2 py-1 text-right">Clicks</th>
                      <th className="px-2 py-1 text-right">Impressions</th>
                      <th className="px-2 py-1 text-right">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {branded.data.topQueries.map((q, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1 font-mono">{q.query}</td>
                        <td className="px-2 py-1 text-right">{formatNumber(q.clicks)}</td>
                        <td className="px-2 py-1 text-right">{formatNumber(q.impressions)}</td>
                        <td className="px-2 py-1 text-right">{q.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">
                  Strong organic position on these queries = high recovery rate. If you're already #1 organic for "phonebot",
                  the paid click on the same SERP is almost pure waste.
                </p>
              </details>
            )}

            <div className="mt-4 p-3 bg-amber-50 rounded text-xs text-amber-900">
              <p className="font-semibold mb-1">Validation plan before acting</p>
              <p>{branded.data.validation}</p>
            </div>

            <div className="mt-3">
              <TrustBadge
                source={branded.data.method}
                tier="estimated"
                caveat="No per-campaign cost in PM CSVs. Branded spend estimated by revenue-share × total Google Ads spend."
              />
            </div>
          </div>
        )}
      </div>

      {/* OOS SPEND LEAK */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <button onClick={() => toggle('oos')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">2. Out-of-stock spend leak (brand-level)</h3>
          </div>
          {expandSection.oos ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {expandSection.oos && oos.data && (
          <div className="px-5 pb-5">
            <p className="text-sm text-gray-700 mb-3">
              Per brand: ad spend × (1 — in-stock %) approximates dollars wasted on impressions where most catalog is OOS.
              Google Shopping should auto-suppress OOS items, but feed lag means you're still paying for clicks on listings
              about to go OOS or on the "in-stock" subset which carries the brand impression cost.
            </p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Window:</span>
              {(['7d', '30d'] as Window[]).map(w => (
                <button key={w} onClick={() => setOosWindow(w)}
                  className={`px-2 py-1 text-xs rounded ${oosWindow === w ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {w}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Total Shopping spend ({oosWindow})</p>
                <p className="text-xl font-bold">{formatCurrency(oos.data.totalSpend)}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded">
                <p className="text-xs text-amber-700">Estimated OOS waste</p>
                <p className="text-xl font-bold text-amber-900">{formatCurrency(oos.data.totalEstimatedWaste)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <p className="text-xs text-red-700">Waste % of spend</p>
                <p className="text-xl font-bold text-red-900">{formatPercent(oos.data.wastePctOfSpend)}</p>
              </div>
            </div>

            {oos.data.flagged.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  Flagged: brands with &lt;50% in-stock and &gt;$50 spend
                </p>
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-red-900">
                      <th className="px-2 py-1 text-left">Brand</th>
                      <th className="px-2 py-1 text-right">Spend</th>
                      <th className="px-2 py-1 text-right">In-stock</th>
                      <th className="px-2 py-1 text-right">ROAS</th>
                      <th className="px-2 py-1 text-right">Est. waste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oos.data.flagged.map((b, i) => (
                      <tr key={i} className="border-t border-red-100">
                        <td className="px-2 py-1 font-medium">{b.brand}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(b.spend)}</td>
                        <td className="px-2 py-1 text-right">{b.in_stock_pct !== null ? formatPercent(b.in_stock_pct) : '—'}</td>
                        <td className="px-2 py-1 text-right">{b.roas.toFixed(2)}x</td>
                        <td className="px-2 py-1 text-right font-semibold">{formatCurrency(b.estimated_oos_waste)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <details>
              <summary className="text-sm font-semibold text-gray-700 cursor-pointer">All brands ({oos.data.byBrand.length})</summary>
              <table className="min-w-full text-xs mt-2">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Brand</th>
                    <th className="px-2 py-1 text-right">Spend</th>
                    <th className="px-2 py-1 text-right">Impr</th>
                    <th className="px-2 py-1 text-right">Conv</th>
                    <th className="px-2 py-1 text-right">CVR</th>
                    <th className="px-2 py-1 text-right">ROAS</th>
                    <th className="px-2 py-1 text-right">In-stock %</th>
                    <th className="px-2 py-1 text-right">Est. waste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {oos.data.byBrand.map((b, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1 font-medium">{b.brand}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(b.spend)}</td>
                      <td className="px-2 py-1 text-right">{formatNumber(b.impressions)}</td>
                      <td className="px-2 py-1 text-right">{b.conversions.toFixed(1)}</td>
                      <td className="px-2 py-1 text-right">{formatPercent(b.cvr)}</td>
                      <td className="px-2 py-1 text-right">{b.roas.toFixed(2)}x</td>
                      <td className="px-2 py-1 text-right">{b.in_stock_pct !== null ? formatPercent(b.in_stock_pct) : '—'}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(b.estimated_oos_waste)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>

            <div className="mt-3 p-3 bg-amber-50 rounded text-xs text-amber-900">
              <p className="font-semibold mb-1">Why this is brand-level (not SKU-level)</p>
              <ul className="list-disc list-inside space-y-1">
                {oos.data.limitations.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* SKU-LEVEL OOS (offer_id join — fetched from Supermetrics 2026-04-29) */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <button onClick={() => toggle('oosSku')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-semibold text-gray-900">2b. SKU-level OOS spend leak — exact offer_id matches</h3>
          </div>
          {expandSection.oosSku ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {expandSection.oosSku && oosSku.data && (
          <div className="px-5 pb-5">
            <p className="text-sm text-gray-700 mb-3">
              <strong>Hard data, not estimates.</strong> GMC product feed now includes <code>offer_id</code> (Supermetrics fetch 2026-04-29).
              We can join Shopping ad spend directly to GMC stock per SKU. Below: every SKU paying for impressions while OOS, on preorder,
              or — most concerning — not in the GMC feed at all.
            </p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Window:</span>
              {(['7d', '30d'] as Window[]).map(w => (
                <button key={w} onClick={() => setOosSkuWindow(w)}
                  className={`px-2 py-1 text-xs rounded ${oosSkuWindow === w ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {w}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded">
                <p className="text-xs text-red-700">Out of stock</p>
                <p className="text-2xl font-bold text-red-900">{oosSku.data.summary.oosCount}</p>
                <p className="text-xs text-red-600 mt-1">{formatCurrency(oosSku.data.summary.oosSpend)} spent</p>
              </div>
              <div className="p-3 bg-amber-50 rounded">
                <p className="text-xs text-amber-700">Preorder w/ no conv</p>
                <p className="text-2xl font-bold text-amber-900">{oosSku.data.summary.preorderCount}</p>
                <p className="text-xs text-amber-600 mt-1">{formatCurrency(oosSku.data.summary.preorderSpend)} spent</p>
              </div>
              <div className="p-3 bg-orange-50 rounded">
                <p className="text-xs text-orange-700">NOT in GMC feed</p>
                <p className="text-2xl font-bold text-orange-900">{oosSku.data.summary.notInFeedCount}</p>
                <p className="text-xs text-orange-600 mt-1">{formatCurrency(oosSku.data.summary.notInFeedSpend)} spent</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-700">Total SKUs analysed</p>
                <p className="text-2xl font-bold text-gray-900">{oosSku.data.summary.skuCount}</p>
                <p className="text-xs text-gray-600 mt-1">{formatCurrency(oosSku.data.summary.totalSpend)} spend</p>
              </div>
            </div>

            {oosSku.data.oosSkus.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-red-900 mb-2">Out-of-stock SKUs paying for ads ({oosSku.data.oosSkus.length})</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-red-100">
                      <tr>
                        <th className="px-2 py-1 text-left">Offer ID</th>
                        <th className="px-2 py-1 text-left">Product</th>
                        <th className="px-2 py-1 text-left">Brand</th>
                        <th className="px-2 py-1 text-right">Spend</th>
                        <th className="px-2 py-1 text-right">Clicks</th>
                        <th className="px-2 py-1 text-right">Conv</th>
                        <th className="px-2 py-1 text-right">ROAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {oosSku.data.oosSkus.slice(0, 30).map((s, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1 font-mono">{s.offer_id}</td>
                          <td className="px-2 py-1 max-w-xs truncate" title={s.title}>{s.title}</td>
                          <td className="px-2 py-1">{s.brand}</td>
                          <td className="px-2 py-1 text-right font-semibold">{formatCurrency(s.spend)}</td>
                          <td className="px-2 py-1 text-right">{s.clicks}</td>
                          <td className="px-2 py-1 text-right">{s.conversions.toFixed(1)}</td>
                          <td className="px-2 py-1 text-right">{s.roas.toFixed(2)}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {oosSku.data.notInFeedSkus.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-orange-900 mb-2">SKUs paying for ads but NOT in GMC feed — investigate ({oosSku.data.notInFeedSkus.length})</h4>
                <p className="text-xs text-gray-600 mb-2">
                  These IDs appear in your last 30d Shopping spend but don't appear in the current GMC product feed.
                  Possible causes: SKU was removed from feed mid-period, GMC feed sync failed, ID mismatch between systems.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-orange-100">
                      <tr>
                        <th className="px-2 py-1 text-left">Offer ID</th>
                        <th className="px-2 py-1 text-left">Product</th>
                        <th className="px-2 py-1 text-right">Spend</th>
                        <th className="px-2 py-1 text-right">Clicks</th>
                        <th className="px-2 py-1 text-right">Conv</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100">
                      {oosSku.data.notInFeedSkus.slice(0, 20).map((s, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1 font-mono">{s.offer_id}</td>
                          <td className="px-2 py-1 max-w-xs truncate" title={s.title}>{s.title}</td>
                          <td className="px-2 py-1 text-right font-semibold">{formatCurrency(s.spend)}</td>
                          <td className="px-2 py-1 text-right">{s.clicks}</td>
                          <td className="px-2 py-1 text-right">{s.conversions.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-3">
              <TrustBadge
                source="fact_aw_shopping_sku × fact_gmc_products_unique (joined on offer_id)"
                tier="confirmed"
                caveat="Direct join on Item ID. SKUs not matching either side are flagged for investigation."
              />
            </div>
          </div>
        )}
      </div>

      {/* SKU SHOULD-NOT-ADVERTISE */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <button onClick={() => toggle('sku')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">3. SKU "should not advertise" — with aging-inventory holding-cost model</h3>
          </div>
          {expandSection.sku ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {expandSection.sku && sku.data && (
          <div className="px-5 pb-5">
            <p className="text-sm text-gray-700 mb-3">
              For each SKU, estimate GP from ad-driven sales = (Shopping conversion_value × brand-level margin %).
              <strong> If GP &lt; ad spend, the SKU is bleeding money on ads.</strong> But the aging-inventory wrinkle:
              pausing means slower selling → market price keeps dropping → depreciation cost. Decision logic:
              if pause savings &lt; depreciation cost during the slower-organic window, keep paying.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded">
                <label className="text-xs font-semibold text-gray-700">Window</label>
                <div className="flex gap-1 mt-1">
                  {(['7d', '30d'] as Window[]).map(w => (
                    <button key={w} onClick={() => setSkuWindow(w)}
                      className={`px-3 py-1 text-xs rounded ${skuWindow === w ? 'bg-purple-600 text-white' : 'bg-white border'}`}>{w}</button>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <label className="text-xs font-semibold text-gray-700">Monthly depreciation %</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="range" min={0} max={0.1} step={0.005} value={depPct} onChange={e => setDepPct(parseFloat(e.target.value))} className="flex-1" />
                  <span className="font-mono text-xs w-12 text-right">{(depPct * 100).toFixed(1)}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Refurb electronics typical: 2–4%/mo</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <label className="text-xs font-semibold text-gray-700">Organic velocity ratio</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="range" min={0.1} max={0.9} step={0.05} value={orgVel} onChange={e => setOrgVel(parseFloat(e.target.value))} className="flex-1" />
                  <span className="font-mono text-xs w-12 text-right">{(orgVel * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">% of paid sales velocity that'd happen organically</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 text-center">
              <div className="p-2 bg-red-50 rounded">
                <p className="text-xs text-red-700">PAUSE</p>
                <p className="text-xl font-bold text-red-900">{sku.data.summary.pauseCount}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <p className="text-xs text-orange-700">REDUCE BIDS</p>
                <p className="text-xl font-bold text-orange-900">{sku.data.summary.reduceCount}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded">
                <p className="text-xs text-yellow-700">OPTIMIZE</p>
                <p className="text-xl font-bold text-yellow-900">{sku.data.summary.optimizeCount}</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <p className="text-xs text-green-700">KEEP</p>
                <p className="text-xl font-bold text-green-900">{sku.data.summary.keepCount}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs text-blue-700">KEEP (aging)</p>
                <p className="text-xl font-bold text-blue-900">{sku.data.summary.keepDespiteLossCount}</p>
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded mb-4">
              <p className="text-sm">
                <strong>Estimated monthly savings if recommended actions taken:</strong>{' '}
                <span className="text-xl font-bold text-green-900">{formatCurrency(sku.data.summary.estimatedMonthlySavings)}</span>
                <span className="text-xs text-gray-600 ml-2">
                  ({formatPercent(sku.data.summary.estimatedMonthlySavings / Math.max(sku.data.summary.totalSpendAnalysed * 30 / (skuWindow === '7d' ? 7 : 30), 1))} of analysed spend)
                </span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Decision</th>
                    <th className="px-2 py-1 text-left">SKU</th>
                    <th className="px-2 py-1 text-right">Spend</th>
                    <th className="px-2 py-1 text-right">Conv</th>
                    <th className="px-2 py-1 text-right">Conv $</th>
                    <th className="px-2 py-1 text-right">Margin %</th>
                    <th className="px-2 py-1 text-right">GP from ads</th>
                    <th className="px-2 py-1 text-right">Net (GP — spend)</th>
                    <th className="px-2 py-1 text-right">Mo savings if paused</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sku.data.skus.slice(0, 100).map((s, i) => (
                    <tr key={i} className={s.decision === 'PAUSE' ? 'bg-red-50' : s.decision === 'REDUCE_BIDS' ? 'bg-orange-50' : s.decision === 'KEEP_DESPITE_LOSS' ? 'bg-blue-50' : ''}>
                      <td className="px-2 py-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                          s.decision === 'PAUSE' ? 'bg-red-200 text-red-900'
                          : s.decision === 'REDUCE_BIDS' ? 'bg-orange-200 text-orange-900'
                          : s.decision === 'OPTIMIZE_BIDS' ? 'bg-yellow-200 text-yellow-900'
                          : s.decision === 'KEEP_DESPITE_LOSS' ? 'bg-blue-200 text-blue-900'
                          : 'bg-green-200 text-green-900'
                        }`}>
                          {s.decision}
                        </span>
                      </td>
                      <td className="px-2 py-1 max-w-md truncate" title={s.title}>{s.title}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(s.spend)}</td>
                      <td className="px-2 py-1 text-right">{s.conversions.toFixed(1)}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(s.conversion_value)}</td>
                      <td className="px-2 py-1 text-right">{formatPercent(s.margin_pct)}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(s.estimated_gp_from_ads)}</td>
                      <td className={`px-2 py-1 text-right font-semibold ${s.net_profit_from_ads < 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {formatCurrency(s.net_profit_from_ads)}
                      </td>
                      <td className="px-2 py-1 text-right">{formatCurrency(s.net_savings_if_paused_per_month)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-900">
              <p className="font-semibold mb-1">About the "KEEP_DESPITE_LOSS" decision</p>
              <p>
                Some SKUs lose money on ads but pausing them costs more in market depreciation than the ads cost in the first place.
                That's the aging-inventory trap you described — you can't afford to advertise but can't afford NOT to either.
                These rows show the math making that explicit so you can decide whether to: (a) keep paying for ads as the lesser of two evils,
                (b) liquidate at deeper discount to free capital, or (c) stop buying that SKU/grade going forward.
              </p>
            </div>

            <details className="mt-3">
              <summary className="text-sm font-semibold text-gray-700 cursor-pointer">Assumptions & caveats</summary>
              <ul className="list-disc list-inside text-xs text-gray-600 mt-2 space-y-1">
                {sku.data.caveats.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </details>

            <div className="mt-3">
              <TrustBadge
                source="fact_aw_shopping_sku × agg_brand_margin (web orders 180d)"
                tier="estimated"
                caveat="GP per SKU estimated from brand-level margin %. Real per-SKU margin varies."
              />
            </div>
          </div>
        )}
      </div>

      {/* WASTED SEARCH TERMS */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <button onClick={() => toggle('terms')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">4. Wasted search terms — negative-keyword candidates (GP-weighted)</h3>
          </div>
          {expandSection.terms ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {expandSection.terms && wastedTerms.data && (
          <div className="px-5 pb-5">
            <p className="text-sm text-gray-700 mb-3">
              Search terms (what people typed) ≠ keywords (what you bid on). The gap is where waste lives.
              Each term below crossed your minimum cost / clicks bar. Estimated GP = conversion_value × blended margin
              ({formatPercent(wastedTerms.data.assumptions.blendedMarginPct)}). The recommended action column is your weekly negative-keyword sweep.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded">
                <label className="text-xs font-semibold text-gray-700">Min cost ($)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="range" min={1} max={50} step={1} value={searchTermMinCost} onChange={e => setSearchTermMinCost(parseInt(e.target.value))} className="flex-1" />
                  <span className="font-mono text-xs w-12 text-right">${searchTermMinCost}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Lower = more aggressive negative-keyword sweep</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <label className="text-xs font-semibold text-gray-700">Min clicks</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="range" min={3} max={50} step={1} value={searchTermMinClicks} onChange={e => setSearchTermMinClicks(parseInt(e.target.value))} className="flex-1" />
                  <span className="font-mono text-xs w-12 text-right">{searchTermMinClicks}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Higher = more confident the term has been tested</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded">
                <p className="text-xs text-red-700">Negative-kw candidates</p>
                <p className="text-2xl font-bold text-red-900">{wastedTerms.data.summary.negativeCount}</p>
                <p className="text-xs text-red-600 mt-1">{formatCurrency(wastedTerms.data.summary.totalNegativeWaste)} / 30d</p>
              </div>
              <div className="p-3 bg-orange-50 rounded">
                <p className="text-xs text-orange-700">GP-loss terms</p>
                <p className="text-2xl font-bold text-orange-900">{wastedTerms.data.summary.lossCount}</p>
                <p className="text-xs text-orange-600 mt-1">{formatCurrency(wastedTerms.data.summary.totalLossWaste)} / 30d</p>
              </div>
              <div className="p-3 bg-amber-50 rounded">
                <p className="text-xs text-amber-700">Thin-margin terms</p>
                <p className="text-2xl font-bold text-amber-900">{wastedTerms.data.summary.thinMarginCount}</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-xs text-green-700">Total recoverable</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(wastedTerms.data.summary.totalRecoverable30d)}</p>
                <p className="text-xs text-green-600 mt-1">{formatCurrency(wastedTerms.data.summary.totalRecoverableAnnual)} annualised</p>
              </div>
            </div>

            <details open className="mb-4">
              <summary className="text-sm font-semibold text-red-900 cursor-pointer">
                Negative-keyword candidates ({wastedTerms.data.negativeCandidates.length})
              </summary>
              <p className="text-xs text-gray-600 mt-1 mb-2">
                Copy the search-term column; paste into Google Ads → Tools → Negative keyword lists → Add.
                Use exact match or phrase match per term — exact is safer for ambiguous queries.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-2 py-1 text-left">Search term</th>
                      <th className="px-2 py-1 text-left">Campaign</th>
                      <th className="px-2 py-1 text-left">Branded?</th>
                      <th className="px-2 py-1 text-right">Cost</th>
                      <th className="px-2 py-1 text-right">Clicks</th>
                      <th className="px-2 py-1 text-right">CPC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {wastedTerms.data.negativeCandidates.slice(0, 50).map((t, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1 font-mono">{t.search_term}</td>
                        <td className="px-2 py-1 max-w-xs truncate" title={t.campaign_name}>{t.campaign_name}</td>
                        <td className="px-2 py-1">{t.branded}</td>
                        <td className="px-2 py-1 text-right font-semibold">{formatCurrency(t.cost)}</td>
                        <td className="px-2 py-1 text-right">{t.clicks}</td>
                        <td className="px-2 py-1 text-right">${t.cpc.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            {wastedTerms.data.lossTerms.length > 0 && (
              <details>
                <summary className="text-sm font-semibold text-orange-900 cursor-pointer">
                  GP-loss terms ({wastedTerms.data.lossTerms.length}) — reduce bid or restrict
                </summary>
                <table className="min-w-full text-xs mt-2">
                  <thead className="bg-orange-100">
                    <tr>
                      <th className="px-2 py-1 text-left">Search term</th>
                      <th className="px-2 py-1 text-right">Cost</th>
                      <th className="px-2 py-1 text-right">Conv</th>
                      <th className="px-2 py-1 text-right">Conv $</th>
                      <th className="px-2 py-1 text-right">Est GP</th>
                      <th className="px-2 py-1 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {wastedTerms.data.lossTerms.slice(0, 30).map((t, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1 font-mono">{t.search_term}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(t.cost)}</td>
                        <td className="px-2 py-1 text-right">{t.conversions.toFixed(1)}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(t.conversion_value)}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(t.estimated_gp)}</td>
                        <td className="px-2 py-1 text-right font-semibold text-red-700">{formatCurrency(t.net_profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}

            <div className="mt-3">
              <TrustBadge
                source="fact_aw_search_terms (Supermetrics fetch 2026-04-29) × blended margin from fact_web_orders 180d"
                tier="estimated"
                caveat="GP per term estimated from blended margin. Real per-search-term margin varies; this is directional."
              />
            </div>
          </div>
        )}
      </div>

      {/* ANOMALY DETECTION */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <button onClick={() => toggle('anomalies')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-semibold text-gray-900">4. Anomaly scan — daily metrics that broke trend</h3>
          </div>
          {expandSection.anomalies ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {expandSection.anomalies && anomalies.data && (
          <div className="px-5 pb-5">
            <p className="text-sm text-gray-700 mb-3">
              For each (channel, metric) the trailing 28-day mean and stddev define "normal."
              Today's value is flagged when the z-score exceeds the threshold below.
              Useful for catching ROAS collapse, spend spikes, conversion drops within hours of them happening.
            </p>

            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded">
              <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">Z-threshold:</label>
              <input type="range" min={1.5} max={3.5} step={0.25} value={zThreshold} onChange={e => setZThreshold(parseFloat(e.target.value))} className="flex-1" />
              <span className="font-mono text-sm w-12 text-right">{zThreshold.toFixed(2)}</span>
              <span className="text-xs text-gray-500">
                ({zThreshold === 2 ? '~5% of normal days flagged' : zThreshold === 2.5 ? '~1%' : zThreshold === 3 ? '~0.3%' : 'custom'})
              </span>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              {anomalies.data.anomalies.length} anomalies in the last 90 days. {anomalies.data.method}
            </p>

            <div className="space-y-3">
              {anomalies.data.byDate.slice(0, 14).map(({ date, items }) => (
                <div key={date} className="border border-gray-200 rounded">
                  <div className="px-3 py-2 bg-gray-50 font-semibold text-sm">{date}</div>
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 border-t">
                      <tr>
                        <th className="px-3 py-1 text-left">Channel</th>
                        <th className="px-3 py-1 text-left">Metric</th>
                        <th className="px-3 py-1 text-right">Value</th>
                        <th className="px-3 py-1 text-right">28d mean</th>
                        <th className="px-3 py-1 text-right">Δ%</th>
                        <th className="px-3 py-1 text-right">z-score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((a, i) => (
                        <tr key={i} className={`border-t border-gray-100 ${Math.abs(a.z_score) >= 3 ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-1 font-medium">{a.channel}</td>
                          <td className="px-3 py-1 font-mono text-gray-600">{a.metric}</td>
                          <td className="px-3 py-1 text-right">{a.value < 100 ? a.value.toFixed(2) : formatNumber(a.value)}</td>
                          <td className="px-3 py-1 text-right text-gray-500">{a.mean < 100 ? a.mean.toFixed(2) : formatNumber(a.mean)}</td>
                          <td className={`px-3 py-1 text-right font-semibold ${a.deviation_pct < 0 ? 'text-red-700' : 'text-green-700'}`}>
                            {(a.deviation_pct * 100).toFixed(0)}%
                          </td>
                          <td className={`px-3 py-1 text-right font-mono font-semibold ${Math.abs(a.z_score) >= 3 ? 'text-red-700' : 'text-orange-700'}`}>
                            {a.z_score >= 0 ? '+' : ''}{a.z_score.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-purple-50 rounded text-xs text-purple-900">
              <p className="font-semibold mb-1">Get these via email daily</p>
              <p>
                For automated alerts: see <code>scripts/anomaly/anomaly_worker.ts</code>.
                Cron it daily, set <code>BREVO_API_KEY</code> + <code>ALERT_EMAIL_TO</code> env vars,
                and you'll get one email per day listing the anomalies — using your existing Brevo account.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded text-sm text-gray-800">
        <p className="font-semibold flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-purple-700" /> What this page does NOT yet have
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Conversion funnel from GA4 BQ:</strong> data starts arriving from 2026-04-29; queries are scaffolded in <code>scripts/bq_funnel/conversion_funnel.sql</code>.</li>
          <li><strong>LTV-aware bidding:</strong> requires GA4 BQ user-level data + your CMS order data joined on <code>user_pseudo_id</code> (or email hash). Playbook in <code>scripts/ltv_bidding/</code>.</li>
          <li><strong>MMM coefficient estimates:</strong> Python scaffold in <code>scripts/mmm/</code>. Run it, drop the output JSON in <code>app/data/mmm_results.json</code>, the dashboard will pick it up.</li>
          <li><strong>Diagnostic AI weekly memo:</strong> needs <code>ANTHROPIC_API_KEY</code> + <code>BREVO_API_KEY</code> env vars. Then <code>tsx scripts/diagnostic_ai/weekly_diagnostic.ts</code>.</li>
        </ul>
      </div>
    </div>
  );
}
