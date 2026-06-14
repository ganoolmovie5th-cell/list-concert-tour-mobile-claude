import { useState, useEffect } from 'react';

interface CountdownValue {
  d: number;
  h: number;
  m: number;
  s: number;
}

export function useCountdown(rawDate: Date): CountdownValue | null {
  const calc = (): CountdownValue | null => {
    const diff = rawDate.getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };

  const [value, setValue] = useState<CountdownValue | null>(calc);

  useEffect(() => {
    const id = setInterval(() => setValue(calc()), 1000);
    return () => clearInterval(id);
  }, [rawDate]);

  return value;
}
