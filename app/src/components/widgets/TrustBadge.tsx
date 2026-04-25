import { Info, AlertTriangle, CheckCircle, Sparkles, HelpCircle, AlertOctagon } from 'lucide-react';

export type TrustTier = 'confirmed' | 'reconciled' | 'inferred' | 'estimated' | 'uncertain';

interface TrustBadgeProps {
  source: string;
  caveat?: string;
  imputed?: boolean;
  freshness?: string;
  tier?: TrustTier;
}

const TIER_CONFIG: Record<TrustTier, { icon: typeof CheckCircle; color: string; bg: string; label: string; description: string }> = {
  confirmed: {
    icon: CheckCircle,
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    label: 'confirmed',
    description: 'Direct from raw source — no transformation beyond parsing',
  },
  reconciled: {
    icon: Sparkles,
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    label: 'reconciled',
    description: 'Cross-checked across multiple sources within tolerance',
  },
  inferred: {
    icon: Info,
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    label: 'inferred',
    description: 'Modeled with stated assumptions — observational, not causal',
  },
  estimated: {
    icon: AlertTriangle,
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    label: 'estimated',
    description: 'Range estimate with uncertainty band — do not act on point value',
  },
  uncertain: {
    icon: AlertOctagon,
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    label: 'uncertain',
    description: 'Directional only — needs validation before action',
  },
};

export default function TrustBadge({ source, caveat, imputed, freshness, tier = 'confirmed' }: TrustBadgeProps) {
  const cfg = TIER_CONFIG[tier];
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border ${cfg.bg} ${cfg.color}`}
        title={cfg.description}
      >
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
      <span>Source: {source}</span>
      {freshness && <span>· {freshness}</span>}
      {imputed && (
        <span className="flex items-center gap-1 text-amber-600">
          <AlertTriangle className="w-3 h-3" />
          Imputed data present
        </span>
      )}
      {caveat && (
        <span className="flex items-center gap-1 text-amber-600" title={caveat}>
          <HelpCircle className="w-3 h-3" />
          {caveat}
        </span>
      )}
    </div>
  );
}
