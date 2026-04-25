import { useState, useCallback } from 'react';

export type TimeWindow = '1m' | '3m' | '6m' | '12m';

export function useTimeWindow(defaultWindow: TimeWindow = '1m') {
  const [window, setWindow] = useState<TimeWindow>(defaultWindow);

  const getWindowLabel = useCallback((w: TimeWindow) => {
    switch (w) {
      case '1m': return 'Last 30 days';
      case '3m': return 'Last 90 days';
      case '6m': return 'Last 180 days';
      case '12m': return 'Last 365 days';
    }
  }, []);

  return { window, setWindow, label: getWindowLabel(window) };
}
