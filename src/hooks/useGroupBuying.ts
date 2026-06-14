import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_KEY  = 'cid_group_buying';
const OWNER_KEY = 'cid_uid';

export interface GroupPost {
  uid: string;
  ownerUid: string;
  name: string;
  category: string;
  contact: string;   // No WA
  ig: string;        // Instagram handle (tanpa @)
  note: string;
  date: string;
}

function genPostUID(): string {
  return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function buildWaHrefGB(contact: string): string | null {
  const digits = contact.replace(/\D/g, '');
  if (!digits || digits.length < 8) return null;
  let num = digits;
  if (num.startsWith('0')) num = '62' + num.slice(1);
  else if (!num.startsWith('62')) num = '62' + num;
  return `https://wa.me/${num}`;
}

export function useGroupBuying(concertId: string) {
  const key = `${BASE_KEY}_${concertId}`;
  const [posts, setPosts]     = useState<GroupPost[]>([]);
  const [ownerUid, setOwnerUid] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(OWNER_KEY).then(uid => {
      if (uid) { setOwnerUid(uid); return; }
      const newUid = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      AsyncStorage.setItem(OWNER_KEY, newUid);
      setOwnerUid(newUid);
    });
    AsyncStorage.getItem(key).then(v => {
      if (v) { try { setPosts(JSON.parse(v)); } catch {} }
    });
  }, [concertId]);

  const save = useCallback(async (next: GroupPost[]) => {
    setPosts(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }, [key]);

  const addPost = useCallback(async (
    name: string, category: string, contact: string, ig: string, note: string,
  ) => {
    if (!name.trim() || !contact.trim()) return false;
    const item: GroupPost = {
      uid:      genPostUID(),
      ownerUid,
      name:     name.trim().slice(0, 30),
      category: (category.trim() || 'Semua kategori').slice(0, 30),
      contact:  contact.trim().slice(0, 60),
      ig:       ig.replace('@', '').trim().slice(0, 40),
      note:     note.trim().slice(0, 150),
      date:     new Date().toISOString(),
    };
    await save([item, ...posts].slice(0, 30));
    return true;
  }, [posts, ownerUid, save]);

  const deletePost = useCallback(async (uid: string) => {
    await save(posts.filter(p => p.uid !== uid));
  }, [posts, save]);

  const updatePost = useCallback(async (uid: string, fields: Partial<GroupPost>) => {
    await save(posts.map(p => p.uid === uid ? { ...p, ...fields } : p));
  }, [posts, save]);

  return { posts, ownerUid, addPost, deletePost, updatePost };
}
