import { useState } from 'react';
import { trpc } from '../providers/trpc';
import TrustBadge from '../components/widgets/TrustBadge';
import { formatCurrency, formatPercent, formatNumber } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingDown, RefreshCcw, Package, HelpCircle, Mail } from 'lucide-react';

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#4f46e5', '#db2777', '#65a30d', '#facc15'];

export default function Diagnostics() {
  const mix = trpc.diagnostics.brandConditionMixShift.useQuery();
  const refunds = trpc.diagnostics.refundByBrandTime.useQuery();
  const inventory = trpc.diagnostics.inventoryTracker.useQuery();
  const inventoryPulse = trpc.diagnostics.inventoryPulse.useQuery();
  const skuPerf = trpc.diagnostics.shoppingSkuPerformance.useQuery();
  const unassigned = trpc.diagnostics.unassignedInvestigation.useQuery();
  const repeat = trpc.diagnostics.repeatByChannel.useQuery();
  const [showEmail, setShowEmail] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Diagnostics</h2>
        <p className="text-sm text-gray-500">Where the money is bleeding, what's recovering, what's broken in measurement</p>
      </div>

      {/* BRAND × CONDITION MIX SHIFT */}
      {mix.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Brand mix-shift trend (web revenue, monthly)</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Step 8 finding: iPad lost A$53k/mo, MacBook collapsed -88%, iPhone Like New is the only price-pressure signal.
            Watch the relative bar heights month-over-month — if iPad keeps shrinking, supply or pricing is the question.
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mix.data.revSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                {mix.data.brands.slice(0, 8).map((b, i) => (
                  <Bar key={b} dataKey={b} stackId="rev" fill={COLORS[i % COLORS.length]} name={b} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <TrustBadge source="fact_web_orders grouped by month × Brand" tier="confirmed" caveat="Jul-Nov 2025 gap visible as missing months. Brand extracted from Products free-text via regex." />
        </div>
      )}

      {/* GMC INVENTORY PULSE — confirms PMax-follows-stock hypothesis */}
      {inventoryPulse.data && (
        <div className="bg-white rounded-lg border border-purple-300 p-5 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-purple-700" />
            <h3 className="text-lg font-semibold text-gray-900">Google Merchant Center inventory — RIGHT NOW</h3>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            <strong>This validates the "PMax spend follows stock" hypothesis.</strong> {formatNumber(inventoryPulse.data.summary.total_skus)} SKUs in feed,
            <strong className="text-red-700"> only {formatPercent(inventoryPulse.data.summary.in_stock / inventoryPulse.data.summary.total_skus)} in stock</strong>
            ({inventoryPulse.data.summary.in_stock} of {inventoryPulse.data.summary.total_skus}). Snapshot: {inventoryPulse.data.summary.snapshot_date}.
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded">
              <p className="text-xs text-green-600">In stock</p>
              <p className="text-2xl font-bold text-green-900">{formatNumber(inventoryPulse.data.summary.in_stock)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <p className="text-xs text-red-600">Out of stock</p>
              <p className="text-2xl font-bold text-red-900">{formatNumber(inventoryPulse.data.summary.out_of_stock)}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded">
              <p className="text-xs text-amber-600">Preorder</p>
              <p className="text-2xl font-bold text-amber-900">{formatNumber(inventoryPulse.data.summary.preorder)}</p>
            </div>
          </div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">In-stock rate by brand (correlates with which PMax campaigns can spend)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Brand</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Total SKUs</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">In stock</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Out</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">% In stock</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Avg price (in-stock)</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">PMax serving signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventoryPulse.data.byBrand.slice(0, 20).map((b) => (
                  <tr key={b.brand}>
                    <td className="px-3 py-2 font-medium text-gray-900">{b.brand}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatNumber(b.total)}</td>
                    <td className="px-3 py-2 text-right text-green-700">{formatNumber(b.in_stock)}</td>
                    <td className="px-3 py-2 text-right text-red-700">{formatNumber(b.out_of_stock)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${b.in_stock_pct >= 0.30 ? 'text-green-700' : b.in_stock_pct >= 0.15 ? 'text-amber-700' : 'text-red-700'}`}>
                      {formatPercent(b.in_stock_pct)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">{b.avg_price ? formatCurrency(b.avg_price) : '—'}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {b.in_stock_pct >= 0.30 ? '✅ PMax can serve heavily' : b.in_stock_pct >= 0.15 ? '⚠ Limited serving' : '❌ Almost no serving'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TrustBadge source="Google Merchant Center via Supermetrics (account 101150783)" tier="confirmed" caveat="Single-day snapshot. Daily snapshots over time would let you correlate PMax spend changes with feed availability changes." />
          <div className="mt-3 p-3 bg-purple-100 rounded text-xs text-purple-900">
            <strong>What to look at next:</strong> Apple 39% in-stock vs Xiaomi 5% / Huawei 5% — exactly explains why Apple PMax keeps spending and Xiaomi/Huawei went to zero. Microsoft 3% / Beats 0% / Nothing 0% / ZTE 0% / Jabra 0% — these SKUs cannot serve at all even if you funded them.
          </div>
        </div>
      )}

      {/* SHOPPING SKU × STOCK CROSS-REFERENCE */}
      {skuPerf.data && (
        <div className="bg-white rounded-lg border border-red-300 p-5 shadow-sm bg-gradient-to-br from-red-50 to-orange-50">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-red-700" />
            <h3 className="text-lg font-semibold text-gray-900">Shopping SKUs ↔ GMC stock cross-reference</h3>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Joining AW Shopping per-SKU spend with GMC catalog availability. Confirms the supply hypothesis empirically: brands with more in-stock SKUs spend more in Shopping.
          </p>

          {/* Brand-level join */}
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Brand-level: Shopping spend vs in-stock SKUs (joined)</h4>
          <div className="overflow-x-auto mb-5">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Brand</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Shopping SKUs (active)</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Spend /30d</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Platform ROAS</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">GMC total SKUs</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">GMC in-stock</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">% in-stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {skuPerf.data.brandJoin.slice(0, 15).map((b) => (
                  <tr key={b.brand}>
                    <td className="px-3 py-2 font-medium text-gray-900 capitalize">{b.brand}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{b.shopping_skus}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{b.shopping_spend > 0 ? formatCurrency(b.shopping_spend) : '—'}</td>
                    <td className={`px-3 py-2 text-right font-medium ${b.shopping_roas >= 5 ? 'text-green-700' : b.shopping_roas >= 2 ? 'text-blue-700' : 'text-amber-700'}`}>
                      {b.shopping_roas > 0 ? `${b.shopping_roas.toFixed(1)}×` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">{b.gmc_total_skus}</td>
                    <td className="px-3 py-2 text-right text-green-700">{b.gmc_in_stock}</td>
                    <td className={`px-3 py-2 text-right font-bold ${b.gmc_in_stock_pct >= 0.30 ? 'text-green-700' : b.gmc_in_stock_pct >= 0.15 ? 'text-amber-700' : 'text-red-700'}`}>
                      {b.gmc_in_stock_pct > 0 ? formatPercent(b.gmc_in_stock_pct) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Wasteful SKUs */}
          <h4 className="text-sm font-semibold text-red-700 mb-2">⚠ High-spend SKUs with ZERO conversions (cut or fix)</h4>
          <div className="overflow-x-auto mb-5">
            <table className="min-w-full text-sm">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-red-700">Brand</th>
                  <th className="px-3 py-2 text-left font-medium text-red-700">Product</th>
                  <th className="px-3 py-2 text-left font-medium text-red-700">Campaign</th>
                  <th className="px-3 py-2 text-right font-medium text-red-700">Spend /30d</th>
                  <th className="px-3 py-2 text-right font-medium text-red-700">Clicks</th>
                  <th className="px-3 py-2 text-right font-medium text-red-700">Impressions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {skuPerf.data.wasteful.map((s, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-gray-900 capitalize">{s.brand}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{s.title}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{s.campaign_name}</td>
                    <td className="px-3 py-2 text-right font-bold text-red-700">{formatCurrency(s.cost)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatNumber(s.clicks)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatNumber(s.impressions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top spending SKUs */}
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Top 30 SKUs by spend (last 30d)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Product</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Campaign</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Spend</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Conv</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Value</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Platform ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {skuPerf.data.topSpend.map((s, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-xs text-gray-700">{s.title}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{s.campaign_name}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(s.cost)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{s.conversions.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(s.conversion_value)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${s.roas >= 5 ? 'text-green-700' : s.roas >= 1 ? 'text-blue-700' : 'text-red-700'}`}>
                      {s.roas > 0 ? `${s.roas.toFixed(1)}×` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TrustBadge source="AW ShoppingPerformanceView (item-level) + GMC catalog snapshot, joined on brand" tier="reconciled" caveat="Platform ROAS shown — over-attributed by ~5× per locked triangulation. 0-conv high-spend SKUs are likely waste OR have lagged conversions; cut after 14 days of zero." />
        </div>
      )}

      {/* INVENTORY RESTORATION TRACKER */}
      {inventory.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Inventory restoration tracker</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            5 categories that collapsed in Step 8 product-cliff analysis. Total revenue gap vs peak: <strong>{formatCurrency(inventory.data.totalGap)}/mo</strong>.
            Recovery means restoring monthly revenue toward the peak (Sep 2025 reference). Procurement-side problem.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inventory.data.categories.map((c) => (
              <div key={c.brand} className="border border-gray-200 rounded p-3">
                <div className="flex items-baseline justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{c.brand}</h4>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${c.recoveryPct < 0.2 ? 'bg-red-100 text-red-800' : c.recoveryPct < 0.5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {formatPercent(c.recoveryPct)} of peak
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <p className="text-gray-500">Peak (mo)</p>
                    <p className="font-bold text-gray-900">{formatCurrency(c.peakRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Latest (mo)</p>
                    <p className="font-bold text-gray-900">{formatCurrency(c.recentRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Gap</p>
                    <p className="font-bold text-red-700">-{formatCurrency(c.gapVsPeak)}</p>
                  </div>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={c.series}>
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Line type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
          <TrustBadge source="fact_web_orders, monthly aggregate by Brand" tier="confirmed" caveat="Recovery target = each category's own historical peak (proxy for 'what's possible')." />
        </div>
      )}

      {/* REFUND BY BRAND × TIME */}
      {refunds.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCcw className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Refund rate by brand × time</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Lifetime high-refund brands (top 5 from QA findings: Xiaomi 22.78%, AirPods 12.19%). Trend tells you if quality control is improving.
          </p>

          {/* Lifetime top */}
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Lifetime refund rate by brand (≥30 orders)</h4>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Brand</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Orders</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Refunded</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Refund rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {refunds.data.lifetime.map((r) => (
                  <tr key={r.brand}>
                    <td className="px-3 py-2 font-medium text-gray-900">{r.brand}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatNumber(r.orders)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatNumber(r.refunded)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${r.refund_rate > 0.10 ? 'text-red-700' : r.refund_rate > 0.05 ? 'text-amber-700' : 'text-green-700'}`}>
                      {formatPercent(r.refund_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trend over time */}
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Monthly trend (top 5 brands by volume)</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={refunds.data.series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => formatPercent(v)} />
                <Tooltip formatter={(v: number) => formatPercent(v)} />
                <Legend />
                {(refunds.data.lifetime.slice(0, 6).map(b => b.brand)).map((b, i) => (
                  <Line key={b} type="monotone" dataKey={b} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <TrustBadge source="fact_web_orders × was_refunded" tier="confirmed" caveat="Brands with <10 orders/month dropped (noise floor)." />
        </div>
      )}

      {/* PM UNASSIGNED INVESTIGATION */}
      {unassigned.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">PM Unassigned investigation — A$38k/mo of unattributed GP</h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-amber-50 rounded">
              <p className="text-xs text-amber-600">Share of total PM-GP</p>
              <p className="text-2xl font-bold text-amber-900">{formatPercent(unassigned.data.shareOfTotalGp)}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded">
              <p className="text-xs text-amber-600">GP / 30d</p>
              <p className="text-2xl font-bold text-amber-900">{formatCurrency(unassigned.data.gp)}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded">
              <p className="text-xs text-amber-600">Sessions</p>
              <p className="text-2xl font-bold text-amber-900">{formatNumber(unassigned.data.sessions)}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded">
              <p className="text-xs text-amber-600">Purchases</p>
              <p className="text-2xl font-bold text-amber-900">{formatNumber(unassigned.data.purchases)}</p>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-2">What we know</h4>
          <table className="min-w-full text-sm mb-4">
            <tbody className="divide-y divide-gray-200">
              {unassigned.data.knownNumbers.map((k, i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5 text-gray-700">{k.metric}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-gray-900">{k.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 className="text-sm font-semibold text-gray-700 mb-2">Hypotheses (ranked by probability)</h4>
          <div className="space-y-2 mb-4">
            {unassigned.data.hypotheses.map((h, i) => (
              <div key={i} className="border border-gray-200 rounded p-3">
                <div className="flex items-baseline justify-between mb-1">
                  <p className="font-medium text-gray-900 text-sm">{h.hypothesis}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${h.probability === 'High' ? 'bg-orange-100 text-orange-800' : h.probability === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                    {h.probability}
                  </span>
                </div>
                <p className="text-xs text-gray-700 mb-1"><strong>Evidence:</strong> {h.evidence}</p>
                <p className="text-xs text-gray-600"><strong>How to test:</strong> {h.test}</p>
              </div>
            ))}
          </div>

          <div className="border border-gray-200 rounded p-3">
            <button
              onClick={() => setShowEmail(!showEmail)}
              className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              <Mail className="w-4 h-4" />
              {showEmail ? 'Hide' : 'Show'} draft email to ProfitMetrics support
            </button>
            {showEmail && (
              <pre className="mt-3 p-3 bg-gray-50 rounded text-xs whitespace-pre-wrap font-mono">{unassigned.data.draftEmail}</pre>
            )}
          </div>

          <TrustBadge source="ProfitMetrics channel rev/gp + interpretive hypotheses" tier="inferred" caveat="Hypotheses are not measured; they're informed guesses based on industry-standard tracking failure modes." />
        </div>
      )}

      {/* REPEAT BY ACQUISITION CHANNEL */}
      {repeat.data && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Repeat-purchase cohort (overall)</h3>

          <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm text-amber-900">
            <p className="font-semibold mb-1">⚠ Per-channel repeat rate is NOT computable from current data</p>
            <p className="text-xs text-amber-800">{repeat.data.limitation}</p>
            <div className="mt-2 text-xs">
              <p className="font-medium">What would unlock this:</p>
              <ul className="list-disc list-inside text-amber-800 mt-1">
                {repeat.data.whatWouldUnlockThis.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-2">Cohort retention (overall, all channels combined)</h4>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Cohort month</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Size</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">M+1</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">M+3</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">M+6</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">M+12</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {repeat.data.cohorts.map((c) => (
                  <tr key={c.cohort_month}>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{c.cohort_month?.slice(0, 7)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{c.cohort_size}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{formatPercent(c.m1 || 0)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{formatPercent(c.m3 || 0)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{formatPercent(c.m6 || 0)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{formatPercent(c.m12 || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-2">Most recent month's channel mix (1m, GA4 last-click)</h4>
          <p className="text-xs text-gray-500 mb-2">If we assume each channel's repeat rate matches the overall rate (no better signal available), this is the channel mix new customers come through.</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Channel</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Sessions</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Purchases</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Share of purchases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {repeat.data.channelMix.map((c) => (
                  <tr key={c.channel}>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{c.channel}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{formatNumber(c.sessions)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{formatNumber(c.purchases)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{formatPercent(c.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TrustBadge source="fact_web_orders Email-join cohort + GA4 channel summary 30d" tier="estimated" caveat="Per-channel repeat rate is approximate (no order-level UTM)." />
        </div>
      )}
    </div>
  );
}
