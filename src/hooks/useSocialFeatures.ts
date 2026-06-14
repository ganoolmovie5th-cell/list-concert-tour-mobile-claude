/**
 * useSocialFeatures — Going / Interested
 * Supabase primary, AsyncStorage fallback
 * Mirror dari SocialFeatures di features.js web
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB, getDeviceUID } from '../lib/supabase';

type VoteType = 'going' | 'interested' | null;
interface SocialData { going: number; interested: number; myVote: VoteType }

// localStorage keys (fallback) — sama dengan web
const KEY_GOING    = 'cid_going_v2';
const KEY_INTEREST = 'cid_interest_v2';
const KEY_MYVOTE   = 'cid_myvote_v2';

async function lsGetCounts(key: string): Promise<Record<string, number>> {
  try { return JSON.parse((await AsyncStorage.getItem(key)) || '{}'); } catch { return {}; }
}
async function lsSaveCounts(key: string, d: Record<string, number>) {
  await AsyncStorage.setItem(key, JSON.stringify(d));
}
async function lsGetMyVotes(): Promise<Record<string, VoteType>> {
  try { return JSON.parse((await AsyncStorage.getItem(KEY_MYVOTE)) || '{}'); } catch { return {}; }
}

/** Dummy hash-based seed untuk konser past — konsisten dari concert ID */
function pastSeed(concertId: string) {
  const seed = concertId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    going:      (seed % 900) + 100,
    interested: ((seed * 3) % 1500) + 300,
  };
}

export function useSocialFeatures(concertId: string, isPastConcert = false) {
  const [data, setData] = useState<SocialData>({ going: 0, interested: 0, myVote: null });

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
        const g  = await lsGetCounts(KEY_GOING);
        const i  = await lsGetCounts(KEY_INTEREST);
        const mv = await lsGetMyVotes();
        if (!cancelled) setData({
          going:      g[concertId]  ?? 0,
          interested: i[concertId]  ?? 0,
          myVote:     mv[concertId] ?? null,
        });
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
      const g  = await lsGetCounts(KEY_GOING);
      const i  = await lsGetCounts(KEY_INTEREST);
      const mv = await lsGetMyVotes();
      const prev = mv[concertId] || null;

      if (g[concertId]  == null) g[concertId]  = 0;
      if (i[concertId] == null) i[concertId] = 0;

      if (prev === type) {
        if (type === 'going')      g[concertId]  = Math.max(0, g[concertId]  - 1);
        if (type === 'interested') i[concertId] = Math.max(0, i[concertId] - 1);
        delete mv[concertId];
      } else {
        if (prev === 'going')      g[concertId]  = Math.max(0, g[concertId]  - 1);
        if (prev === 'interested') i[concertId] = Math.max(0, i[concertId] - 1);
        if (type === 'going')      g[concertId]++;
        if (type === 'interested') i[concertId]++;
        mv[concertId] = type;
      }

      await lsSaveCounts(KEY_GOING, g);
      await lsSaveCounts(KEY_INTEREST, i);
      await AsyncStorage.setItem(KEY_MYVOTE, JSON.stringify(mv));

      const newVote = mv[concertId] || null;
      setData({ going: g[concertId], interested: i[concertId], myVote: newVote });
      return newVote;
    }
  }, [concertId, isPastConcert]);

  return { going: data.going, interested: data.interested, myVote: data.myVote, vote };
}
