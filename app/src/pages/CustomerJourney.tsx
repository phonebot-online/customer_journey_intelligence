import { useSearchParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, formatNumber, formatPercent } from '../types';

export default function CustomerJourney() {
  const [searchParams] = useSearchParams();
  const window = (searchParams.get('window') || '1m') as '1m' | '3m' | '6m' | '12m';

  const cohorts = trpc.sources.cohortRetention.useQuery();
  const journey = trpc.strategy.journeyStages.useQuery({ window });

  const stages = journey.data?.aggregate;
  const byChannel = journey.data?.byChannel || [];

  // Aggregate funnel chart data
  const funnelChart = stages ? [
    { stage: 'Sessions', value: stages.sessions, label: formatNumber(stages.sessions) },
    { stage: 'Add to Cart', value: stages.addToCarts, label: formatNumber(stages.addToCarts) },
    { stage: 'Checkout', value: stages.checkouts, label: formatNumber(stages.checkouts) },
    { stage: 'Purchase (GA4)', value: stages.purchasesGA4, label: formatNumber(stages.purchasesGA4) },
    { stage: 'Purchase (CMS truth)', value: stages.purchasesCMS, label: formatNumber(stages.purchasesCMS) },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Customer Journey</h2>
        <p className="text-sm text-gray-500">Demand → Session → Cart → Checkout → Purchase → Repeat — by channel where data permits</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 font-medium">Attribution Limitation</p>
        <p className="text-sm text-amber-700 mt-1">
          CMS orders have NO utm_source/medium/campaign/gclid/fbclid fields. Strict order-level multi-touch attribution is impossible.
          GA4 channel funnel below uses last-click attribution (undercounts ~20% vs CMS truth).
        </p>
      </div>

      {/* Demand Stage */}
      {stages && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Stage 1: Demand creation</h3>
          <p className="text-sm text-gray-500 mb-3">Upstream signals — multiple sources, no single channel attribution</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="p-3 bg-purple-50 rounded">
              <p className="text-xs text-purple-600">GSC organic clicks (30d)</p>
              <p className="text-2xl font-bold text-purple-900">{formatNumber(stages.demand.gscClicks)}</p>
              <p className="text-xs text-purple-700 mt-1">Branded + non-branded + unknown</p>
            </div>
            <div className="p-3 bg-orange-50 rounded">
              <p className="text-xs text-orange-600">GMB profile views (30d)</p>
              <p className="text-2xl font-bold text-orange-900">{formatNumber(stages.demand.gmbViews)}</p>
              <p className="text-xs text-orange-700 mt-1">Phonebot AU only — store funnel signal</p>
            </div>
            <div className="p-3 bg-pink-50 rounded">
              <p className="text-xs text-pink-600">Brevo email reach (30d)</p>
              <p className="text-2xl font-bold text-pink-900">{formatNumber(stages.demand.brevoSends)}</p>
              <p className="text-xs text-pink-700 mt-1">Recipients across all sends</p>
            </div>
          </div>
          <TrustBadge source="GSC + GMB + Brevo daily aggregates" tier="confirmed" />
        </div>
      )}

      {/* Aggregate Funnel */}
      {stages && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Stage 2-5: Site funnel (aggregate)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toString()} />
                  <YAxis dataKey="stage" type="category" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatNumber(v)} />
                  <Bar dataKey="value" name="Volume" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Drop-off rates</h4>
              {[
                { label: 'Session → Cart', value: stages.sessionToCart, expected: '5-10% typical' },
                { label: 'Cart → Checkout', value: stages.cartToCheckout, expected: '50-70% typical' },
                { label: 'Checkout → Purchase', value: stages.checkoutToPurchase, expected: '60-90% typical' },
                { label: 'Session → Purchase (overall CR)', value: stages.sessionToPurchase, expected: '1-3% typical' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span className="text-gray-700">{row.label}</span>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatPercent(row.value)}</p>
                    <p className="text-xs text-gray-400">{row.expected}</p>
                  </div>
                </div>
              ))}
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                <strong>CMS reconciliation:</strong> {stages.purchasesCMS} CMS orders vs {stages.purchasesGA4} GA4 purchases ({stages.purchasesGA4 > 0 ? formatPercent(stages.purchasesGA4 / stages.purchasesCMS) : '—'} of truth captured by GA4 last-click).
              </div>
            </div>
          </div>
          <TrustBadge source="GA4 channel summary 30d + CMS web orders" tier="reconciled" caveat={journey.data?.caveat} />
        </div>
      )}

      {/* Per-Channel Funnel */}
      {byChannel.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Stage 2-5: Per-channel funnel</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Channel</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Sessions</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Add to Cart</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Checkout</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Purchase</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">S→P CR</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">CO→P CR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {byChannel.map((c) => (
                  <tr key={c.channel}>
                    <td className="px-3 py-2 font-medium text-gray-900">{c.channel}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatNumber(c.sessions)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatNumber(c.addToCarts)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatNumber(c.checkouts)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatNumber(c.purchases)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${c.sessionToPurchase >= 0.02 ? 'text-green-700' : c.sessionToPurchase >= 0.01 ? 'text-blue-700' : 'text-amber-700'}`}>
                      {formatPercent(c.sessionToPurchase)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatPercent(c.checkoutToPurchase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TrustBadge source="GA4 channel summary 30d AU" tier="reconciled" caveat="Last-click attribution. Channels with low traffic have noisy CR estimates." />
        </div>
      )}

      {/* Repeat / Retention */}
      {stages && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Stage 6: Repeat purchase + retention</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded">
              <p className="text-xs text-green-600">CMS revenue (30d)</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stages.revenueCMS)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-xs text-green-600">CMS GP (imputed, 30d)</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stages.gpCMS)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-xs text-green-600">Repeat customers (30d)</p>
              <p className="text-2xl font-bold text-green-900">{stages.repeatCustomers}</p>
              <p className="text-xs text-green-700 mt-1">Email join, 2+ orders within window</p>
            </div>
          </div>
        </div>
      )}

      {/* Cohort retention (existing) */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Monthly cohort retention</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cohorts.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cohort_month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatPercent(v)} />
              <Tooltip formatter={(v: number) => formatPercent(v)} />
              <Legend />
              <Bar dataKey="month_0" name="Month 0" fill="#2563eb" />
              <Bar dataKey="month_1" name="Month 1" fill="#3b82f6" />
              <Bar dataKey="month_3" name="Month 3" fill="#60a5fa" />
              <Bar dataKey="month_6" name="Month 6" fill="#93c5fd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <TrustBadge source="CMS web orders (Email join)" tier="reconciled" />
      </div>

      {/* Journey insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Journey insights</h3>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-medium text-gray-900">Repeat rate:</span>
            5.1% of customers buy again within 14 months
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-gray-900">Time to 2nd order:</span>
            Median 31 days — suggests accessory/add-on purchases, not replacement cycle
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-gray-900">Email → Orders:</span>
            Cannot directly attribute. Brevo has sends/opens/clicks but no revenue linkage.
            <span className="text-blue-700">Concurrency lift visible on Platform Mix page.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-gray-900">GMB → Store:</span>
            GMB phone/directions may drive walk-ins, but no POS attribution exists. GMB → web orders correlation is ~0 (separate funnel).
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-gray-900">PM Unassigned (35% of GP):</span>
            Server-side / cross-touch / email-completion conversions. The "ecosystem residual" not visible at any single stage.
          </li>
        </ul>
      </div>
    </div>
  );
}
