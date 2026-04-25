// Saturating-curve fits for paid channels, derived from the locked multi-window triangulation
// (cross_checks/step7_LOCKED_multiwindow_triangulation.md).
//
// Each channel has a per-dollar GP curve of the form:  gpPerDollar(spend_per_day) = a - b * ln(spend_per_day)
// Fitted from the four (spend, efficiency) data points across 1m/3m/6m/12m windows.
//
// All forecasts are INFERRED, not causal. Show as ranges, not points.

export type ChannelKey = 'aw' | 'fb' | 'bing';

export interface ChannelCurve {
  key: ChannelKey;
  label: string;
  curve: (dailySpend: number) => number; // returns GP/$ at that daily spend level
  minSpend: number; // below which the curve is unreliable (no data)
  maxSpend: number; // above which the curve is unreliable (extrapolation)
  dataPoints: { spend: number; efficiency: number }[]; // for transparency
}

// AW fit from multi-window: 1m=A$637/2.49×, 3m=A$926/1.81×, 6m=A$1242/1.37×, 12m=A$1299/1.27×
// log-linear regression on the 4 data points: gpPerDollar ≈ 13.37 - 1.69 * ln(spend)
// At A$597/day → 2.46× (matches locked 2.49× within rounding)
const awCurve: ChannelCurve = {
  key: 'aw',
  label: 'Google Ads',
  curve: (s) => Math.max(0, 13.37 - 1.69 * Math.log(Math.max(s, 1))),
  minSpend: 80,
  maxSpend: 2500,
  dataPoints: [
    { spend: 637, efficiency: 2.49 },
    { spend: 926, efficiency: 1.81 },
    { spend: 1242, efficiency: 1.37 },
    { spend: 1299, efficiency: 1.27 },
  ],
};

// FB observed flat at 0.08-0.10× across all windows. No saturation visible because efficiency never improves.
// Treat as constant. The HOLDOUT TEST is what actually validates this curve.
const fbCurve: ChannelCurve = {
  key: 'fb',
  label: 'Facebook + IG',
  curve: () => 0.09,
  minSpend: 0,
  maxSpend: 1500,
  dataPoints: [
    { spend: 243, efficiency: 0.08 },
    { spend: 260, efficiency: 0.08 },
    { spend: 317, efficiency: 0.10 },
    { spend: 399, efficiency: 0.09 },
  ],
};

// Bing campaign-level mix at current ~A$57/day shows weighted 3.67× (Shopping 2.59× + Refurbished 3.18× + Brand 13.76×).
// Extrapolating saturation at A$200/day → ~2.5× via log-linear: gpPerDollar ≈ 7.43 - 0.93 * ln(spend).
// Limited data — wider uncertainty than AW.
const bingCurve: ChannelCurve = {
  key: 'bing',
  label: 'Bing Ads',
  curve: (s) => Math.max(0, 7.43 - 0.93 * Math.log(Math.max(s, 1))),
  minSpend: 10,
  maxSpend: 600,
  dataPoints: [
    { spend: 57, efficiency: 3.67 },
    { spend: 200, efficiency: 2.5 },  // extrapolated
  ],
};

export const CHANNEL_CURVES: Record<ChannelKey, ChannelCurve> = {
  aw: awCurve,
  fb: fbCurve,
  bing: bingCurve,
};

// Non-paid GP contribution per day = Organic + Direct + Referral PM-GP from locked Step 7 (1m).
// Step 7: Organic+Direct+Referral = 19% of GP. Current ~A$108k/mo total PM-GP × 19% = ~A$20.5k/mo = A$685/day.
// Treated as fixed floor here. In reality scales with upper-funnel investment — risk panel covers this.
// Excludes the 35% Unassigned bucket which is server-side / cross-touch and partly downstream of paid.
export const NON_PAID_DAILY_GP = 685;

export interface ScenarioInput {
  aw: number;   // daily spend in AUD
  fb: number;
  bing: number;
}

export interface ScenarioForecast {
  daily: {
    spend: number;
    paidGP: number;
    nonPaidGP: number;
    totalGP: number;
    net: number;
  };
  monthly: {
    spend: number;
    paidGP: number;
    nonPaidGP: number;
    totalGP: number;
    net: number;
    netLow: number; // -30% on inferred efficiency
    netHigh: number; // +30%
  };
  perChannel: { key: ChannelKey; label: string; spend: number; gp: number; efficiency: number; net: number; warning: string | null }[];
  warnings: string[];
}

