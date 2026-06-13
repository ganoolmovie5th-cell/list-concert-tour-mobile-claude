import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type VoteType = 'going' | 'interested' | null;

interface SocialData {
  going: number;
  interested: number;
  myVote: VoteType;
}

export function useSocialFeatures(concertId: string) {
  const KEY = `cid_social_${concertId}`;
  const [data, setData] = useState<SocialData>({ going: 0, interested: 0, myVote: null });

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v) {
        try { setData(JSON.parse(v)); } catch {}
      } else {
        const seed = { going: 0, interested: 0, myVote: null };
        setData(seed);
        AsyncStorage.setItem(KEY, JSON.stringify(seed));
      }
    });
  }, [concertId]);

  const vote = useCallback(async (type: 'going' | 'interested') => {
    const next = { ...data };
    if (next.myVote === type) {
      // cancel
      if (type === 'going') next.going = Math.max(0, next.going - 1);
      else next.interested = Math.max(0, next.interested - 1);
      next.myVote = null;
    } else {
      // switch or new vote
      if (next.myVote === 'going') next.going = Math.max(0, next.going - 1);
      if (next.myVote === 'interested') next.interested = Math.max(0, next.interested - 1);
      if (type === 'going') next.going += 1;
      else next.interested += 1;
      next.myVote = type;
    }
    setData(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next.myVote;
  }, [data, KEY]);

  return { going: data.going, interested: data.interested, myVote: data.myVote, vote };
}
