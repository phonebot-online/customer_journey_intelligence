import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { formatNumber } from '../types';
import { Database, RefreshCw, Server, Cloud, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';

export default function Admin() {
  const ledger = trpc.admin.dataSourceLedger.useQuery();
  const refresh = trpc.admin.refreshSchema.useMutation({
    onSuccess: () => {
      ledger.refetch();
    },
  });
  const [showHosting, setShowHosting] = useState(false);

  const stale = ledger.data?.filter(t => t.status === 'stale').length || 0;
  const aging = ledger.data?.filter(t => t.status === 'aging').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin & Data Refresh</h2>
        <p className="text-sm text-gray-500">Source freshness, manual refresh, hosting + weekly-refresh playbook</p>
      </div>

      {/* Status banner */}
      {(stale > 0 || aging > 0) && (
        <div className={`rounded-lg p-4 border ${stale > 0 ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'}`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className={`w-5 h-5 ${stale > 0 ? 'text-red-700' : 'text-amber-700'}`} />
            <div>
              <p className={`font-semibold ${stale > 0 ? 'text-red-900' : 'text-amber-900'}`}>
                {stale > 0 && `${stale} table${stale > 1 ? 's' : ''} are STALE (>14 days old). `}
                {aging > 0 && `${aging} table${aging > 1 ? 's' : ''} are AGING (>7 days).`}
              </p>
              <p className="text-sm mt-1">Re-pull from Supermetrics + drop fresh CSVs + click Refresh below.</p>
            </div>
          </div>
        </div>
      )}

      {/* Data source ledger + refresh */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Data source ledger</h3>
          </div>
          <button
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
            {refresh.isPending ? 'Refreshing...' : 'Refresh schema (re-read CSVs)'}
          </button>
        </div>
        {refresh.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded p-2 mb-3 text-sm text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Refreshed in {refresh.data?.durationMs}ms at {refresh.data?.refreshedAt.slice(11, 19)}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Table</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Rows</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Date range</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Source CSV</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">File age</th>
                <th className="px-3 py-2 text-center font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ledger.data?.map((t) => (
                <tr key={t.table}>
                  <td className="px-3 py-2 font-medium text-gray-900">{t.table}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatNumber(t.rows)}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{t.minDate && t.maxDate ? `${t.minDate} → ${t.maxDate}` : '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 font-mono">{t.file}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{t.freshness}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${t.status === 'fresh' ? 'bg-green-100 text-green-800' : t.status === 'aging' ? 'bg-amber-100 text-amber-800' : t.status === 'stale' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TrustBadge source="DuckDB schema introspection + filesystem mtime" tier="confirmed" />
      </div>

      {/* Weekly refresh workflow */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Weekly refresh workflow (recommended)</h3>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Currently CSVs are dropped manually after Claude pulls via Supermetrics MCP. To check the dashboard weekly without rebuilding the backend, automate the CSV drop.
          Three escalating options, ranked by setup cost:
        </p>

        <div className="space-y-3">
          {/* Option 1 */}
          <div className="border-l-4 border-green-500 bg-green-50 rounded p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold text-green-900">Option 1: Manual weekly drop (current — keep doing this)</p>
              <span className="text-xs text-green-700">Setup: 0 hrs · Maintenance: 30 min/week</span>
            </div>
            <ol className="text-xs text-gray-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Each Monday, run the same Supermetrics queries we used to populate <code>1_month/</code>, <code>3_month/</code>, <code>6_month/</code>, <code>12_month/</code>.</li>
              <li>Save the new CSVs over the existing ones (same paths).</li>
              <li>Click "Refresh schema" above. DuckDB re-reads CSVs in &lt;5 seconds.</li>
              <li>Dashboard reflects new data immediately.</li>
            </ol>
          </div>

          {/* Option 2 */}
          <div className="border-l-4 border-blue-500 bg-blue-50 rounded p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold text-blue-900">Option 2: Cron + Supermetrics REST API (recommended)</p>
              <span className="text-xs text-blue-700">Setup: 2-4 hrs · Maintenance: 0</span>
            </div>
            <ol className="text-xs text-gray-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Get a Supermetrics API key (separate from MCP — see Supermetrics dashboard).</li>
              <li>Write a Node script <code>scripts/weekly-refresh.ts</code> that calls Supermetrics REST API for each schedule_id (in <code>source_maps/step2_landed_schedule_ids.json</code>).</li>
              <li>Save responses as CSVs to <code>customer_journey_intelligence/&lt;window&gt;/&lt;source&gt;/</code>.</li>
              <li>Cron job: <code>0 2 * * MON cd /path/to/app && tsx scripts/weekly-refresh.ts && curl -X POST localhost:3001/trpc/admin.refreshSchema</code></li>
              <li>Or use a hosted scheduler (GitHub Actions cron, Render cron, Cloud Scheduler).</li>
            </ol>
          </div>

          {/* Option 3 */}
          <div className="border-l-4 border-purple-500 bg-purple-50 rounded p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold text-purple-900">Option 3: Direct platform connectors (long-term)</p>
              <span className="text-xs text-purple-700">Setup: 1-2 weeks · Maintenance: minimal</span>
            </div>
            <ol className="text-xs text-gray-700 mt-2 space-y-1 list-decimal list-inside">
              <li>Replace Supermetrics with direct API connectors: GA4 Data API, Google Ads API, Facebook Marketing API, Bing Ads SDK, Brevo API, GMB API.</li>
              <li>Most expensive setup but eliminates Supermetrics licence dependency.</li>
              <li>Each connector is ~100-300 lines of TypeScript with its own auth flow.</li>
              <li>Drop into <code>api/connectors/&lt;source&gt;.ts</code>, schedule via cron.</li>
              <li>Unlocks daily refresh trivially (currently weekly is enough).</li>
            </ol>
          </div>
        </div>
        <TrustBadge source="Architecture recommendation" tier="inferred" />
      </div>

      {/* Hosting */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Cloud className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Hosting</h3>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Currently runs locally on <code>localhost:3001</code>. To make the dashboard accessible from anywhere (or share with a team), pick one:
        </p>

        <button
          onClick={() => setShowHosting(!showHosting)}
          className="text-sm font-medium text-blue-700 hover:text-blue-900 mb-3"
        >
          {showHosting ? 'Hide' : 'Show'} ranked hosting options
        </button>

        {showHosting && (
          <div className="space-y-3">
            <div className="border border-gray-200 rounded p-3">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-gray-900">Fly.io <span className="text-xs text-green-700 ml-2">RECOMMENDED</span></p>
                <span className="text-xs text-gray-500">~A$5-15/mo for this workload</span>
              </div>
              <ul className="text-xs text-gray-700 mt-2 space-y-1">
                <li>· Hono + DuckDB single-process stack runs cleanly.</li>
                <li>· Persistent volume for the DuckDB file + CSVs.</li>
                <li>· Free tier covers small workloads. <code>fly launch</code> one command.</li>
                <li>· Can deploy from this repo with a 30-line <code>fly.toml</code>.</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-gray-900">Railway</p>
                <span className="text-xs text-gray-500">~A$5-20/mo</span>
              </div>
              <p className="text-xs text-gray-700 mt-1">Similar profile to Fly.io. Slightly nicer UI for non-devs. Persistent volumes supported.</p>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-gray-900">Render</p>
                <span className="text-xs text-gray-500">~A$10-30/mo</span>
              </div>
              <p className="text-xs text-gray-700 mt-1">Free tier sleeps after 15 min idle, paid is fine. Cron jobs built in.</p>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-gray-900">Cloud Run (GCP)</p>
                <span className="text-xs text-gray-500">~A$0-20/mo (serverless)</span>
              </div>
              <p className="text-xs text-gray-700 mt-1">Autoscale-to-zero. Cheapest for low traffic. Container image required. DuckDB + persistent volume = need a separate Cloud Storage mount or restart-on-pull pattern.</p>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-gray-900">VPS (Hetzner / DigitalOcean)</p>
                <span className="text-xs text-gray-500">~A$8/mo flat</span>
              </div>
              <p className="text-xs text-gray-700 mt-1">Most control, lowest ongoing cost. Setup: provision VM, install Node, run with PM2 or systemd. Nginx for HTTPS.</p>
            </div>
          </div>
        )}
        <TrustBadge source="Hosting platform comparison" tier="inferred" />
      </div>

      {/* Tech debt + improvement queue */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Architecture notes</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2"><Clock className="w-4 h-4 text-gray-400 mt-0.5" /> <span><strong>Bundle size warning:</strong> 844kb main bundle. Consider code-splitting via <code>React.lazy</code> for less-used pages (Diagnostics, AI Insights).</span></li>
          <li className="flex gap-2"><Clock className="w-4 h-4 text-gray-400 mt-0.5" /> <span><strong>DuckDB on disk:</strong> The <code>app/data/phonebot.db</code> file persists across restarts. Schema is rebuilt from CSVs each boot — no migration needed.</span></li>
          <li className="flex gap-2"><Clock className="w-4 h-4 text-gray-400 mt-0.5" /> <span><strong>No auth currently:</strong> Anyone with the URL can see everything. Add Cloudflare Access or basic-auth via Hono middleware before public deploy.</span></li>
          <li className="flex gap-2"><Clock className="w-4 h-4 text-gray-400 mt-0.5" /> <span><strong>tRPC + superjson:</strong> handles BigInt+Date serialisation; the duckdb.ts normaliser is a backstop.</span></li>
          <li className="flex gap-2"><Clock className="w-4 h-4 text-gray-400 mt-0.5" /> <span><strong>Backups:</strong> The <code>customer_journey_intelligence/</code> folder is the source of truth. Tar+upload to S3/B2 nightly is sufficient. The DuckDB file is regeneratable.</span></li>
        </ul>
      </div>
    </div>
  );
}
