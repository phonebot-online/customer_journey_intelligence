import { useState } from 'react';
import TrustBadge from '../components/widgets/TrustBadge';
import { Brain, Settings, Plug, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../types';

const STORAGE_KEY = 'phonebot_ai_source_config';

type AIConfig = {
  source: 'none' | 'shopify-recs' | 'ga4-events' | 'tidio-chat' | 'custom-widget';
  configured: boolean;
};

// Mock placeholder data — shows the page structure F will see when AI source is wired.
// All numbers labelled "PLACEHOLDER — wire your AI source to populate this".
const PLACEHOLDER_KPIS = {
  recommendationImpressions: 12500,
  recommendationClicks: 425,
  recommendationCTR: 0.034,
  recommendedItemPurchases: 38,
  recommendationConversionRate: 0.089,
  recommendationRevenue: 18200,
  crossSellAttachRate: 0.12,
  aiAssistedPurchases: 84,
  avgItemsPerRecCart: 1.4,
};

export default function AIInsights() {
  const [config, setConfig] = useState<AIConfig>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return saved ? JSON.parse(saved) : { source: 'none', configured: false };
  });

  const updateConfig = (next: AIConfig) => {
    setConfig(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const isLive = config.configured;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Sales & Recommendations</h2>
        <p className="text-sm text-gray-500">Track AI-powered product recommendations, chat sales, and cross-sell impact</p>
      </div>

      {/* Status banner */}
      {!isLive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">No AI data source connected — showing placeholder structure</p>
            <p className="text-sm text-amber-800 mt-1">
              All numbers below are PLACEHOLDERS that demonstrate what this page will show once you connect a data source.
              Configure the source below.
            </p>
          </div>
        </div>
      )}

      {/* Configuration panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Data source configuration</h3>
        </div>
        <p className="text-sm text-gray-700 mb-4">Pick the platform powering your AI recommendations or AI sales feature:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {[
            { key: 'shopify-recs' as const, label: 'Shopify Product Recommendations', desc: 'Built-in Shopify recs widget. Data via Shopify Analytics API or theme JS event tracking.' },
            { key: 'ga4-events' as const, label: 'GA4 custom events', desc: 'Event-level tracking of recommendation impressions/clicks. Needs `recommendation_view`, `recommendation_click`, `recommendation_purchase` events.' },
            { key: 'tidio-chat' as const, label: 'Tidio / Intercom AI chat', desc: 'AI chatbot conversation → conversion attribution. Data via chatbot platform API.' },
            { key: 'custom-widget' as const, label: 'Custom on-site recommendation engine', desc: 'In-house built widget. Data via custom analytics endpoint or BigQuery export.' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => updateConfig({ source: opt.key, configured: false })}
              className={`text-left p-3 rounded border-2 transition-colors ${config.source === opt.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
              <p className="text-xs text-gray-600 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>

        {config.source !== 'none' && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-700 mb-2"><strong>Wiring instructions for {config.source}:</strong></p>
            {config.source === 'shopify-recs' && (
              <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                <li>Confirm Phonebot uses Shopify (vs custom CMS).</li>
                <li>If yes: enable Shopify Analytics API access. Generate Admin API token.</li>
                <li>Add a script that polls /admin/api/2024-01/reports/recommendations (or GraphQL equivalent) nightly.</li>
                <li>Drop the result CSV into <code>customer_journey_intelligence/1_month/ai_recommendations/</code>.</li>
                <li>Add a <code>fact_ai_recommendations</code> table in <code>api/lib/duckdb.ts</code> matching the CSV schema.</li>
                <li>Add a tRPC procedure in <code>api/routers/diagnostics.ts</code>: <code>aiRecommendations</code>.</li>
                <li>Mark this page as configured (toggle below).</li>
              </ol>
            )}
            {config.source === 'ga4-events' && (
              <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                <li>Add the following events to your site's tracking: <code>recommendation_view</code>, <code>recommendation_click</code>, <code>recommendation_purchase</code> with <code>recommendation_id</code>, <code>position</code>, <code>source</code> params.</li>
                <li>Wait 24h for GA4 to populate.</li>
                <li>Pull via Supermetrics: ds_id GAWA, dimensions <code>eventName</code>, <code>customEvent:recommendation_id</code>, metric <code>eventCount</code>.</li>
                <li>Drop CSV into <code>1_month/ga4/recommendation_events.csv</code>.</li>
                <li>Add a tRPC procedure to query and aggregate.</li>
              </ol>
            )}
            {config.source === 'tidio-chat' && (
              <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                <li>Generate Tidio API key (or Intercom equivalent).</li>
                <li>Pull conversations + conversion events nightly via their REST API.</li>
                <li>Match conversation IDs to CMS orders (by email or session ID if Tidio passes a customer identifier).</li>
                <li>Drop summary CSV into <code>1_month/ai_chat/conversations_30d.csv</code>.</li>
              </ol>
            )}
            {config.source === 'custom-widget' && (
              <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                <li>Identify the widget's data sink (database table, log file, GA4 events, etc.).</li>
                <li>Build a nightly script to extract impressions, clicks, attributed purchases.</li>
                <li>Drop a CSV into <code>1_month/ai_recommendations/</code>.</li>
                <li>Wire the table + tRPC procedure as above.</li>
              </ol>
            )}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => updateConfig({ ...config, configured: !config.configured })}
                className={`text-sm font-medium px-4 py-1.5 rounded ${config.configured ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {config.configured ? '✓ Marked as configured' : 'Mark as configured (toggle)'}
              </button>
              <p className="text-xs text-gray-500">{config.configured ? 'Page will pull live data once backend procedure is wired.' : 'Toggle when you have completed the wiring.'}</p>
            </div>
          </div>
        )}
      </div>

      {/* KPI placeholders */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI recommendation KPIs {!isLive && <span className="text-xs text-amber-700 ml-2">(placeholder)</span>}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-purple-50 rounded">
            <p className="text-xs text-purple-600">Recommendation impressions</p>
            <p className="text-2xl font-bold text-purple-900">{formatNumber(PLACEHOLDER_KPIS.recommendationImpressions)}</p>
            <p className="text-xs text-purple-700 mt-1">/30d</p>
          </div>
          <div className="p-3 bg-purple-50 rounded">
            <p className="text-xs text-purple-600">Clicks</p>
            <p className="text-2xl font-bold text-purple-900">{formatNumber(PLACEHOLDER_KPIS.recommendationClicks)}</p>
            <p className="text-xs text-purple-700 mt-1">CTR {formatPercent(PLACEHOLDER_KPIS.recommendationCTR)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <p className="text-xs text-green-600">Recommended-item purchases</p>
            <p className="text-2xl font-bold text-green-900">{PLACEHOLDER_KPIS.recommendedItemPurchases}</p>
            <p className="text-xs text-green-700 mt-1">CR {formatPercent(PLACEHOLDER_KPIS.recommendationConversionRate)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-xs text-blue-600">Recommendation-attributed revenue</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(PLACEHOLDER_KPIS.recommendationRevenue)}</p>
            <p className="text-xs text-blue-700 mt-1">/30d</p>
          </div>
          <div className="p-3 bg-orange-50 rounded">
            <p className="text-xs text-orange-600">Cross-sell attach rate</p>
            <p className="text-2xl font-bold text-orange-900">{formatPercent(PLACEHOLDER_KPIS.crossSellAttachRate)}</p>
            <p className="text-xs text-orange-700 mt-1">orders with ≥1 rec item</p>
          </div>
          <div className="p-3 bg-pink-50 rounded">
            <p className="text-xs text-pink-600">AI-assisted purchases</p>
            <p className="text-2xl font-bold text-pink-900">{PLACEHOLDER_KPIS.aiAssistedPurchases}</p>
            <p className="text-xs text-pink-700 mt-1">touched chat or rec widget</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded">
            <p className="text-xs text-indigo-600">Avg items / rec-cart</p>
            <p className="text-2xl font-bold text-indigo-900">{PLACEHOLDER_KPIS.avgItemsPerRecCart.toFixed(2)}</p>
            <p className="text-xs text-indigo-700 mt-1">vs A$1.0 baseline</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">AI net contribution est.</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(PLACEHOLDER_KPIS.recommendationRevenue * 0.27)}</p>
            <p className="text-xs text-gray-700 mt-1">at 27% margin</p>
          </div>
        </div>
        <TrustBadge source={isLive ? 'AI source data' : 'PLACEHOLDER (illustrative only)'} tier={isLive ? 'reconciled' : 'uncertain'} caveat={isLive ? undefined : 'Wire a data source to populate. Numbers above are mock.'} />
      </div>

      {/* What this enables */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Plug className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">What wiring this unlocks</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>· <strong>Cross-sell decision support:</strong> see if AI recs lift average items/cart on accessory purchases (Phonebot's repeat customers buy accessories at 31-day median — AI recs are the natural fit).</li>
          <li>· <strong>Revenue attribution beyond CMS truth:</strong> separates "would have bought anyway" from "bought because rec showed it".</li>
          <li>· <strong>Test design feedback:</strong> A/B testing rec-position, rec-algorithm, chat-trigger conditions becomes measurable.</li>
          <li>· <strong>Closes one of the locked Step 9 question marks:</strong> "do AI recommendations and AI sales materially improve cross-sell or conversion after traffic enters through paid or organic?"</li>
        </ul>
      </div>

      {/* Ready-to-build candidate widgets */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick-start AI recommendation candidates</h3>
        <p className="text-xs text-gray-500 mb-3">If Phonebot doesn't currently have an AI recs feature live, here are the fastest wins to consider:</p>
        <div className="space-y-2 text-sm">
          {[
            { name: 'Shopify Product Recommendations API', effort: '2 hrs (if on Shopify)', impact: '+5-10% AOV typical' },
            { name: 'Klaviyo Smart Send Time + AI subject lines', effort: '1 hr (when Klaviyo restored)', impact: '+10-20% open rate typical' },
            { name: 'Cart-page upsell widget (Bold, Rebuy)', effort: '30 min app install', impact: '+3-7% revenue typical' },
            { name: 'Post-purchase upsell (ReConvert)', effort: '30 min app install', impact: '+5-15% AOV typical on completed orders' },
            { name: 'Tidio AI chatbot', effort: '1-2 hours setup', impact: 'Reduces chat handling cost; minor sales lift typical' },
          ].map((c, i) => (
            <div key={i} className="flex items-baseline justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-900 font-medium">{c.name}</span>
              <div className="text-xs text-gray-600 flex gap-3">
                <span>Effort: <strong>{c.effort}</strong></span>
                <span>Impact: <strong>{c.impact}</strong></span>
              </div>
            </div>
          ))}
        </div>
        <TrustBadge source="Industry-standard refurb e-commerce playbooks" tier="inferred" caveat="Impact ranges are typical-case, not Phonebot-specific." />
      </div>
    </div>
  );
}
