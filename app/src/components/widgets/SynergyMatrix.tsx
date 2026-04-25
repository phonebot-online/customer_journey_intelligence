interface Signal {
  driver: string;
  outcome: string;
  hypothesis: string;
  rLag0: number;
  bestLagDays: number;
  bestLagR: number;
  tier: 'inferred' | 'estimated' | 'uncertain';
  n: number;
}

function colorFor(r: number): string {
  const abs = Math.abs(r);
  if (abs < 0.2) return 'bg-gray-50 text-gray-400';
  if (abs < 0.4) return r > 0 ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700';
  if (abs < 0.6) return r > 0 ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';
  if (abs < 0.8) return r > 0 ? 'bg-blue-300 text-blue-900' : 'bg-orange-300 text-orange-900';
  return r > 0 ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white';
}

function tierBadge(tier: Signal['tier']) {
  const map = {
    inferred: 'bg-amber-100 text-amber-800',
    estimated: 'bg-orange-100 text-orange-800',
    uncertain: 'bg-red-100 text-red-800',
  };
  return map[tier];
}

export default function SynergyMatrix({ signals }: { signals: Signal[] }) {
  if (!signals.length) {
    return <p className="text-sm text-gray-500 italic">No synergy signals available — need at least 7 days of aligned data.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-500">Driver</th>
            <th className="px-3 py-2 text-left font-medium text-gray-500">Outcome</th>
            <th className="px-3 py-2 text-center font-medium text-gray-500" title="Pearson r at lag 0 (same day)">r (lag 0)</th>
            <th className="px-3 py-2 text-center font-medium text-gray-500" title="Best Pearson r within 0-7 day lag">r (best lag)</th>
            <th className="px-3 py-2 text-center font-medium text-gray-500">Lag (d)</th>
            <th className="px-3 py-2 text-center font-medium text-gray-500">Tier</th>
            <th className="px-3 py-2 text-left font-medium text-gray-500">Hypothesis</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {signals.map((s, i) => (
            <tr key={i}>
              <td className="px-3 py-2 font-medium text-gray-900">{s.driver}</td>
              <td className="px-3 py-2 text-gray-700">{s.outcome}</td>
              <td className={`px-3 py-2 text-center font-mono font-medium rounded-sm ${colorFor(s.rLag0)}`}>
                {s.rLag0.toFixed(2)}
              </td>
              <td className={`px-3 py-2 text-center font-mono font-medium rounded-sm ${colorFor(s.bestLagR)}`}>
                {s.bestLagR.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-center text-gray-700">{s.bestLagDays}</td>
              <td className="px-3 py-2 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierBadge(s.tier)}`}>
                  {s.tier}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-gray-600">{s.hypothesis}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 text-xs text-gray-500 italic">
        Color intensity reflects |r|. Blue = positive correlation, orange = negative. Tier reflects sample size + |r|; even high tiers are observational, not causal.
      </div>
    </div>
  );
}
