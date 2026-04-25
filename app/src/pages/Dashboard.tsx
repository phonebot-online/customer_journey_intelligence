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

      <TrustBadge source="CMS web orders v4 + Store POS + Paid daily" caveat="Jul–Nov 2025 CMS gap affects 6m/12m windows" freshness="Updated 2026-04-25" />

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
