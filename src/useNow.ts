import { useEffect, useState } from 'react';

// Re-check once a minute so a district can go quiet while the app stays open.
const NOW_CHECK_MS = 60_000;

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, NOW_CHECK_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return now;
}
