import { trpc } from '../providers/trpc';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function DataTrust() {
  const availability = trpc.qa.dataAvailability.useQuery();
  const flags = trpc.qa.qualityFlags.useQuery();

  const statusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-700 bg-green-50';
      case 'warn': return 'text-amber-700 bg-amber-50';
      case 'error': return 'text-red-700 bg-red-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Data Trust & QA</h2>
        <p className="text-sm text-gray-500">Data availability, quality flags, and known caveats</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Availability</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Table</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Rows</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Date Range</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {availability.data?.map((row) => (
                <tr key={row.table}>
                  <td className="px-3 py-2 font-medium text-gray-900">{row.table}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{row.rows.toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-700">{row.dateRange}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusClass(row.status)}`}>
                      {statusIcon(row.status)}
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Flags</h3>
        <div className="space-y-3">
          {flags.data?.map((flag) => (
            <div key={flag.category} className={`rounded-lg p-4 border ${flag.status === 'warn' ? 'bg-amber-50 border-amber-200' : flag.status === 'pass' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                {statusIcon(flag.status)}
                <span className="font-medium text-gray-900">{flag.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(flag.status)}`}>
                  {flag.status.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700">{flag.message}</p>
              {flag.detail && <p className="mt-1 text-xs text-gray-500">{flag.detail}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Known Data Caveats</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">·</span>
            <span><strong>GP imputation:</strong> 709 orders (4.0%) have imputed GP using brand×condition median margin. Actual GP may differ.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">·</span>
            <span><strong>Platform over-attribution:</strong> FB/AW/Bing sum to ~96% of CMS revenue — impossible without double-counting. Use ProfitMetrics for decisions.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">·</span>
            <span><strong>Store refunds:</strong> Refund Order IDs don't match orders file. Treat as aggregate adjustment only.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">·</span>
            <span><strong>Store accessory/repair GP:</strong> Cost Price not tracked for many SKUs. Margins of 77–91% are upper bounds.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">·</span>
            <span><strong>No order-level attribution:</strong> CMS exports lack utm/gclid/fbclid. Multi-touch attribution impossible.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">·</span>
            <span><strong>ProfitMetrics Unassigned:</strong> 35% of GP has no session attribution. Could be server-side, bot, or cross-domain.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">·</span>
            <span><strong>Brevo history limited:</strong> Only since 2025-10-27. Earlier email data was in Klaviyo and is not present.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-500 font-bold">·</span>
            <span><strong>Paid data beyond 30d:</strong> 3m/6m/12m paid media files are "save pending" — only 1m window confirmed on disk.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
