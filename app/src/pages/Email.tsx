import { useSearchParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { formatNumber, formatPercent } from '../types';

export default function Email() {
  const [searchParams] = useSearchParams();
  const window = (searchParams.get('window') || '1m') as '1m' | '3m' | '6m' | '12m';

  const brevo = trpc.sources.brevo.useQuery({ window });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Email (Brevo)</h2>
        <p className="text-sm text-gray-500">Campaign performance — no revenue attribution available</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Email Trends</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={brevo.data?.monthly || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatPercent(v)} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sends" name="Sends" fill="#2563eb" />
              <Line yAxisId="right" type="monotone" dataKey="open_rate" name="Open Rate" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <TrustBadge source="Brevo campaigns_12m" caveat="Brevo data only since 2025-10-27 (Klaviyo pre-dates). No $ attached to campaigns." />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Campaign</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Sends</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Open Rate</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Click Rate</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Unsubs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {brevo.data?.campaigns.map((c) => (
                <tr key={c.campaign_name}>
                  <td className="px-3 py-2 font-medium text-gray-900">{c.campaign_name}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatNumber(c.sends)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatPercent(c.open_rate)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatPercent(c.click_rate)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{c.unsubscribes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
