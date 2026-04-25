import { useSearchParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { formatCurrency, formatPercent } from '../types';

export default function CrossChannel() {
  const [searchParams] = useSearchParams();
  const window = (searchParams.get('window') || '1m') as '1m' | '3m' | '6m' | '12m';

  const channelMix = trpc.dashboard.channelMix.useQuery({ window });
  const ceo = trpc.dashboard.ceoSummary.useQuery({ window });

  const scatterData = channelMix.data?.channels.map((c) => ({
    name: c.channel,
    sessions: c.sessions,
    gp: c.gp,
    margin: c.margin,
    gpShare: c.gpShare,
  })) || [];

  const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', '#4f46e5'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cross-Channel Analysis</h2>
        <p className="text-sm text-gray-500">Channel efficiency and contribution mix</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GP Efficiency: Sessions vs GP</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="sessions" name="Sessions" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="number" dataKey="gp" name="GP" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number, name: string) => name === 'gp' ? formatCurrency(v) : formatNumber(v)} />
              <Legend />
              <Scatter name="Channels" data={scatterData}>
                {scatterData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <TrustBadge source="ProfitMetrics channel GP + revenue" caveat="1m window only. Unassigned bucket (35% of GP) excluded from channel view." />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Contribution Table</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Channel</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Sessions</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Purchases</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Revenue</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">GP</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Margin</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">GP Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {channelMix.data?.channels.map((c) => (
                <tr key={c.channel}>
                  <td className="px-3 py-2 font-medium text-gray-900">{c.channel}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{c.sessions.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{c.purchases}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(c.revenue)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(c.gp)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatPercent(c.margin)}</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">{formatPercent(c.gpShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(ceo.data?.totalRevenue || 0)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500">Total GP</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(ceo.data?.totalGP || 0)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500">Ad Spend</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(ceo.data?.totalAdSpend || 0)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500">Net after Ad Spend</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency((ceo.data?.totalGP || 0) - (ceo.data?.totalAdSpend || 0))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-AU').format(value);
}
