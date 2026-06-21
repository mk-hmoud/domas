import { useEffect, useRef, useState } from 'react';
import { conversations } from '@domas/api-client';

const POLL_INTERVAL_MS = 30_000;

export function useUnreadMessagesCount(enabled: boolean): number {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    let cancelled = false;

    const fetch = async () => {
      try {
        const result = await conversations.findAll({ status: 'open' });
        if (!cancelled) setCount(result.filter((c) => c.unreadByAdmin).length);
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
  }, [enabled]);

  return count;
}
