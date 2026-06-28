/**
 * useGroupBuying — Cari Teman Nonton
 * Supabase primary, AsyncStorage fallback
 * Mirror dari GroupBuying di features3.js web
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB, getDeviceUID } from '../lib/supabase';

const LS_KEY = 'cid_group_buying';

function lsKey(id: string) { return `${LS_KEY}_${id}`; }
function genPostUID() { return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }

export interface GroupPost {
  uid: string;
  ownerUid: string;
  name: string;
  category: string;
  contact: string;
  ig: string;
  note: string;
  date: string;
}

async function lsGet(concertId: string): Promise<GroupPost[]> {
  try { return JSON.parse((await AsyncStorage.getItem(lsKey(concertId))) || '[]'); } catch { return []; }
}
async function lsSave(concertId: string, list: GroupPost[]) {
  await AsyncStorage.setItem(lsKey(concertId), JSON.stringify(list));
}

function mapRow(r: any): GroupPost {
  return {
    uid:      r.post_uid,
    ownerUid: r.owner_uid,
    name:     r.name     || 'Anonim',
    category: r.category || 'Semua kategori',
    contact:  r.contact  || '',
    ig:       r.ig       || '',
    note:     r.note     || '',
    date:     r.created_at,
  };
}

export function useGroupBuying(concertId: string) {
  const [posts, setPosts]       = useState<GroupPost[]>([]);
  const [ownerUid, setOwnerUid] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid = await getDeviceUID();
      if (!cancelled) setOwnerUid(uid);

      const local = await lsGet(concertId);
      if (!cancelled && local.length) setPosts(local);

      try {
        const rows = await DB.select('group_buying',
          `concert_id=eq.${encodeURIComponent(concertId)}&order=created_at.desc`);
        const list = rows.map(mapRow);
        if (!cancelled) { setPosts(list); await lsSave(concertId, list); }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [concertId]);

  const addPost = useCallback(async (
    name: string, category: string, contact: string, ig: string, note: string,
  ) => {
    if (!name.trim() || !contact.trim()) return false;
    const uid     = await getDeviceUID();
    const postUid = genPostUID();
    const item: GroupPost = {
      uid: postUid, ownerUid: uid,
      name:     name.trim().slice(0, 30),
      category: (category.trim() || 'Semua kategori').slice(0, 30),
      contact:  contact.trim().slice(0, 60),
      ig:       ig.replace('@', '').trim().slice(0, 40),
      note:     note.trim().slice(0, 150),
      date:     new Date().toISOString(),
    };

    try {
      await DB.insert('group_buying', {
        concert_id: concertId,
        post_uid:   postUid,
        owner_uid:  uid,
        name: item.name, category: item.category,
        contact: item.contact, ig: item.ig, note: item.note,
      });
    } catch {}

    const next = [item, ...posts].slice(0, 30);
    setPosts(next);
    await lsSave(concertId, next);
    return true;
  }, [posts, concertId]);

  const deletePost = useCallback(async (uid: string) => {
    const next = posts.filter(p => p.uid !== uid);
    setPosts(next);
    await lsSave(concertId, next);
    try { await DB.delete('group_buying', `post_uid=eq.${uid}`); } catch {}
  }, [posts, concertId]);

  const updatePost = useCallback(async (uid: string, fields: Partial<GroupPost>) => {
    const next = posts.map(p => p.uid === uid ? { ...p, ...fields } : p);
    setPosts(next);
    await lsSave(concertId, next);
    const mapped: any = {};
    if (fields.name)     mapped.name     = fields.name;
    if (fields.category) mapped.category = fields.category;
    if (fields.contact)  mapped.contact  = fields.contact;
    if ('ig'   in fields) mapped.ig   = fields.ig;
    if ('note' in fields) mapped.note = fields.note;
    try { await DB.update('group_buying', `post_uid=eq.${uid}`, mapped); } catch {}
  }, [posts, concertId]);

  return { posts, ownerUid, addPost, deletePost, updatePost };
}
