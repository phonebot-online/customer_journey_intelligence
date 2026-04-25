import { useSearchParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import HHIGauge from '../components/widgets/HHIGauge';
import SynergyMatrix from '../components/widgets/SynergyMatrix';
import { formatCurrency } from '../types';
import { Network, Target, AlertTriangle } from 'lucide-react';

const CONFIDENCE_BADGE: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  inferred: 'bg-amber-100 text-amber-700',
  unconfirmed: 'bg-red-100 text-red-700',
};

export default function PlatformMix() {
  const [searchParams] = useSearchParams();
  const window = (searchParams.get('window') || '1m') as '1m' | '3m' | '6m' | '12m';

  const platforms = trpc.strategy.standalonePlatforms.useQuery({ window });
  const concentration = trpc.strategy.concentrationScore.useQuery({ window });
  const synergy = trpc.strategy.synergyMatrix.useQuery({ window });
  const lifts = trpc.strategy.concurrencyLifts.useQuery({ window });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Mix Strategy</h2>
        <p className="text-sm text-gray-500">Standalone platform value, concentration vs diversification, and cross-channel synergy signals</p>
      </div>

      {/* Strategic verdict panel */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-blue-700 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Strategic verdict</h3>
            <p className="mt-1 text-sm text-gray-700">
              <strong className="text-blue-900">Coordinated 3-platform core, NOT single-platform concentration.</strong> Brand harvest = 60% of paid net profit on 14% of spend, but it depends on upstream demand creators (FB, organic, email).
              Branded "phonebot" search dropped 32-44% concurrent with FB cuts — strong correlational signal that demand creation is real and shared across channels. Final decision gated on the FB holdout test.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <div className="p-2 bg-white rounded border border-blue-100">
                <p className="font-medium text-gray-900">Highest ranked combination</p>
                <p className="text-gray-700 mt-1">Google + Email + Organic (no FB) IF holdout = non-incremental</p>
              </div>
              <div className="p-2 bg-white rounded border border-blue-100">
                <p className="font-medium text-gray-900">Likely best long-term</p>
                <p className="text-gray-700 mt-1">Google + FB right-sized + Email + Organic + Bing (5-channel coordinated)</p>
              </div>
              <div className="p-2 bg-white rounded border border-blue-100">
                <p className="font-medium text-gray-900">Rejected outright</p>
                <p className="text-gray-700 mt-1">FB-led / Meta-led — net loss across all measured windows</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HHI Gauge */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Concentration vs Diversification</h3>
        <HHIGauge hhi={concentration.data?.hhi ?? null} label={concentration.data?.label ?? null} />
        <TrustBadge
          source="ProfitMetrics PM-GP channel shares (1m)"
          caveat={concentration.data?.caveat || undefined}
          tier="reconciled"
        />
      </div>

      {/* Standalone platforms */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Standalone platform value</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Platform</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Spend</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">PM GP</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Real ROAS</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Role</th>
                <th className="px-3 py-2 text-center font-medium text-gray-500">Confidence</th>
                <th className="px-3 py-2 text-center font-medium text-gray-500">Standalone?</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Dependence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {platforms.data?.map((p) => (
                <tr key={p.key}>
                  <td className="px-3 py-2 font-medium text-gray-900">{p.label}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{p.spend > 0 ? formatCurrency(p.spend) : '—'}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{p.gp > 0 ? formatCurrency(p.gp) : '—'}</td>
                  <td className={`px-3 py-2 text-right font-medium ${p.realRoas >= 2 ? 'text-green-700' : p.realRoas >= 1 ? 'text-blue-700' : p.realRoas > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                    {p.realRoas > 0 ? `${p.realRoas.toFixed(2)}×` : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">{p.role}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_BADGE[p.confidence] || 'bg-gray-100 text-gray-700'}`}>
                      {p.confidence}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-xs">
                    {p.standaloneViable ? <span className="text-green-700 font-medium">Yes</span> : <span className="text-red-700 font-medium">No</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{p.dependence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TrustBadge
          source="ProfitMetrics PM-GP attribution + locked Step 7 triangulation"
          caveat="Confidence reflects measurement quality, not strategic priority. Dependence column is interpretive."
          tier="reconciled"
        />
      </div>

      {/* Synergy matrix */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Cross-channel synergy signals</h3>
        </div>
        <SynergyMatrix signals={synergy.data?.signals || []} />
        <TrustBadge
          source={`Daily aligned series (${synergy.data?.n || 0} days)`}
          caveat={synergy.data?.caveat}
          tier="inferred"
        />
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          <strong>Read carefully:</strong> these correlations are observational, not causal. A strong r between FB spend and CMS orders does NOT prove FB drives orders — both could be driven by promo days, weekday patterns, or seasonality. Causal proof requires holdout tests (only FB is queued — see Step 10 protocol).
        </div>
      </div>

      {/* Concurrency lift panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Concurrency lift — does the outcome change when the driver is active?</h3>
        </div>
        {lifts.data?.tests.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Test</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500" title="Mean outcome on days driver is active">Active mean</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500" title="Mean outcome on days driver is paused / below median">Paused mean</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Lift %</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">n (active / paused)</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Hypothesis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lifts.data.tests.map((t, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-gray-900">{t.name}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{t.activeMean.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{t.pausedMean.toFixed(1)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${t.liftPct === null ? 'text-gray-400' : t.liftPct > 10 ? 'text-green-700' : t.liftPct < -10 ? 'text-red-700' : 'text-gray-700'}`}>
                      {t.liftPct !== null ? `${t.liftPct > 0 ? '+' : ''}${t.liftPct.toFixed(1)}%` : 'n/a'}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-gray-600">{t.nActive} / {t.nPaused}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{t.hypothesis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No concurrency tests available — need ≥7 days.</p>
        )}
        <TrustBadge
          source={`Daily aligned series (${lifts.data?.n || 0} days)`}
          caveat={lifts.data?.caveat}
          tier="inferred"
        />
      </div>

      {/* Best combinations ranked */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Best combinations, ranked</h3>
        <div className="space-y-2">
          {[
            { rank: 1, combo: 'Google + Email + Organic (no FB)', net: '+A$5-7k/mo over current', conf: 'Conditional HIGH', cond: 'IF FB holdout proves non-incremental', tier: 'inferred' },
            { rank: 2, combo: 'Google + FB (right-sized) + Email + Organic', net: 'Current trajectory', conf: 'Medium', cond: 'Default if FB holdout shows ≥5% incremental', tier: 'inferred' },
            { rank: 3, combo: 'Google + Bing + Email + Organic', net: '+A$3-4k/mo', conf: 'High', cond: 'Bing scale-up at 5-13× efficiency adds clean margin', tier: 'reconciled' },
            { rank: 4, combo: 'Pure Google concentration', net: 'Short-term flat, long-term −A$5-15k/mo', conf: 'LOW (long-term loser)', cond: 'Brand harvest decays without demand creators upstream', tier: 'estimated' },
            { rank: 5, combo: 'Full ecosystem (5+ platforms)', net: '+A$10-20k/mo upside / −A$10k/mo downside', conf: 'LOW', cond: 'Requires FB tracking fix + Klaviyo + AI source', tier: 'uncertain' },
            { rank: 6, combo: 'FB-led / Meta-led', net: '−A$10-15k/mo continuing loss', conf: 'REJECTED', cond: 'FB attribution model cannot carry profit at any observed scale', tier: 'reconciled' },
          ].map((row) => (
            <div key={row.rank} className="flex items-start gap-3 p-3 rounded border border-gray-200">
              <span className="text-lg font-bold text-gray-400 w-6 text-right">{row.rank}.</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{row.combo}</p>
                <p className="text-xs text-gray-600 mt-0.5">{row.cond}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-medium text-gray-900">{row.net}</p>
                <p className={`mt-0.5 ${row.conf === 'REJECTED' ? 'text-red-600' : row.conf.includes('HIGH') ? 'text-green-600' : row.conf === 'LOW' ? 'text-amber-600' : 'text-gray-500'}`}>{row.conf}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open questions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <h4 className="font-semibold mb-2">Not yet confirmed (require experiments or new data)</h4>
        <ul className="space-y-1 text-amber-800 list-disc list-inside">
          <li><strong>FB incrementality</strong> — only the holdout test settles this (Step 10 protocol queued)</li>
          <li><strong>Email → revenue contribution</strong> — needs Brevo UTM fix + 30-day GA4 join</li>
          <li><strong>AI sales / AI recommendations</strong> — Phase 2, data source TBD</li>
          <li><strong>What feeds the 35% PM Unassigned bucket</strong> — needs ProfitMetrics support inquiry</li>
          <li><strong>Klaviyo pre-Oct 2025 contribution</strong> — pending data attachment</li>
          <li><strong>Whether AW peak spend would have prevented the cliff</strong> — would need a scale-back-up test</li>
          <li><strong>Store funnel at the channel level</strong> — no walk-in attribution exists</li>
        </ul>
      </div>
    </div>
  );
}