export function forecastScenario(input: ScenarioInput): ScenarioForecast {
  const warnings: string[] = [];
  const perChannel = (Object.entries(input) as [ChannelKey, number][]).map(([key, dailySpend]) => {
    const curveDef = CHANNEL_CURVES[key];
    let warning: string | null = null;
    if (dailySpend > curveDef.maxSpend) warning = `Above max observed spend (A$${curveDef.maxSpend}/day). Forecast is extrapolation.`;
    if (dailySpend > 0 && dailySpend < curveDef.minSpend) warning = `Below min observed spend (A$${curveDef.minSpend}/day). Curve unreliable.`;
    if (warning) warnings.push(`${curveDef.label}: ${warning}`);
    const efficiency = dailySpend > 0 ? curveDef.curve(dailySpend) : 0;
    const gp = dailySpend * efficiency;
    return {
      key,
      label: curveDef.label,
      spend: dailySpend,
      gp,
      efficiency,
      net: gp - dailySpend,
      warning,
    };
  });

  const totalDailyPaidGP = perChannel.reduce((s, c) => s + c.gp, 0);
  const totalDailySpend = perChannel.reduce((s, c) => s + c.spend, 0);
  const totalDailyGP = totalDailyPaidGP + NON_PAID_DAILY_GP;
  const dailyNet = totalDailyGP - totalDailySpend;

  return {
    daily: {
      spend: totalDailySpend,
      paidGP: totalDailyPaidGP,
      nonPaidGP: NON_PAID_DAILY_GP,
      totalGP: totalDailyGP,
      net: dailyNet,
    },
    monthly: {
      spend: totalDailySpend * 30,
      paidGP: totalDailyPaidGP * 30,
      nonPaidGP: NON_PAID_DAILY_GP * 30,
      totalGP: totalDailyGP * 30,
      net: dailyNet * 30,
      netLow: ((totalDailyPaidGP * 0.7) + NON_PAID_DAILY_GP - totalDailySpend) * 30,
      netHigh: ((totalDailyPaidGP * 1.3) + NON_PAID_DAILY_GP - totalDailySpend) * 30,
    },
    perChannel,
    warnings,
  };
}

// Three preset planning modes — mapped to specific spend allocations.
export type PlanningMode = 'cheap' | 'sweet' | 'aggressive';

export const PLANNING_PRESETS: Record<PlanningMode, ScenarioInput & { rationale: string; risks: string[]; actions: string[] }> = {
  cheap: {
    aw: 80,   // brand campaigns only
    fb: 0,
    bing: 5,  // brand only
    rationale: 'Concentrated brand-harvest only. Stop demand-creation; live off existing brand awareness.',
    risks: [
      'Branded search demand will continue to decay (-32 to -44% already observed since FB/AW cuts).',
      '12-month horizon: brand harvest may erode by 30-50% as upstream demand creators are starved.',
      'Inventory of premium SKUs (MacBook, AirPods) cannot be liquidated profitably without paid push.',
    ],
    actions: [
      'Pause: All FB campaigns, all PMax non-brand, all Bing non-brand.',
      'Keep: AW Brand + Bing Brand + Phonebot Standard Shopping only.',
      'Monitor: Branded search clicks (early-warning of demand decay).',
    ],
  },
  sweet: {
    aw: 597,   // current after AW reallocation applied
    fb: 117,   // FB after Cold paused (per holdout protocol)
    bing: 115, // Bing scaled per Step 9
    rationale: 'Three-platform core with pruned marginal spend, gated on FB holdout result.',
    risks: [
      'FB holdout outcome unknown — could drop 0-15% of CMS orders if Cold was upper-funnel.',
      'Saturating-curve assumptions on Bing scale-up are inferred, not split-tested.',
      'AW reallocation assumes campaign mix shift toward higher-efficiency lines holds at slightly higher spend.',
    ],
    actions: [
      'Apply AW reallocation table (Phase 1+2+3 from Phase-1 brief).',
      'After 7 days stable: launch FB Cold holdout per Step 10 protocol.',
      'After 14d holdout: lock FB decision, then evaluate Bing further scaling.',
    ],
  },
  aggressive: {
    aw: 1300,  // restored toward Sep 2025 peak
    fb: 300,   // assumes pixel + utm fix landed first
    bing: 250, // pushed toward saturation
    rationale: 'Restore Sep 2025 volume trajectory. Requires FB tracking fix, inventory restoration, and acceptance of saturating-returns drag.',
    risks: [
      'AW efficiency at A$1300/day was 1.27× historically — marginal returns near zero.',
      'FB at A$300/day with broken tracking is gambling; pixel/utm fix is a prerequisite.',
      'Inventory constraints (MacBook -A$18k/mo, AirPods/Xiaomi/Huawei -A$10k/mo) cap revenue ceiling regardless of paid push.',
      'Operational complexity (5+ active channels) requires more analyst time per week.',
    ],
    actions: [
      'PREREQUISITE: Fix FB pixel + utm tagging (currently 62% of purchase events have fbclid bug).',
      'PREREQUISITE: Restore MacBook + AirPods inventory pipelines.',
      'Then: scale AW to A$1000-1300/day in increments, watch real GP/$ stay above 1.2×.',
      'Then: rebuild FB cold prospecting with proper measurement; re-test incrementality at 14d intervals.',
    ],
  },
};
