import { useSearchParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { formatCurrency, formatPercent } from '../types';

export default function PaidSearch() {
  const [searchParams] = useSearchParams();
  const window = (searchParams.get('window') || '1m') as '1m' | '3m' | '6m' | '12m';

  const paid = trpc.sources.paidDaily.useQuery({ window });
  const platformClaims = trpc.dashboard.platformClaimVsCMS.useQuery({ window });

  const mergedDaily = (paid.data?.google || []).map((g, i) => ({
    date: g.date,
    googleSpend: g.cost,
    fbSpend: paid.data?.facebook[i]?.cost || 0,
    bingSpend: paid.data?.bing[i]?.cost || 0,
    googleRev: g.revenue,
    fbRev: paid.data?.facebook[i]?.revenue || 0,
    bingRev: paid.data?.bing[i]?.revenue || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paid Media</h2>
        <p className="text-sm text-gray-500">Google Ads, Facebook, Bing — spend and platform claims</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800 font-medium">Critical Finding</p>
        <p className="text-sm text-red-700 mt-1">
          Platforms collectively claim ~96% of CMS web revenue — severe double-counting.
          Facebook real ROAS is ~0.30× (net loss) per ProfitMetrics triangulation, vs platform claim of 19.4×.
          Google Ads is genuinely profitable at ~8.8× real ROAS.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Ad Spend by Platform</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedDaily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5) || ''} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="googleSpend" name="Google Ads" stroke="#4285F4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fbSpend" name="Facebook" stroke="#1877F2" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="bingSpend" name="Bing" stroke="#008373" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Claimed Revenue vs CMS</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mergedDaily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5) || ''} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="googleRev" name="Google Claimed" fill="#4285F4" />
              <Bar dataKey="fbRev" name="FB Claimed" fill="#1877F2" />
              <Bar dataKey="bingRev" name="Bing Claimed" fill="#008373" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <TrustBadge source="Platform daily feeds" caveat="Platform revenue claims are inflated by double-counting. Do not use for spend decisions without ProfitMetrics triangulation." />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Over-Attribution Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Channel</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Spend</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Platform ROAS</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Claim % of CMS</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {platformClaims.data?.map((row) => (
                <tr key={row.channel}>
                  <td className="px-3 py-2 font-medium text-gray-900">{row.channel}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(row.spend)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{row.cmsDerivedROAS.toFixed(1)}x</td>
                  <td className={`px-3 py-2 text-right font-medium ${row.claimRatio > 0.5 ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatCurrency(row.platformClaimedRev)} ({formatPercent(row.claimRatio)})
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {row.channel === 'Facebook' ? (
                      <span className="text-red-600 font-medium">Net loss on attributable basis</span>
                    ) : row.channel === 'Google Ads' ? (
                      <span className="text-green-600 font-medium">Genuinely profitable</span>
                    ) : (
                      <span className="text-gray-500">Small footprint</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
