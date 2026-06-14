import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type VoteType = 'going' | 'interested' | null;

interface SocialData {
  going: number;
  interested: number;
  myVote: VoteType;
}

const KEY_GOING    = 'cid_going_v2';
const KEY_INTEREST = 'cid_interest_v2';
const KEY_MYVOTE   = 'cid_myvote_v2';

async function getCounts(key: string): Promise<Record<string, number>> {
  try { return JSON.parse((await AsyncStorage.getItem(key)) || '{}'); } catch { return {}; }
}
async function saveCounts(key: string, data: Record<string, number>) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}
async function getMyVotes(): Promise<Record<string, VoteType>> {
  try { return JSON.parse((await AsyncStorage.getItem(KEY_MYVOTE)) || '{}'); } catch { return {}; }
}

export function useSocialFeatures(concertId: string, isPastConcert = false) {
  const [data, setData] = useState<SocialData>({ going: 0, interested: 0, myVote: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const going    = await getCounts(KEY_GOING);
      const interest = await getCounts(KEY_INTEREST);
      const myVotes  = await getMyVotes();

      if (isPastConcert) {
        // Dummy disabled — angka acak kalau belum ada atau 0, persist kalau sudah > 0 (sama dengan web)
        const needsSeed = going[concertId] == null || going[concertId] === 0;
        if (needsSeed) {
          going[concertId]    = Math.floor(Math.random() * 900) + 100;
          interest[concertId] = Math.floor(Math.random() * 1500) + 300;
          await saveCounts(KEY_GOING, going);
          await saveCounts(KEY_INTEREST, interest);
        }
        if (!cancelled) setData({ going: going[concertId], interested: interest[concertId], myVote: null });
      } else {
        // Actual dari 0, bisa vote (confirmed & rumor)
        if (going[concertId] == null) going[concertId] = 0;
        if (interest[concertId] == null) interest[concertId] = 0;
        if (!cancelled) setData({ going: going[concertId], interested: interest[concertId], myVote: myVotes[concertId] || null });
      }
    })();
    return () => { cancelled = true; };
  }, [concertId, isPastConcert]);

  const vote = useCallback(async (type: 'going' | 'interested'): Promise<VoteType> => {
    if (isPastConcert) return null; // past tidak bisa vote

    const going    = await getCounts(KEY_GOING);
    const interest = await getCounts(KEY_INTEREST);
    const myVotes  = await getMyVotes();

    const prev = myVotes[concertId] || null;
    if (going[concertId] == null)    going[concertId]    = 0;
    if (interest[concertId] == null) interest[concertId] = 0;

    if (prev === type) {
      // Undo vote
      if (type === 'going')      going[concertId]    = Math.max(0, going[concertId] - 1);
      if (type === 'interested') interest[concertId] = Math.max(0, interest[concertId] - 1);
      delete myVotes[concertId];
    } else {
      // Undo prev jika ada
      if (prev === 'going')      going[concertId]    = Math.max(0, going[concertId] - 1);
      if (prev === 'interested') interest[concertId] = Math.max(0, interest[concertId] - 1);
      // Tambah baru
      if (type === 'going')      going[concertId]++;
      if (type === 'interested') interest[concertId]++;
      myVotes[concertId] = type;
    }

    await saveCounts(KEY_GOING, going);
    await saveCounts(KEY_INTEREST, interest);
    await AsyncStorage.setItem(KEY_MYVOTE, JSON.stringify(myVotes));

    const newVote = myVotes[concertId] || null;
    setData({ going: going[concertId], interested: interest[concertId], myVote: newVote });
    return newVote;
  }, [concertId, isPastConcert]);

  return { going: data.going, interested: data.interested, myVote: data.myVote, vote };
}
