import { useSearchParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '../types';

export default function StoreSales() {
  const [searchParams] = useSearchParams();
  const window = (searchParams.get('window') || '1m') as '1m' | '3m' | '6m' | '12m';

  const daily = trpc.sources.storeDaily.useQuery({ window });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Store Sales</h2>
        <p className="text-sm text-gray-500">Reservoir VIC physical store — POS data</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 font-medium">Data Quality Warning</p>
        <p className="text-sm text-amber-700 mt-1">
          Store accessory/repair GP may be overstated (77–91% margins) because Cost Price is not tracked for many SKUs.
          Device margins (~22.7%) are reliable. Refund Order IDs do not match orders — treat as aggregate adjustment.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Store Revenue & Orders</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5) || ''} />
              <YAxis yAxisId="left" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(v: number, name: string) => name.includes('revenue') || name.includes('gp') ? formatCurrency(v) : v} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="gp" name="GP" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#9333ea" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <TrustBadge source="Store POS full history" caveat="Accessory/repair GP is upper bound only. 14.4% refund rate by revenue." freshness="Updated 2026-04-25" />
      </div>
    </div>
  );
}
