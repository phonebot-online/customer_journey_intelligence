interface HHIGaugeProps {
  hhi: number | null;
  label: string | null;
}

const ZONES = [
  { min: 0, max: 1500, label: 'Diversified', color: 'bg-green-500' },
  { min: 1500, max: 2500, label: 'Moderate', color: 'bg-blue-500' },
  { min: 2500, max: 5000, label: 'Concentrated', color: 'bg-amber-500' },
  { min: 5000, max: 10000, label: 'Highly concentrated', color: 'bg-red-500' },
];

export default function HHIGauge({ hhi, label }: HHIGaugeProps) {
  if (hhi === null) {
    return (
      <div className="text-sm text-gray-500 italic">
        HHI unavailable for this window — channel-level PM data only on 1m.
      </div>
    );
  }

  const clamped = Math.min(Math.max(hhi, 0), 10000);
  const positionPct = (clamped / 10000) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{Math.round(hhi).toLocaleString()}</p>
          <p className="text-sm text-gray-500">Herfindahl-Hirschman Index — channel concentration</p>
        </div>
        {label && (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
            {label}
          </span>
        )}
      </div>

      {/* Horizontal gauge */}
      <div className="relative h-8 rounded-full bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 flex">
          {ZONES.map((z, i) => (
            <div
              key={i}
              className={`${z.color} opacity-25`}
              style={{ width: `${((z.max - z.min) / 10000) * 100}%` }}
            />
          ))}
        </div>
        {/* Marker */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-gray-900"
          style={{ left: `calc(${positionPct}% - 2px)` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        {ZONES.map((z) => (
          <span key={z.label}>{z.label}</span>
        ))}
      </div>
    </div>
  );
}
