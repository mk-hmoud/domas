import { useEffect, useRef, useState } from 'react';
import { stats } from '@domas/api-client';
import { DashboardStats } from '@domas/ts-types';

const POLL_INTERVAL_MS = 60_000;

export function useNavStats(): DashboardStats {
  const [data, setData] = useState<DashboardStats>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      try {
        const result = await stats.getDashboard();
        if (!cancelled) setData(result);
      } catch {
        // silently ignore — counters are informational
      }
    };

    fetch();
    intervalRef.current = setInterval(fetch, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return data;
}
