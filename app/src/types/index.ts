export type TimeWindow = '1m' | '3m' | '6m' | '12m';

export function formatCurrency(value: number | bigint): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatNumber(value: number | bigint): string {
  return new Intl.NumberFormat('en-AU').format(Number(value));
}

export function formatPercent(value: number | bigint): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(value));
}
