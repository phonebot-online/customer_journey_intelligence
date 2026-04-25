import { useSearchParams } from 'react-router-dom';

const windows = [
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '12m', label: '12M' },
];

export default function TimeWindowSelector() {
  const [searchParams, setSearchParams] = useSearchParams();
  const current = searchParams.get('window') || '1m';

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {windows.map((w) => (
        <button
          key={w.value}
          onClick={() => {
            const next = new URLSearchParams(searchParams);
            next.set('window', w.value);
            setSearchParams(next);
          }}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            current === w.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
