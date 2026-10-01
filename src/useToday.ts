import { useEffect, useState } from 'react';

import { todayKey } from './game/neglect';

// A task becomes overdue at midnight even if the user hasn't clicked anything.
const TODAY_CHECK_MS = 60_000;

export function useToday(): string {
  const [today, setToday] = useState(() => todayKey(new Date()));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setToday(todayKey(new Date()));
    }, TODAY_CHECK_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return today;
}
