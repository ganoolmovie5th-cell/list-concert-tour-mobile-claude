/**
 * useLiveSetlist.ts
 * Live Setlist crowdsource — penonton submit lagu yang sedang diputar
 * Supabase table: live_setlist
 *   id          uuid PK
 *   concert_id  text NOT NULL
 *   song_name   text NOT NULL
 *   song_number integer DEFAULT 1
 *   submitted_by text NOT NULL
 *   created_at  timestamptz DEFAULT now()
 *
 * SQL (jalankan sekali di Supabase dashboard):
 *   CREATE TABLE IF NOT EXISTS live_setlist (
 *     id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     concert_id   text NOT NULL,
 *     song_name    text NOT NULL,
 *     song_number  integer DEFAULT 1,
 *     submitted_by text NOT NULL DEFAULT 'Anonim',
 *     created_at   timestamptz DEFAULT now()
 *   );
 *   CREATE INDEX IF NOT EXISTS idx_live_setlist_concert ON live_setlist(concert_id, created_at DESC);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DB, getDeviceUID } from '../lib/supabase';

export interface LiveEntry {
  id: string;
  concert_id: string;
  song_name: string;
  song_number: number;
  submitted_by: string;
  created_at: string;
  is_own?: boolean;
}

interface UseLiveSetlistReturn {
  entries: LiveEntry[];
  loading: boolean;
  submitting: boolean;
  myUid: string;
  submit: (songName: string, songNumber: number, name: string) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  refresh: () => void;
}

const POLL_MS = 10_000; // refresh setiap 10 detik

export function useLiveSetlist(concertId: string): UseLiveSetlistReturn {
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myUid, setMyUid] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load device UID once
  useEffect(() => {
    getDeviceUID().then(uid => { if (mountedRef.current) setMyUid(uid); });
  }, []);

  const fetchEntries = useCallback(async (isFirst = false) => {
    if (isFirst) setLoading(true);
    try {
      const uid = myUid || (await getDeviceUID());
      const rows = await DB.select(
        'live_setlist',
        `concert_id=eq.${encodeURIComponent(concertId)}&order=created_at.desc&limit=50`,
      );
      if (!mountedRef.current) return;
      setEntries(
        rows.map((r: any) => ({
          id: r.id,
          concert_id: r.concert_id,
          song_name: r.song_name,
          song_number: r.song_number ?? 1,
          submitted_by: r.submitted_by || 'Anonim',
          created_at: r.created_at,
          is_own: r.submitted_by === uid,
        })),
      );
    } catch {
      // silent — tetap tampilkan data lama jika ada
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [concertId, myUid]);

  // Initial fetch + polling
  useEffect(() => {
    if (!concertId) return;
    fetchEntries(true);
    timerRef.current = setInterval(() => fetchEntries(), POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [concertId, fetchEntries]);

  const submit = useCallback(async (
    songName: string,
    songNumber: number,
    name: string,
  ): Promise<boolean> => {
    const trimmed = songName.trim();
    if (!trimmed) return false;
    setSubmitting(true);
    try {
      const uid = myUid || (await getDeviceUID());
      await DB.insert('live_setlist', {
        concert_id:   concertId,
        song_name:    trimmed,
        song_number:  songNumber || 1,
        submitted_by: name.trim() || uid,
      });
      await fetchEntries();
      return true;
    } catch {
      return false;
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }, [concertId, myUid, fetchEntries]);

  const remove = useCallback(async (id: string) => {
    try {
      await DB.delete('live_setlist', `id=eq.${id}`);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch {}
  }, []);

  const refresh = useCallback(() => fetchEntries(), [fetchEntries]);

  return { entries, loading, submitting, myUid, submit, remove, refresh };
}
