import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { formatCurrency } from '../types';
import { Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Bar, ComposedChart } from 'recharts';
import { CheckCircle, Clock, TrendingUp, AlertTriangle, Lightbulb, Target, Users, Zap, ChevronRight } from 'lucide-react';

const PRIORITY_STYLE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  P0: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', label: 'P0 — This week' },
  P1: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', label: 'P1 — Next 2 weeks' },
  P2: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', label: 'P2 — This month' },
  P3: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', label: 'P3 — Quarterly' },
};

const ACTION_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  scale: { bg: 'bg-green-100', text: 'text-green-800', label: 'SCALE' },
  hold: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'HOLD' },
  cut: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'CUT' },
  pause: { bg: 'bg-red-100', text: 'text-red-800', label: 'PAUSE' },
};

const VERDICT_STYLE: Record<string, string> = {
  good: 'text-green-700',
  caution: 'text-amber-700',
  warn: 'text-red-700',
};

export default function Actions() {
  const priority = trpc.actions.priorityList.useQuery();
  const pulse = trpc.actions.spendPulse.useQuery();
  const scaling = trpc.actions.scalingRecommendations.useQuery();
  const tests = trpc.actions.testQueue.useQuery();
  const benchmarks = trpc.actions.benchmarks.useQuery();
  const competitors = trpc.actions.competitorWatch.useQuery();
  const insights = trpc.actions.valueAddedInsights.useQuery();

  const p0Count = priority.data?.filter(p => p.priority === 'P0').length || 0;
  const p1Count = priority.data?.filter(p => p.priority === 'P1').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Action Center</h2>
        <p className="text-sm text-gray-500">What to do next, with formulas and benchmarks. Read top-down.</p>
      </div>

      {/* Status banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="font-medium text-gray-900">{p0Count} P0 actions</span>
          <span className="text-sm text-gray-500">— do this week</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          <span className="font-medium text-gray-900">{p1Count} P1 actions</span>
          <span className="text-sm text-gray-500">— next 2 weeks</span>
        </div>
        <div className="flex-1" />
        {pulse.data && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Yesterday's spend</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(pulse.data.yesterday?.totalSpend || 0)}</p>
          </div>
        )}
      </div>

      {/* PRIORITY LIST */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Priority list</h3>
        </div>
        <div className="space-y-3">
          {priority.data?.map((item, i) => {
            const style = PRIORITY_STYLE[item.priority];
            return (
              <div key={i} className={`border-l-4 rounded p-4 ${style.bg} ${style.border}`}>
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wide ${style.text} bg-white px-2 py-0.5 rounded shadow-sm`}>
                    {item.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-700 mt-1"><strong>Why:</strong> {item.why}</p>
                    <p className="text-sm text-gray-700 mt-1"><strong>Action:</strong> {item.action}</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs">
                      <div><span className="text-gray-500">ETA:</span> <span className="font-medium text-gray-900">{item.eta}</span></div>
                      <div><span className="text-gray-500">Impact:</span> <span className="font-medium text-gray-900">{item.impact}</span></div>
                      <div><span className="text-gray-500">Risk:</span> <span className="font-medium text-gray-900">{item.risk}</span></div>
                      <div className="text-right"><span className="text-gray-400 italic">{item.evidence}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <TrustBadge source="Synthesis of locked Steps 7-10 + current state" tier="reconciled" />
      </div>

      {/* SPEND PULSE */}
      {pulse.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Spend pulse — yesterday + last 7 days</h3>
          </div>

          {/* Yesterday */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Yesterday total spend</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(pulse.data.yesterday?.totalSpend || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">{pulse.data.yesterday?.date}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-xs text-blue-600">Google Ads</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(pulse.data.yesterday?.awSpend || 0)}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded">
              <p className="text-xs text-indigo-600">Facebook</p>
              <p className="text-xl font-bold text-indigo-900">{formatCurrency(pulse.data.yesterday?.fbSpend || 0)}</p>
            </div>
            <div className="p-3 bg-teal-50 rounded">
              <p className="text-xs text-teal-600">Bing</p>
              <p className="text-xl font-bold text-teal-900">{formatCurrency(pulse.data.yesterday?.bingSpend || 0)}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded">
              <p className="text-xs text-amber-600">CMS orders yesterday</p>
              <p className="text-xl font-bold text-amber-900">{pulse.data.yesterday?.cmsOrders || 0}</p>
              <p className="text-xs text-amber-600 mt-1">⚠ may be incomplete (see below)</p>
            </div>
          </div>

          {/* 7-day rollups */}
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Last 7 days totals</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Total paid spend</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(pulse.data.last7Spend.total)}</p>
              <p className="text-xs text-gray-500 mt-1">~{formatCurrency(pulse.data.last7Spend.total / 7)}/day</p>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-xs text-blue-600">CMS orders (7d)</p>
              <p className="text-lg font-bold text-blue-900">{pulse.data.last7Spend.cmsOrders}</p>
              <p className="text-xs text-blue-600 mt-1">{(pulse.data.last7Spend.cmsOrders / 7).toFixed(1)}/day avg</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-xs text-green-600">CMS revenue (7d)</p>
              <p className="text-lg font-bold text-green-900">{formatCurrency(pulse.data.last7Spend.cmsRevenue)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <p className="text-xs text-purple-600">CMS GP (7d)</p>
              <p className="text-lg font-bold text-purple-900">{formatCurrency(pulse.data.last7Spend.cmsGp)}</p>
              <p className="text-xs text-purple-600 mt-1">Net of paid: {formatCurrency(pulse.data.last7Spend.cmsGp - pulse.data.last7Spend.total)}</p>
            </div>
          </div>

          {/* Conversion-lag explanation + chart */}
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900 mb-4">
            <p className="font-semibold mb-1 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Conversion-lag context
            </p>
            <p className="text-xs text-amber-800">{pulse.data.maturationContext.explanation}</p>
            {pulse.data.maturationContext.recentDays.length > 0 && (
              <div className="mt-2 text-xs">
                <p className="font-medium">Last 3 days maturity check:</p>
                {pulse.data.maturationContext.recentDays.map(r => (
                  <p key={r.date} className="font-mono">
                    {r.date}: spent A${r.totalSpend.toFixed(0)}, expected ~{r.expectedOrders.toFixed(0)} orders by full maturation, actual so far {r.cmsOrders} ({(r.maturityPct * 100).toFixed(0)}%)
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Daily chart with maturing zone */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pulse.data.dailyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tickFormatter={(v) => `$${v}`} label={{ value: 'Spend (A$/d)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'CMS orders', angle: 90, position: 'insideRight', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="awSpend" name="Google Ads" stackId="spend" fill="#4285F4" />
                <Bar yAxisId="left" dataKey="fbSpend" name="Facebook" stackId="spend" fill="#1877F2" />
                <Bar yAxisId="left" dataKey="bingSpend" name="Bing" stackId="spend" fill="#008373" />
                <Line yAxisId="right" type="monotone" dataKey="cmsOrders" name="CMS orders" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 italic mt-2">Last 3 days marked with ⚠ — orders for these days may still mature over next 1-3 days.</p>
          <TrustBadge source="fact_*_daily aggregates + fact_web_orders" tier="confirmed" caveat="Rightmost 3 bars are spend-confirmed but orders are still maturing." />
        </div>
      )}

      {/* SCALING RECOMMENDATIONS */}
      {scaling.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Scaling recommendations + formula</h3>
          </div>

          <div className="space-y-3 mb-4">
            {scaling.data.recommendations.map((r) => {
              const badge = ACTION_BADGE[r.action];
              return (
                <div key={r.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold uppercase tracking-wide ${badge.text} ${badge.bg} px-2 py-0.5 rounded`}>
                      {badge.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-semibold text-gray-900">{r.channel}</p>
                        <p className="text-xs text-gray-500">Current: {formatCurrency(r.currentSpend)}/day ({formatCurrency(r.currentSpendPerMonth)}/mo)</p>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2 text-xs">
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-gray-500">Avg ROAS now</p>
                          <p className={`text-lg font-bold ${r.currentAvgRoas >= 2 ? 'text-green-700' : r.currentAvgRoas >= 1 ? 'text-blue-700' : 'text-red-700'}`}>
                            {r.currentAvgRoas.toFixed(2)}×
                          </p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-gray-500">Marginal $1 returns</p>
                          <p className={`text-lg font-bold ${r.nextDollarReturns >= 1.5 ? 'text-green-700' : r.nextDollarReturns >= 1 ? 'text-blue-700' : 'text-red-700'}`}>
                            A${r.nextDollarReturns.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">net A${r.nextDollarNet.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="text-blue-600">Sweet spot</p>
                          <p className="text-lg font-bold text-blue-900">{r.sweetSpotSpend > 0 ? `A$${r.sweetSpotSpend.toFixed(0)}/d` : '—'}</p>
                          <p className="text-xs text-blue-600">marginal = 1.5×</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded">
                          <p className="text-red-600">Avg break-even</p>
                          <p className="text-lg font-bold text-red-900">{r.breakEvenAvgSpend > 0 ? `A$${r.breakEvenAvgSpend.toFixed(0)}/d` : '—'}</p>
                          <p className="text-xs text-red-600">avg ROAS = 1.0</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-3">{r.actionDescription}</p>
                      <p className="text-xs text-gray-500 mt-2 font-mono">{r.formula}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900">
            <p className="font-semibold mb-1">Framework</p>
            <ul className="space-y-1">
              <li>· <strong>Sweet spot:</strong> {scaling.data.framework.sweetSpot}</li>
              <li>· <strong>Marginal break-even:</strong> {scaling.data.framework.breakEvenMarginal}</li>
              <li>· <strong>Avg break-even:</strong> {scaling.data.framework.breakEvenAvg}</li>
              <li>· <strong>Formula:</strong> <code className="bg-white px-1 rounded">{scaling.data.framework.formula}</code></li>
            </ul>
          </div>

          <TrustBadge source="Saturating-curve fits from locked Step 7 multi-window triangulation" tier="estimated" caveat="Marginal ROAS at proposed spend is INFERRED, ±30%. Validate via incremental spend test before scaling >25% in one move." />
        </div>
      )}

      {/* TEST QUEUE */}
      {tests.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Test queue</h3>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-2">New platforms (ranked)</h4>
          <div className="space-y-2 mb-5">
            {tests.data.newPlatforms.map((p) => (
              <div key={p.rank} className="border border-gray-200 rounded p-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-bold text-gray-400 w-6 text-right">{p.rank}.</span>
                  <p className="font-semibold text-gray-900 flex-1">{p.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${p.fit.startsWith('High') ? 'bg-green-100 text-green-800' : p.fit.startsWith('Low') ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                    Fit: {p.fit}
                  </span>
                </div>
                <p className="text-xs text-gray-700 mt-1 ml-9">{p.rationale}</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mt-2 ml-9 text-xs">
                  <div><span className="text-gray-500">Budget:</span> <span className="font-medium">{p.startBudget}</span></div>
                  <div><span className="text-gray-500">Watchpoint:</span> <span className="font-medium">{p.watchpoint}</span></div>
                  <div><span className="text-gray-500">Risk:</span> <span className="font-medium">{p.risk}</span></div>
                </div>
              </div>
            ))}
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-2">Google Ads features to test</h4>
          <div className="overflow-x-auto mb-5">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Feature</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Why</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tests.data.googleAdsFeatures.map((f, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-gray-900">{f.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{f.why}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${PRIORITY_STYLE[f.priority].bg} ${PRIORITY_STYLE[f.priority].text}`}>{f.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-2">Meta Ads features to test</h4>
          <div className="overflow-x-auto mb-5">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Feature</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Why</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tests.data.metaAdsFeatures.map((f, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-gray-900">{f.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{f.why}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${PRIORITY_STYLE[f.priority].bg} ${PRIORITY_STYLE[f.priority].text}`}>{f.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-2">Creative tests</h4>
          <div className="space-y-2">
            {tests.data.creativeTests.map((c, i) => (
              <div key={i} className="border border-gray-200 rounded p-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-gray-900">{c.angle}</p>
                  <span className="text-xs text-gray-500">{c.estCost}</span>
                </div>
                <p className="text-xs text-gray-700 mt-1">{c.rationale}</p>
              </div>
            ))}
          </div>

          <TrustBadge source="Industry knowledge + Phonebot data context" tier="inferred" caveat="Recommendations are opinionated, not data-derived. Test small first." />
        </div>
      )}

      {/* BENCHMARKS */}
      {benchmarks.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Industry benchmarks (refurb e-commerce AU)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Metric</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Phonebot</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Benchmark</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-500">Verdict</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {benchmarks.data.map((b, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-gray-900">{b.metric}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900">{b.phonebotDisplay}</td>
                    <td className="px-3 py-2 text-gray-700">{b.benchmark}</td>
                    <td className={`px-3 py-2 text-center font-medium ${VERDICT_STYLE[b.verdictTier]}`}>{b.verdict}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{b.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TrustBadge source="Phonebot live data + AU e-commerce benchmark ranges (industry knowledge)" tier="inferred" caveat="Benchmark ranges are typical not authoritative. Refurb-specific benchmarks have wide variance." />
        </div>
      )}

      {/* COMPETITOR WATCH */}
      {competitors.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Competitor watch</h3>
          </div>
          <div className="space-y-3">
            {competitors.data.map((c, i) => (
              <div key={i} className="border border-gray-200 rounded p-3">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <div>
                    <span className="font-semibold text-gray-900">{c.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{c.type}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${c.threat.startsWith('High') ? 'bg-red-100 text-red-800' : c.threat.startsWith('Medium') ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                    Threat: {c.threat}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{c.positioning}</p>
                <p className="text-xs text-gray-600 mt-2"><strong>Evidence:</strong> {c.evidence}</p>
                <p className="text-xs text-gray-600 mt-1"><strong>Watch:</strong> {c.watchpoints.join(' · ')}</p>
              </div>
            ))}
          </div>
          <TrustBadge source="Public data + AU refurb market knowledge" tier="inferred" caveat="Threat levels are subjective assessments, not data-derived." />
        </div>
      )}

      {/* VALUE-ADDED INSIGHTS */}
      {insights.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ChevronRight className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Value-added insights</h3>
          </div>
          <div className="space-y-3">
            {insights.data.map((insight, i) => (
              <div key={i} className="border-l-4 border-purple-300 bg-purple-50 rounded p-3">
                <p className="font-semibold text-gray-900">{insight.title}</p>
                <p className="text-sm text-gray-700 mt-1">{insight.body}</p>
              </div>
            ))}
          </div>
          <TrustBadge source="Synthesis of locked findings + cross-source observation" tier="inferred" />
        </div>
      )}
    </div>
  );
}
