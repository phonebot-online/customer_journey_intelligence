import { useSearchParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import KPICard from '../components/widgets/KPICard';
import TrustBadge from '../components/widgets/TrustBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { formatCurrency, formatPercent } from '../types';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const window = (searchParams.get('window') || '1m') as '1m' | '3m' | '6m' | '12m';

  const ceo = trpc.dashboard.ceoSummary.useQuery({ window });
  const weekly = trpc.dashboard.weeklyTrend.useQuery({ window });
  const channelMix = trpc.dashboard.channelMix.useQuery({ window });
  const platformClaims = trpc.dashboard.platformClaimVsCMS.useQuery({ window });
  const refunds = trpc.dashboard.refundByBrand.useQuery({ window });

  const mergedWeekly = weekly.data?.webTrend.map((w, i) => ({
    week: w.week.slice(5),
    webRevenue: w.revenue,
    storeRevenue: weekly.data.storeTrend[i]?.revenue || 0,
    adSpend: weekly.data.adTrend[i]?.spend || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">CEO Overview</h2>
        <p className="text-sm text-gray-500">Combined web + store performance</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={ceo.data?.totalRevenue || 0} format="currency" subtitle={`Web: ${formatCurrency(ceo.data?.webRevenue || 0)} · Store: ${formatCurrency(ceo.data?.storeRevenue || 0)}`} />
        <KPICard title="Total GP" value={ceo.data?.totalGP || 0} format="currency" subtitle={`Margin: ${formatPercent(ceo.data?.blendedMargin || 0)}`} />
        <KPICard title="Web Orders" value={ceo.data?.webOrders || 0} format="number" subtitle={`AOV: ${formatCurrency(ceo.data?.webAOV || 0)}`} />
        <KPICard title="Store Orders" value={ceo.data?.storeOrders || 0} format="number" subtitle={`AOV: ${formatCurrency(ceo.data?.storeAOV || 0)}`} />
        <KPICard title="Ad Spend" value={ceo.data?.totalAdSpend || 0} format="currency" />
        <KPICard title="ROAS" value={ceo.data?.roas || 0} format="number" subtitle="Revenue / Ad spend" />
        <KPICard title="Web Refund Rate" value={ceo.data?.webRefundRate || 0} format="percent" subtitle={`${ceo.data?.webRefundCount || 0} orders`} />
        <KPICard title="Blended Margin" value={ceo.data?.blendedMargin || 0} format="percent" />
      </div>

      <TrustBadge source="CMS web orders v4 + Store POS + Paid daily" freshness="Updated 2026-04-28" />

      {/* TODAY: 5 things to do, backed by data */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-300 rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⚡</span>
          <h3 className="text-lg font-bold text-gray-900">5 things you can do today, backed by this data</h3>
        </div>
        <div className="space-y-3">
          {[
            {
              n: 1, time: '15 min', title: 'Pause 4 broken Google + Bing campaigns',
              data: 'Standard Shopping iPhone 17 (A$343/30d), PMax iPhone 17 (A$104), CJ-DSA All Pages (A$96), Bing Standard Shopping iPads (A$25). All 0 ProfitMetrics purchases in 30d.',
              impact: '+A$568/mo locked, zero opportunity cost (these produced 0 PM conversions).',
              where: 'Google Ads + Bing Ads UI — full step list on /actions',
            },
            {
              n: 2, time: '30 min', title: 'Enable UTM auto-tagging on Brevo email links',
              data: 'Concurrency lift panel: Brevo send-day → CMS revenue +13.6%. Email contribution to revenue is currently INVISIBLE (Brevo has no $ attribution to GA4 or CMS).',
              impact: 'Unlocks measurement of A$XXk/mo email-driven revenue — a probable big chunk of the 35% PM Unassigned bucket.',
              where: 'Brevo settings → Tracking → enable auto-UTM. Fields: source=brevo, medium=email, campaign={name}.',
            },
            {
              n: 3, time: '30 min', title: 'iPhone Like New pricing audit vs Reebelo + Mobileciti',
              data: 'Step 8 product-cliff: iPhone Like New is the ONLY segment with real competitive price pressure (AOV -15% on flat volume). Reebelo appeared in GW data 19 clicks/24d in Apr 2026.',
              impact: 'If 5-10% above market, match → +A$1-2k/mo recovered. If at-market, leave alone.',
              where: 'Spot-check 5 top SKUs at reebelo.com.au + mobileciti.com.au.',
            },
            {
              n: 4, time: '5 min', title: 'Email ProfitMetrics support re: Unassigned bucket',
              data: '35% of PM-attributed GP (~A$38k/mo) sits in "Unassigned" with no channel source. Composition unknown — could be email completions, server-side checkouts, or iOS ITP.',
              impact: 'Could shift channel attribution shares by ±10% once explained.',
              where: '/diagnostics page → PM Unassigned panel → click "Show draft email" → copy + send.',
            },
            {
              n: 5, time: '5 min start, then ongoing', title: 'Add "How did you find us?" dropdown to POS',
              data: 'Reservoir store grew +5/+10/+20% YoY. GMB views correlate ~0 with web orders (separate funnel). NO walk-in attribution exists today.',
              impact: 'Closes the store-walk-in attribution gap. After 30 days you can route A$XXXk/yr of store revenue to the right channels (Google Maps / GMB / referral / ad / walked past).',
              where: 'Add custom field to POS checkout. Train cashiers to ask. 5 min config + ongoing.',
            },
          ].map(t => (
            <div key={t.n} className="bg-white rounded p-3 border border-blue-200">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-blue-700 w-8 text-right">{t.n}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{t.title}</p>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-medium">{t.time}</span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1"><strong>Data:</strong> {t.data}</p>
                  <p className="text-xs text-green-700 mt-1"><strong>Impact:</strong> {t.impact}</p>
                  <p className="text-xs text-blue-700 mt-1"><strong>Where:</strong> {t.where}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 italic mt-3">Total time: ~1h 30m active + 24h Brevo UTM warmup. Combined annualised impact estimate: +A$15-30k/yr if all five land.</p>
      </div>

      {/* Weekly Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Revenue Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedWeekly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="webRevenue" name="Web Revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="storeRevenue" name="Store Revenue" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="adSpend" name="Ad Spend" stroke="#dc2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channel Mix */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Mix (ProfitMetrics)</h3>
        {channelMix.data?.caveat ? (
          <p className="text-sm text-amber-600">{channelMix.data.caveat}</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelMix.data?.channels || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="channel" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#2563eb" />
                <Bar dataKey="gp" name="GP" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <TrustBadge source="ProfitMetrics GA4 (1m only)" caveat="35% Unassigned bucket not shown" />
      </div>

      {/* Platform Claims vs CMS */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Claim vs CMS Reality</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Channel</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Spend</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Platform Claimed Rev</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Claim Ratio</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Platform ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {platformClaims.data?.map((row) => (
                <tr key={row.channel}>
                  <td className="px-3 py-2 font-medium text-gray-900">{row.channel}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(row.spend)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(row.platformClaimedRev)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${row.claimRatio > 0.5 ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatPercent(row.claimRatio)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">{row.cmsDerivedROAS.toFixed(1)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TrustBadge source="Platform daily + CMS web orders" caveat="Platforms collectively claim 96% of CMS revenue — severe double-counting" />
      </div>

      {/* Refund by Brand */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Refund Rate by Brand</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={refunds.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="brand" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatPercent(v)} />
              <Tooltip formatter={(v: number) => formatPercent(v)} />
              <Bar dataKey="refund_rate" name="Refund Rate" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <TrustBadge source="CMS web orders v4" caveat="Xiaomi and AirPods historically flagged as high-refund brands" />
      </div>
    </div>
  );
}
