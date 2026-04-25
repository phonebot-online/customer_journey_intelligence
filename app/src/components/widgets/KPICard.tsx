import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../../types';

interface KPICardProps {
  title: string;
  value: number | bigint;
  format?: 'currency' | 'number' | 'percent';
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
}

export default function KPICard({ title, value, format = 'number', subtitle, trend, trendLabel }: KPICardProps) {
  const numValue = typeof value === 'bigint' ? Number(value) : value;
  const formatted = format === 'currency' ? formatCurrency(numValue) : format === 'percent' ? formatPercent(numValue) : formatNumber(numValue);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{formatted}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
      {trend !== undefined && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend > 0 ? '+' : ''}{formatPercent(trend)}
          {trendLabel && <span className="text-gray-400 ml-1">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
