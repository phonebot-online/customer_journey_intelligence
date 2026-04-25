import { useState, useEffect } from 'react';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { formatCurrency } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Pause, Play, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

const STORAGE_KEY = 'phonebot_fb_holdout_start_date';

export default function Holdout() {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState<string>('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setStartDate(saved);
      setDraftDate(saved);
    }
  }, []);

  const tracker = trpc.strategy.holdoutTracker.useQuery({ holdoutStartDate: startDate });

  const startHoldout = () => {
    if (!draftDate) return;
    localStorage.setItem(STORAGE_KEY, draftDate);
    setStartDate(draftDate);
  };

  const stopHoldout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStartDate(null);
    setDraftDate('');
  };

  const baseline = tracker.data?.baseline;
  const postTest = tracker.data?.postTest;
  const decision = tracker.data?.decision;
  const protocol = tracker.data?.protocol;

  // Build chart data: baseline window + post-test window
  const chartData: { date: string; baseline?: number; postTest?: number; baselineMean?: number }[] = [];
  if (baseline?.dayByDay) {
    baseline.dayByDay.forEach(d => chartData.push({ date: d.date, baseline: d.orders, baselineMean: baseline.avg.ordersPerDay }));
  }
  if (postTest?.dayByDay) {
    postTest.dayByDay.forEach(d => chartData.push({ date: d.date, postTest: d.orders, baselineMean: baseline?.avg.ordersPerDay || 0 }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">FB Incrementality Holdout</h2>
        <p className="text-sm text-gray-500">14-day pause test on Cold campaign — measures real upper-funnel contribution</p>
      </div>

      {/* Start/stop control */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Holdout status</h3>
        {!startDate ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <Pause className="w-5 h-5" />
              <span className="font-medium">Not started</span>
            </div>
            <p className="text-sm text-gray-700">When you flip the Cold campaign Off in Meta Ads Manager, enter the date below to begin tracking.</p>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              />
              <button
                onClick={startHoldout}
                disabled={!draftDate}
                className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Start tracking
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Play className="w-5 h-5" />
              <span className="font-medium">Tracking — Day {postTest?.dayOfTest || 0} of 14</span>
              {postTest && postTest.dayOfTest >= 14 && <CheckCircle className="w-5 h-5 text-green-600" />}
            </div>
            <p className="text-sm text-gray-700">
              Holdout started <strong>{startDate}</strong>. Decision criteria fire at day 14.
            </p>
            <button
              onClick={stopHoldout}
              className="text-xs text-red-600 underline hover:text-red-800"
            >
              Reset / clear holdout date
            </button>
          </div>
        )}
      </div>

      {/* Pre-test baseline */}
      {baseline && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Pre-test baseline</h3>
          <p className="text-sm text-gray-500 mb-4">Trailing 14 days: {baseline.window}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">CMS orders / day</p>
              <p className="text-2xl font-bold text-gray-900">{baseline.avg.ordersPerDay.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">CMS revenue / day</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(baseline.avg.revPerDay)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">CMS GP / day</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(baseline.avg.gpPerDay)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">GSC branded clicks / day</p>
              <p className="text-2xl font-bold text-gray-900">{baseline.gscBrandedAvg.toFixed(1)}</p>
            </div>
          </div>
          <TrustBadge source="fact_web_orders + fact_search_console_daily" tier="confirmed" />
        </div>
      )}

      {/* Post-test data */}
      {startDate && postTest && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Post-test (during holdout)</h3>
          <p className="text-sm text-gray-500 mb-4">Window: {postTest.window}</p>
          {postTest.avg ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-xs text-blue-600">Orders / day (post)</p>
                  <p className="text-2xl font-bold text-blue-900">{postTest.avg.ordersPerDay.toFixed(1)}</p>
                  {baseline && (
                    <p className={`text-xs mt-1 font-medium ${postTest.avg.ordersPerDay >= baseline.avg.ordersPerDay * 0.95 ? 'text-green-600' : 'text-red-600'}`}>
                      {((postTest.avg.ordersPerDay / baseline.avg.ordersPerDay - 1) * 100).toFixed(1)}% vs baseline
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-xs text-blue-600">Rev / day (post)</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(postTest.avg.revPerDay)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-xs text-blue-600">GP / day (post)</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(postTest.avg.gpPerDay)}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded">
                  <p className="text-xs text-purple-600">Days elapsed</p>
                  <p className="text-2xl font-bold text-purple-900">{postTest.dayOfTest} / 14</p>
                </div>
              </div>
              {chartData.length > 0 && (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis label={{ value: 'CMS orders', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine x={startDate} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Holdout start', position: 'top', fill: '#dc2626', fontSize: 11 }} />
                      {baseline && <ReferenceLine y={baseline.avg.ordersPerDay} stroke="#9ca3af" strokeDasharray="2 2" label={{ value: 'Baseline mean', position: 'right', fontSize: 10 }} />}
                      <Line type="monotone" dataKey="baseline" name="Pre-test baseline" stroke="#6b7280" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                      <Line type="monotone" dataKey="postTest" name="During holdout" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">No data yet for the post-test window — wait for at least one day of CMS data after holdout start.</p>
          )}
          <TrustBadge source="fact_web_orders" tier="confirmed" />
        </div>
      )}

      {/* Decision panel */}
      {decision && (
        <div className={`rounded-lg border-2 p-5 shadow-sm ${decision.outcome.startsWith('A') ? 'border-green-300 bg-green-50' : decision.outcome.startsWith('B') ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Decision (day 14+)</h3>
          <p className="text-base font-medium text-gray-900">{decision.outcome}</p>
          <p className="text-sm text-gray-700 mt-2">{decision.action}</p>
          <TrustBadge source="Step 10 decision matrix applied to post-test averages" tier={decision.tier as any} />
        </div>
      )}

      {/* Protocol summary (always shown) */}
      {protocol && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Protocol summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="font-medium text-gray-700 w-32">Campaign:</span>
              <span className="text-gray-900 font-mono text-xs">{protocol.campaign}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 w-32">Duration:</span>
              <span className="text-gray-900">{protocol.duration}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 w-32">Method:</span>
              <span className="text-gray-900">{protocol.method}</span>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mt-5 mb-2">Decision matrix</h4>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Outcome</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {protocol.decisionMatrix.map((m, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-gray-900">{m.outcome}</td>
                  <td className="px-3 py-2 text-gray-700">{m.action}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
            <p className="font-semibold mb-1">How to flip the switch</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Open Meta Ads Manager → account <code className="bg-white px-1 rounded">act_14359173</code> (Phonebot)</li>
              <li>Filter Active campaigns; find <code className="bg-white px-1 rounded">Cold | TOF | 2 ad sets | DPA+Vids+image | Must creatives</code></li>
              <li>Toggle Status to <strong>Off</strong> (do NOT delete)</li>
              <li>Confirm <code className="bg-white px-1 rounded">Retargeting new cost cap $45</code> stays Active (don't pause)</li>
              <li>Lead-gen campaigns (whatsapp buyback, +10km, UAE) — leave as-is</li>
              <li>Return here, enter today's date in the start control above</li>
              <li>For 14 days: don't change AW spend, don't run promos, don't restock anchor SKUs if avoidable</li>
            </ol>
          </div>
        </div>
      )}

      {/* Watchpoints during test */}
      {startDate && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Watch alongside CMS orders during the test
          </h4>
          <ul className="space-y-1 text-amber-800 list-disc list-inside">
            <li><strong>GSC branded "phonebot" clicks</strong> — should drop within 5-10 days IF Cold drives upper-funnel brand awareness (baseline {baseline?.gscBrandedAvg.toFixed(1)} clicks/day)</li>
            <li><strong>GA4 facebook/cpc sessions</strong> — currently near zero (broken pixel); watch for further drop</li>
            <li><strong>AW PMax efficiency</strong> — if FB was filling upper funnel, retargeting might see efficiency drop</li>
            <li><strong>Confound triggers</strong>: public holiday, weather event, AW spend change, inventory restock — if any happen, mark and re-run for 14 days clean</li>
          </ul>
        </div>
      )}
    </div>
  );
}
