import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface TrustBadgeProps {
  source: string;
  caveat?: string;
  imputed?: boolean;
  freshness?: string;
}

export default function TrustBadge({ source, caveat, imputed, freshness }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
      <CheckCircle className="w-3 h-3 text-green-500" />
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
          <Info className="w-3 h-3" />
          {caveat}
        </span>
      )}
    </div>
  );
}
