import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatPercent } from '../types';

export default function CustomerJourney() {
  const cohorts = trpc.sources.cohortRetention.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Customer Journey</h2>
        <p className="text-sm text-gray-500">Cohort retention and repeat purchase behaviour</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 font-medium">Attribution Limitation</p>
        <p className="text-sm text-amber-700 mt-1">
          CMS orders have NO utm_source/medium/campaign/gclid/fbclid fields. Strict order-level multi-touch attribution is impossible.
          Aggregate daily/weekly journey metrics are shown where available.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Cohort Retention</h3>
        <div className="h-80">
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
        <TrustBadge source="CMS web orders (Email join)" caveat="Jul–Nov 2025 gap means some repeat customers may be misclassified as new." />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Journey Insights</h3>
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
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-gray-900">GMB → Store:</span>
            GMB phone/directions may drive walk-ins, but no POS attribution exists.
          </li>
        </ul>
      </div>
    </div>
  );
}
