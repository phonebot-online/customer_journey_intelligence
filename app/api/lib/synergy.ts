// Pure statistical functions for cross-channel synergy analysis.
// All inputs are aligned numeric arrays. NaN/null values must be filtered out by the caller.

export function pearsonR(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx, b = y[i] - my;
    num += a * b;
    dx2 += a * a;
    dy2 += b * b;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom > 0 ? num / denom : 0;
}

// Cross-correlation: lag k means seriesA(t-k) vs seriesB(t).
// Positive lag = A leads B. Negative lag = A lags B.
export function crossCorrelation(
  seriesA: number[],
  seriesB: number[],
  maxLag: number = 7
): { lag: number; r: number }[] {
  const out: { lag: number; r: number }[] = [];
  for (let lag = 0; lag <= maxLag; lag++) {
    if (lag === 0) {
      out.push({ lag: 0, r: pearsonR(seriesA, seriesB) });
    } else {
      const aShifted = seriesA.slice(0, seriesA.length - lag);
      const bShifted = seriesB.slice(lag);
      out.push({ lag, r: pearsonR(aShifted, bShifted) });
    }
  }
  return out;
}

// Best lag in 0..maxLag — the lag that maximises |r|. Returns the magnitude r and its lag.
export function bestLag(seriesA: number[], seriesB: number[], maxLag: number = 7): { lag: number; r: number } {
  const all = crossCorrelation(seriesA, seriesB, maxLag);
  return all.reduce((best, cur) => Math.abs(cur.r) > Math.abs(best.r) ? cur : best, all[0]);
}

// Herfindahl-Hirschman Index on an array of fractional shares (each in [0,1]).
// Result is sum(share^2 * 10000) → range 0..10000. <1500 = diversified, 1500-2500 = moderate, >2500 = concentrated.
export function herfindahl(shares: number[]): number {
  return shares.reduce((s, v) => s + v * v, 0) * 10000;
}

export function concentrationLabel(hhi: number): 'diversified' | 'moderate' | 'concentrated' | 'highly concentrated' {
  if (hhi < 1500) return 'diversified';
  if (hhi < 2500) return 'moderate';
  if (hhi < 5000) return 'concentrated';
  return 'highly concentrated';
}

// Concurrency lift: compare daily efficiency of channel A on days when channel B was active vs paused.
// Returns lift = (A_efficiency_when_B_active / A_efficiency_when_B_paused) - 1. Positive = synergy signal.
// Returns null if either group has fewer than 3 days.
export function concurrencyLift(
  channelADaily: { date: string; efficiency: number }[],
  channelBActiveDays: Set<string>
): { lift: number | null; nActive: number; nPaused: number; activeMean: number; pausedMean: number } {
  const active = channelADaily.filter(d => channelBActiveDays.has(d.date) && Number.isFinite(d.efficiency));
  const paused = channelADaily.filter(d => !channelBActiveDays.has(d.date) && Number.isFinite(d.efficiency));
  if (active.length < 3 || paused.length < 3) {
    return {
      lift: null,
      nActive: active.length,
      nPaused: paused.length,
      activeMean: active.length ? active.reduce((s, d) => s + d.efficiency, 0) / active.length : 0,
      pausedMean: paused.length ? paused.reduce((s, d) => s + d.efficiency, 0) / paused.length : 0,
    };
  }
  const activeMean = active.reduce((s, d) => s + d.efficiency, 0) / active.length;
  const pausedMean = paused.reduce((s, d) => s + d.efficiency, 0) / paused.length;
  return {
    lift: pausedMean > 0 ? (activeMean / pausedMean) - 1 : null,
    nActive: active.length,
    nPaused: paused.length,
    activeMean,
    pausedMean,
  };
}

// Tier classification for a synergy correlation.
// Decides whether a Pearson r is strong enough at the given sample size to call a synergy "inferred" vs "uncertain".
export function correlationTier(r: number, n: number): 'inferred' | 'estimated' | 'uncertain' {
  const absR = Math.abs(r);
  // Rough significance proxy: t = r * sqrt(n-2) / sqrt(1-r^2). Two-sided alpha=0.05 cutoff.
  // Skip formal stats; use heuristics that match common-sense thresholds.
  if (n < 7) return 'uncertain';
  if (absR >= 0.5 && n >= 14) return 'inferred';
  if (absR >= 0.3) return 'estimated';
  return 'uncertain';
}
