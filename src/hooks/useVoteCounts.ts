/**
 * useVoteCounts — Fetch semua going/interested counts dalam SATU DB call
 * Dipakai di VoteCountsContext agar ConcertCard bisa tampilkan going count
 * tanpa 44 individual request
 */
import { useState, useEffect, useCallback } from 'react';
import { DB } from '../lib/supabase';

export interface VoteCounts {
  [concertId: string]: { going: number; interested: number };
}

export function useVoteCounts() {
  const [counts, setCounts]     = useState<VoteCounts>({});
  const [loading, setLoading]   = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const rows = await DB.select('concert_votes', 'select=concert_id,type');
      const agg: VoteCounts = {};
      for (const r of rows) {
        if (!agg[r.concert_id]) agg[r.concert_id] = { going: 0, interested: 0 };
        if (r.type === 'going')      agg[r.concert_id].going++;
        if (r.type === 'interested') agg[r.concert_id].interested++;
      }
      setCounts(agg);
    } catch {
      // silently fail — counts stay empty / from cache
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Refresh setiap 5 menit
  useEffect(() => {
    const id = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const getCount = useCallback(
    (id: string) => counts[id] ?? { going: 0, interested: 0 },
    [counts],
  );

  return { counts, loading, fetchAll, getCount };
}
