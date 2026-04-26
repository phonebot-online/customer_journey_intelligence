import { useState } from 'react';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { formatCurrency } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Zap, Target, Rocket, AlertTriangle } from 'lucide-react';

type Mode = 'cheap' | 'sweet' | 'aggressive';

const MODE_CONFIG: Record<Mode, { label: string; icon: typeof Zap; color: string; bg: string }> = {
  cheap: { label: 'Cheapest path', icon: Zap, color: 'text-green-700', bg: 'border-green-300 bg-green-50' },
  sweet: { label: 'Sweet spot', icon: Target, color: 'text-blue-700', bg: 'border-blue-300 bg-blue-50' },
  aggressive: { label: 'Aggressive scaling', icon: Rocket, color: 'text-red-700', bg: 'border-red-300 bg-red-50' },
};

export default function Scenarios() {
  const [activeMode, setActiveMode] = useState<Mode | 'custom'>('sweet');
  const [custom, setCustom] = useState({ aw: 597, fb: 117, bing: 115 });

  const compare = trpc.strategy.comparePlanningModes.useQuery();
  const channelCurves = trpc.strategy.channelCurves.useQuery();
  const multiWindow = trpc.diagnostics.multiWindowEfficiency.useQuery();

  const customForecast = trpc.strategy.forecastScenario.useQuery(custom, { enabled: activeMode === 'custom' });
  const activePreset = activeMode !== 'custom' ? compare.data?.find(m => m.mode === activeMode) : null;

  const activeForecast = activeMode === 'custom' ? customForecast.data : activePreset?.forecast;
  const activeRationale = activeMode === 'custom' ? 'Custom allocation — adjust sliders below.' : activePreset?.rationale;
  const activeRisks = activeMode === 'custom' ? [] : (activePreset?.risks || []);
  const activeActions = activeMode === 'custom' ? [] : (activePreset?.actions || []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Scenario Sandbox</h2>
        <p className="text-sm text-gray-500">What-if controls for platform strategy. Forecasts inferred from saturating-curve fits — not causal.</p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => {
          const cfg = MODE_CONFIG[m];
          const Icon = cfg.icon;
          const data = compare.data?.find(p => p.mode === m);
          const isActive = activeMode === m;
          return (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${isActive ? `${cfg.bg} shadow-md` : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
              <div className={`flex items-center gap-2 mb-2 ${cfg.color}`}>
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{cfg.label}</span>
              </div>
              {data && (
                <>
                  <p className="text-xs text-gray-600">Daily spend total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(data.forecast.daily.spend)}</p>
                  <p className="text-xs text-gray-600 mt-1">Monthly net (range)</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(data.forecast.monthly.netLow)} – {formatCurrency(data.forecast.monthly.netHigh)}
                  </p>
                </>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setActiveMode('custom')}
          className={`text-left p-4 rounded-lg border-2 transition-all ${activeMode === 'custom' ? 'border-purple-300 bg-purple-50 shadow-md' : 'bg-white border-gray-200 hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2 mb-2 text-purple-700">
            <span className="font-semibold">Custom allocation</span>
          </div>
          <p className="text-xs text-gray-600">Manual control</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency((custom.aw + custom.fb + custom.bing) * 30)}/mo spend</p>
        </button>
      </div>

      {/* Custom allocation editor */}
      {activeMode === 'custom' && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom allocation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['aw', 'fb', 'bing'] as const).map((k) => {
              const labels = { aw: 'Google Ads', fb: 'Facebook + IG', bing: 'Bing Ads' };
              const max = { aw: 2000, fb: 1000, bing: 500 };
              return (
                <div key={k}>
                  <label className="block text-sm font-medium text-gray-900">{labels[k]}</label>
                  <p className="text-xs text-gray-500 mb-2">Daily spend (AUD)</p>
                  <input
                    type="range"
                    min={0}
                    max={max[k]}
                    step={5}
                    value={custom[k]}
                    onChange={(e) => setCustom({ ...custom, [k]: Number(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-medium text-gray-900">A${custom[k]}/day</span>
                    <span className="text-xs text-gray-500">A${(custom[k] * 30).toLocaleString()}/30d</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Forecast panel */}
      {activeForecast && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Forecast for selected scenario</h3>

          {activeRationale && (
            <p className="text-sm text-gray-700 italic mb-4">{activeRationale}</p>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Monthly spend</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(activeForecast.monthly.spend)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-xs text-blue-600">Monthly GP (paid + non-paid)</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(activeForecast.monthly.totalGP)}</p>
              <p className="text-xs text-blue-700 mt-0.5">Non-paid floor: {formatCurrency(activeForecast.monthly.nonPaidGP)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <p className="text-xs text-green-600">Monthly net (range)</p>
              <p className="text-xl font-bold text-green-900">{formatCurrency(activeForecast.monthly.netLow)} – {formatCurrency(activeForecast.monthly.netHigh)}</p>
              <p className="text-xs text-green-700 mt-0.5">point estimate {formatCurrency(activeForecast.monthly.net)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <p className="text-xs text-purple-600">Net per day</p>
              <p className="text-xl font-bold text-purple-900">{formatCurrency(activeForecast.daily.net)}</p>
              <p className="text-xs text-purple-700 mt-0.5">at A${activeForecast.daily.spend.toFixed(0)} spend/day</p>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-2">Per-channel breakdown</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm mb-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Channel</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Daily spend</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Daily GP</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Efficiency (GP/$)</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Daily net</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Warning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeForecast.perChannel.map((c) => (
                  <tr key={c.key}>
                    <td className="px-3 py-2 font-medium text-gray-900">{c.label}</td>
                    <td className="px-3 py-2 text-right text-gray-700">A${c.spend.toFixed(0)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">A${c.gp.toFixed(0)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${c.efficiency >= 1.5 ? 'text-green-700' : c.efficiency >= 1.0 ? 'text-blue-700' : c.efficiency > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                      {c.efficiency > 0 ? `${c.efficiency.toFixed(2)}×` : '—'}
                    </td>
                    <td className={`px-3 py-2 text-right font-medium ${c.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>A${c.net.toFixed(0)}</td>
                    <td className="px-3 py-2 text-xs text-amber-700">{c.warning || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activeRisks.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm font-semibold text-amber-900 mb-1">Risks</p>
                <ul className="space-y-1 text-xs text-amber-800">
                  {activeRisks.map((r, i) => <li key={i}>· {r}</li>)}
                </ul>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900 mb-1">Recommended actions</p>
                <ul className="space-y-1 text-xs text-blue-800">
                  {activeActions.map((a, i) => <li key={i}>· {a}</li>)}
                </ul>
              </div>
            </div>
          )}

          <TrustBadge
            source="Saturating-curve fits from locked Step 7 multi-window triangulation"
            caveat="Forecasts are inferred from observational data. Net profit shown as range (±30%); not causal."
            tier="estimated"
          />
        </div>
      )}

      {/* Saturating curves chart */}
      {channelCurves.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Saturating-returns curves (transparency)</h3>
          <p className="text-xs text-gray-500 mb-3">
            Each curve fits the four (daily spend, real GP/$) data points from the 1m/3m/6m/12m windows. Curves are observational fits, not causal forecasts. Marker shows current scenario allocation.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="spend" type="number" domain={[0, 2500]} tickFormatter={(v) => `$${v}`} label={{ value: 'Daily spend (A$)', position: 'insideBottom', offset: -5 }} />
                <YAxis tickFormatter={(v) => `${v.toFixed(1)}×`} label={{ value: 'GP / $ spent', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(2)}×`} labelFormatter={(v) => `A$${v}/day`} />
                <Legend />
                {channelCurves.data.map((c, i) => (
                  <Line
                    key={c.key}
                    name={c.label}
                    data={c.curvePoints.map(p => ({ spend: p.spend, [c.label]: p.efficiency }))}
                    dataKey={c.label}
                    type="monotone"
                    stroke={['#2563eb', '#dc2626', '#16a34a'][i]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <TrustBadge
            source="Locked Step 7 multi-window triangulation (1m/3m/6m/12m efficiency × spend pairs)"
            caveat="Curves are log-linear fits. ±30% uncertainty band on inferred efficiency. Don't extrapolate past observed spend ranges."
            tier="inferred"
          />
        </div>
      )}

      {/* Multi-window efficiency comparison */}
      {multiWindow.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Multi-window efficiency comparison (1m / 3m / 6m / 12m)</h3>
          <p className="text-xs text-gray-500 mb-3">
            How current paid spend levels compare across rolling windows. The shape (efficiency vs spend) tells you whether the saturating-returns story is stable across time. AW row across windows: efficiency rose 1.27→2.49× as spend was cut from A$1,299/day to A$637/day.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Window</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">AW spend/d</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">AW eff (GP/$)</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">FB spend/d</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">FB eff</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Bing spend/d</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Bing eff</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">CMS orders/d</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">CMS rev/d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {multiWindow.data.map((w) => (
                  <tr key={w.window}>
                    <td className="px-3 py-2 font-medium text-gray-900">{w.window}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(w.aw_spend)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${w.aw_efficiency >= 1.5 ? 'text-green-700' : w.aw_efficiency >= 1.0 ? 'text-blue-700' : 'text-red-700'}`}>{w.aw_efficiency.toFixed(2)}×</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(w.fb_spend)}</td>
                    <td className="px-3 py-2 text-right font-medium text-red-700">{w.fb_efficiency.toFixed(2)}×</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(w.bing_spend)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${w.bing_efficiency >= 1.5 ? 'text-green-700' : 'text-blue-700'}`}>{w.bing_efficiency.toFixed(2)}×</td>
                    <td className="px-3 py-2 text-right text-gray-700">{w.cms_orders.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(w.cms_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TrustBadge source="Per-window aggregates × saturating-curve fits" tier="reconciled" caveat="Efficiency = output of saturating curve at the window's avg daily spend." />
        </div>
      )}

      {/* Side-by-side comparison */}
      {compare.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Side-by-side mode comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Metric</th>
                  {compare.data.map((m) => (
                    <th key={m.mode} className="px-3 py-2 text-right font-medium text-gray-500 capitalize">{MODE_CONFIG[m.mode as Mode].label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-2 font-medium text-gray-900">AW daily spend</td>
                  {compare.data.map((m) => <td key={m.mode} className="px-3 py-2 text-right text-gray-700">A${m.allocation.aw}</td>)}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-gray-900">FB daily spend</td>
                  {compare.data.map((m) => <td key={m.mode} className="px-3 py-2 text-right text-gray-700">A${m.allocation.fb}</td>)}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-gray-900">Bing daily spend</td>
                  {compare.data.map((m) => <td key={m.mode} className="px-3 py-2 text-right text-gray-700">A${m.allocation.bing}</td>)}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">Monthly spend total</td>
                  {compare.data.map((m) => <td key={m.mode} className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(m.forecast.monthly.spend)}</td>)}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-gray-900">Monthly GP</td>
                  {compare.data.map((m) => <td key={m.mode} className="px-3 py-2 text-right text-blue-700">{formatCurrency(m.forecast.monthly.totalGP)}</td>)}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">Monthly net (range)</td>
                  {compare.data.map((m) => (
                    <td key={m.mode} className="px-3 py-2 text-right font-medium text-green-700">
                      {formatCurrency(m.forecast.monthly.netLow)} – {formatCurrency(m.forecast.monthly.netHigh)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Persistent caveat banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Forecast trust statement</p>
            <p>
              All net profit numbers shown are <strong>inferred from observational data</strong>. The saturating-return curves are log-linear fits to the four locked window points (1m/3m/6m/12m).
              Causal proof of any per-channel incremental contribution requires a holdout test. Currently <strong>only FB is queued</strong> for holdout (Step 10 protocol).
              Treat all "monthly net" numbers as <strong>ranges, not predictions</strong>. Decisions of A$10k+/mo magnitude warrant a separate validation step before execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
