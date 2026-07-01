/**
 * useSocialFeatures — Going / Interested
 * Supabase primary, AsyncStorage fallback
 * Mirror dari SocialFeatures di features.js web
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB, getDeviceUID } from '../lib/supabase';

type VoteType = 'going' | 'interested' | null;
interface SocialStore { going: number; interested: number; myVote: VoteType }

// AsyncStorage key (fallback) — single key, keyed by concertId
// ponytail: was 3 separate keys; consolidated to match useReviews/useDiscussion pattern
const LS_KEY = 'cid_social';

async function lsGet(concertId: string): Promise<SocialStore> {
  try {
    const all = JSON.parse((await AsyncStorage.getItem(LS_KEY)) || '{}');
    return all[concertId] ?? { going: 0, interested: 0, myVote: null };
  } catch { return { going: 0, interested: 0, myVote: null }; }
}
async function lsSave(concertId: string, d: SocialStore) {
  const all = JSON.parse((await AsyncStorage.getItem(LS_KEY)) || '{}');
  await AsyncStorage.setItem(LS_KEY, JSON.stringify({ ...all, [concertId]: d }));
}

/** Dummy hash-based seed untuk konser past — konsisten dari concert ID */
function pastSeed(concertId: string) {
  const seed = concertId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    going:      (seed % 900) + 100,
    interested: ((seed * 3) % 1500) + 300,
  };
}

/** Applies an optimistic vote toggle against AsyncStorage and returns the new state. */
async function fallbackVote(
  concertId: string,
  type: 'going' | 'interested',
): Promise<SocialStore> {
  const stored = await lsGet(concertId);
  const prev = stored.myVote;
  let { going, interested } = stored;

  if (prev === type) {
    if (type === 'going')      going      = Math.max(0, going - 1);
    if (type === 'interested') interested = Math.max(0, interested - 1);
    stored.myVote = null;
  } else {
    if (prev === 'going')      going      = Math.max(0, going - 1);
    if (prev === 'interested') interested = Math.max(0, interested - 1);
    if (type === 'going')      going++;
    if (type === 'interested') interested++;
    stored.myVote = type;
  }

  const next: SocialStore = { going, interested, myVote: stored.myVote };
  await lsSave(concertId, next);
  return next;
}

export function useSocialFeatures(concertId: string, isPastConcert = false) {
  const [data, setData] = useState<SocialStore>({ going: 0, interested: 0, myVote: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid = await getDeviceUID();

      if (isPastConcert) {
        // Past: tampilkan dummy seed dulu, lalu async fetch real count dari Supabase
        // Jika Supabase count > 0, pakai angka real. Kalau 0, tetap pakai dummy.
        // Mirror dari features.js web
        const seed = pastSeed(concertId);
        if (!cancelled) setData({ going: seed.going, interested: seed.interested, myVote: null });

        try {
          const rows       = await DB.select('concert_votes',
            `concert_id=eq.${encodeURIComponent(concertId)}&select=type`);
          const realGoing      = rows.filter((r: any) => r.type === 'going').length;
          const realInterested = rows.filter((r: any) => r.type === 'interested').length;
          const g = realGoing      > 0 ? realGoing      : seed.going;
          const i = realInterested > 0 ? realInterested : seed.interested;
          if (!cancelled) setData({ going: g, interested: i, myVote: null });
        } catch { /* tetap pakai dummy */ }
        return;
      }

      // Confirmed / Rumor: Supabase primary
      try {
        const rows = await DB.select('concert_votes',
          `concert_id=eq.${encodeURIComponent(concertId)}&select=type,device_uid`);
        const going      = rows.filter((r: any) => r.type === 'going').length;
        const interested = rows.filter((r: any) => r.type === 'interested').length;
        const myVote     = (rows.find((r: any) => r.device_uid === uid)?.type ?? null) as VoteType;
        if (!cancelled) setData({ going, interested, myVote });
      } catch {
        // fallback AsyncStorage
        const stored = await lsGet(concertId);
        if (!cancelled) setData(stored);
      }
    })();
    return () => { cancelled = true; };
  }, [concertId, isPastConcert]);

  const vote = useCallback(async (type: 'going' | 'interested'): Promise<VoteType> => {
    if (isPastConcert) return null;
    const uid = await getDeviceUID();

    try {
      const existing = await DB.select('concert_votes',
        `concert_id=eq.${encodeURIComponent(concertId)}&device_uid=eq.${uid}&type=eq.${type}`);

      if (existing.length > 0) {
        // Undo vote
        await DB.delete('concert_votes',
          `concert_id=eq.${encodeURIComponent(concertId)}&device_uid=eq.${uid}&type=eq.${type}`);
      } else {
        // Hapus vote lain dulu, lalu insert baru
        await DB.delete('concert_votes',
          `concert_id=eq.${encodeURIComponent(concertId)}&device_uid=eq.${uid}`);
        await DB.insert('concert_votes', { concert_id: concertId, device_uid: uid, type });
      }

      // Fetch fresh counts
      const rows       = await DB.select('concert_votes',
        `concert_id=eq.${encodeURIComponent(concertId)}&select=type,device_uid`);
      const going      = rows.filter((r: any) => r.type === 'going').length;
      const interested = rows.filter((r: any) => r.type === 'interested').length;
      const myVote     = (rows.find((r: any) => r.device_uid === uid)?.type ?? null) as VoteType;
      setData({ going, interested, myVote });
      return myVote;
    } catch {
      // fallback AsyncStorage
      const next = await fallbackVote(concertId, type);
      setData(next);
      return next.myVote;
    }
  }, [concertId, isPastConcert]);

  return { going: data.going, interested: data.interested, myVote: data.myVote, vote };
}
