import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { formatCurrency, formatNumber, formatPercent } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MapPin, Store } from 'lucide-react';

export default function Geography() {
  const geo = trpc.diagnostics.geography.useQuery();

  if (!geo.data) return <p className="text-gray-500">Loading...</p>;

  const totalWebRev = geo.data.webByState.reduce((s, r) => s + r.revenue, 0);
  const localStore = geo.data.storeSplit.find(s => s.is_local);
  const tourist = geo.data.storeSplit.find(s => !s.is_local);
  const totalStoreRev = (localStore?.revenue || 0) + (tourist?.revenue || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Geographic distribution</h2>
        <p className="text-sm text-gray-500">State + postcode breakdown — where the demand actually lives</p>
      </div>

      {/* Web by state */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Web orders by state (lifetime)</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geo.data.webByState.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="state" type="category" width={70} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" name="Revenue" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">State</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Orders</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Revenue</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">% rev</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">AOV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {geo.data.webByState.map((r) => (
                  <tr key={r.state}>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{r.state}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{formatNumber(r.orders)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{formatCurrency(r.revenue)}</td>
                    <td className="px-3 py-1.5 text-right font-medium text-gray-900">{formatPercent(r.revenue / totalWebRev)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{formatCurrency(r.orders > 0 ? r.revenue / r.orders : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <TrustBadge source="fact_web_orders grouped by State" tier="confirmed" caveat="3 NZ orders excluded from analysis. Some null-state rows possible." />
      </div>

      {/* Web top postcodes */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Web orders — top 25 postcodes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Postcode</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">State</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Orders</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {geo.data.webByPostcode.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5 font-medium text-gray-900">{r.postcode}</td>
                  <td className="px-3 py-1.5 text-gray-700">{r.state}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{formatNumber(r.orders)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{formatCurrency(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Store local vs tourist */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Store className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Store sales — local vs broader catchment</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          "Local" defined as Reservoir VIC postcodes (3073, 3083, 3087, 3072). Everything else is broader-catchment / tourist / phone-in.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-green-50 rounded border border-green-200">
            <p className="text-xs text-green-600">Local (Reservoir VIC: 3073 + 3072/3083/3087)</p>
            <p className="text-2xl font-bold text-green-900">{formatNumber(localStore?.orders || 0)} orders</p>
            <p className="text-sm text-green-800 mt-1">{formatCurrency(localStore?.revenue || 0)} revenue</p>
            <p className="text-xs text-green-700 mt-2">
              {totalStoreRev > 0 ? formatPercent((localStore?.revenue || 0) / totalStoreRev) : '—'} of store revenue
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-600">Broader catchment (everywhere else)</p>
            <p className="text-2xl font-bold text-blue-900">{formatNumber(tourist?.orders || 0)} orders</p>
            <p className="text-sm text-blue-800 mt-1">{formatCurrency(tourist?.revenue || 0)} revenue</p>
            <p className="text-xs text-blue-700 mt-2">
              {totalStoreRev > 0 ? formatPercent((tourist?.revenue || 0) / totalStoreRev) : '—'} of store revenue
            </p>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-gray-700 mb-2">Top 30 postcodes (store)</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Postcode</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Orders</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Revenue</th>
                <th className="px-3 py-2 text-center font-medium text-gray-500">Local?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {geo.data.storeByPostcode.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5 font-medium text-gray-900">{r.postcode}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{formatNumber(r.orders)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{formatCurrency(r.revenue)}</td>
                  <td className="px-3 py-1.5 text-center">
                    {r.is_local ? <span className="text-green-700">✓</span> : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TrustBadge source="fact_store_orders grouped by postcode" tier="confirmed" caveat="'Local' definition is heuristic — adjust by editing INVENTORY_TARGETS-style constant." />
      </div>
    </div>
  );
}
