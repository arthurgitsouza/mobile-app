import { useEffect, useState } from 'react';
import { nowISO } from '../utils/date.js';

// Re-renderiza periodicamente para manter textos relativos ("há 3 h") e prazos atualizados.
export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(nowISO());
  useEffect(() => {
    const t = setInterval(() => setNow(nowISO()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
