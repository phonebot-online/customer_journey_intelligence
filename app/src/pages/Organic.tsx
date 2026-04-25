import { useSearchParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

export default function Organic() {
  const [searchParams] = useSearchParams();
  const window = (searchParams.get('window') || '1m') as '1m' | '3m' | '6m' | '12m';

  const sc = trpc.sources.searchConsole.useQuery({ window });
  const gmb = trpc.sources.gmb.useQuery({ window });

  const branded = sc.data?.daily.filter((d) => d.branded === 'branded') || [];
  const nonBranded = sc.data?.daily.filter((d) => d.branded !== 'branded') || [];

  const mergedSC = branded.map((b, i) => ({
    date: b.date,
    brandedClicks: b.clicks,
    nonBrandedClicks: nonBranded[i]?.clicks || 0,
    brandedPos: b.position,
    nonBrandedPos: nonBranded[i]?.position || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Organic Search</h2>
        <p className="text-sm text-gray-500">Search Console + GMB performance</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800 font-medium">Organic Rankings Hypothesis — Not Confirmed</p>
        <p className="text-sm text-amber-700 mt-1">
          Aggregate Search Console data shows position <strong>improved</strong> (non-branded 16.3 → 7.2), not degraded.
          However, this could mask specific commercial query losses. Query-level validation needed before acting on "fix organic rankings".
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Console Clicks</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mergedSC}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5) || ''} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="brandedClicks" name="Branded" fill="#2563eb" />
              <Bar dataKey="nonBrandedClicks" name="Non-Branded" fill="#9333ea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Position Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedSC}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5) || ''} />
              <YAxis domain={[0, 30]} reversed />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="brandedPos" name="Branded Position" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="nonBrandedPos" name="Non-Branded Position" stroke="#9333ea" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <TrustBadge source="Search Console branded_daily_1m" caveat="Position is impressions-weighted average across all queries. May not reflect commercial query changes." />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GMB Activity (AU only)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gmb.data?.daily || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5) || ''} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_views" name="Views" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="phone_calls" name="Phone Calls" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="directions_requests" name="Directions" stroke="#dc2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <TrustBadge source="GMB locations_daily_1m" caveat="Dubai location filtered out. GMB drives in-store funnel, not web orders." />
      </div>
    </div>
  );
}
