import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_KEY = 'cid_group_buying';

export interface GroupPost {
  uid: string;
  name: string;
  note: string;
  date: string;
}

export function useGroupBuying(concertId: string) {
  const key = `${BASE_KEY}_${concertId}`;
  const [posts, setPosts] = useState<GroupPost[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(key).then(v => {
      if (v) { try { setPosts(JSON.parse(v)); } catch {} }
    });
  }, [concertId]);

  const addPost = useCallback(async (name: string, note: string) => {
    if (!name.trim()) return false;
    const item: GroupPost = {
      uid: Date.now().toString(),
      name: name.trim().slice(0, 30),
      note: note.trim().slice(0, 150),
      date: new Date().toISOString(),
    };
    const next = [item, ...posts].slice(0, 50);
    setPosts(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    return true;
  }, [posts, key]);

  return { posts, addPost };
}
