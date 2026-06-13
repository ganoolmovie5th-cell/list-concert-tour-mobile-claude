import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type VoteType = 'going' | 'interested' | null;

interface SocialData {
  going: number;
  interested: number;
  myVote: VoteType;
}

// Seed dummy untuk konser past — angka acak yang persist per concertId
function pastSeed(concertId: string): { going: number; interested: number } {
  // Hash sederhana dari concertId agar angka konsisten setiap load
  let h = 0;
  for (let i = 0; i < concertId.length; i++) h = (h * 31 + concertId.charCodeAt(i)) & 0xffffffff;
  const going    = 100 + (Math.abs(h) % 900);      // 100 – 999
  const interested = 300 + (Math.abs(h * 7) % 1500); // 300 – 1799
  return { going, interested };
}

export function useSocialFeatures(concertId: string, isPastConcert = false) {
  const KEY = `cid_social_${concertId}`;
  const [data, setData] = useState<SocialData>({ going: 0, interested: 0, myVote: null });

  useEffect(() => {
    if (isPastConcert) {
      // Konser past: pakai dummy seed yang persist, tidak bisa di-vote
      AsyncStorage.getItem(KEY).then(v => {
        if (v) {
          try { setData(JSON.parse(v)); return; } catch {}
        }
        const seed = { ...pastSeed(concertId), myVote: null };
        setData(seed);
        AsyncStorage.setItem(KEY, JSON.stringify(seed));
      });
    } else {
      // Konser confirmed upcoming atau rumor: mulai dari 0, actual
      AsyncStorage.getItem(KEY).then(v => {
        if (v) {
          try { setData(JSON.parse(v)); } catch {}
        }
        // Kalau belum ada, biarkan default { going: 0, interested: 0, myVote: null }
      });
    }
  }, [concertId, isPastConcert]);

  const vote = useCallback(async (type: 'going' | 'interested') => {
    if (isPastConcert) return null; // Past tidak bisa vote
    const next = { ...data };
    if (next.myVote === type) {
      if (type === 'going') next.going = Math.max(0, next.going - 1);
      else next.interested = Math.max(0, next.interested - 1);
      next.myVote = null;
    } else {
      if (next.myVote === 'going') next.going = Math.max(0, next.going - 1);
      if (next.myVote === 'interested') next.interested = Math.max(0, next.interested - 1);
      if (type === 'going') next.going += 1;
      else next.interested += 1;
      next.myVote = type;
    }
    setData(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next.myVote;
  }, [data, KEY, isPastConcert]);

  return { going: data.going, interested: data.interested, myVote: data.myVote, vote };
}
