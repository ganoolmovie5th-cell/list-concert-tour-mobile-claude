/**
 * useDiscussion — Diskusi / Komentar
 * Supabase primary, AsyncStorage fallback
 * Mirror dari Discussion di features.js web
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB, getDeviceUID } from '../lib/supabase';
import { Comment } from '../types';

const LS_KEY = 'cid_discussions';

function lsKey(id: string) { return `${LS_KEY}_${id}`; }

async function lsGet(concertId: string): Promise<Comment[]> {
  try { return JSON.parse((await AsyncStorage.getItem(lsKey(concertId))) || '[]'); } catch { return []; }
}
async function lsSave(concertId: string, list: Comment[]) {
  await AsyncStorage.setItem(lsKey(concertId), JSON.stringify(list));
}

export function useDiscussion(concertId: string) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Show local first
      const local = await lsGet(concertId);
      if (!cancelled && local.length) setComments(local);

      // Fetch from Supabase
      try {
        const rows = await DB.select('discussions',
          `concert_id=eq.${encodeURIComponent(concertId)}&order=created_at.desc&limit=100`);
        const list: Comment[] = rows.map((r: any) => ({
          uid:     String(r.id),
          author:  r.author,
          text:    r.text,
          date:    r.created_at,
          likes:   r.likes,
          replyTo: r.reply_to ?? null,
        }));
        if (!cancelled) {
          setComments(list);
          await lsSave(concertId, list);
        }
      } catch { /* pakai local */ }
    })();
    return () => { cancelled = true; };
  }, [concertId]);

  const addComment = useCallback(async (
    author: string,
    text: string,
    replyTo: { author: string; text: string } | null = null,
  ) => {
    if (!text.trim() || text.trim().length < 3) return;
    const uid  = await getDeviceUID();
    const clean = text.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 300);
    const name  = (author || 'Anonim').trim().slice(0, 30);

    try {
      const rows = await DB.insert('discussions', {
        concert_id: concertId,
        device_uid: uid,
        author:     name,
        text:       clean,
        reply_to:   replyTo ?? null,
      });
      const inserted: Comment = {
        uid:     String(rows[0]?.id ?? Date.now()),
        author:  name,
        text:    clean,
        date:    rows[0]?.created_at ?? new Date().toISOString(),
        likes:   0,
        replyTo: replyTo ?? null,
      };
      const next = [inserted, ...comments];
      setComments(next);
      await lsSave(concertId, next);
    } catch {
      // fallback
      const comment: Comment = {
        uid:     Date.now().toString(),
        author:  name,
        text:    clean,
        date:    new Date().toISOString(),
        likes:   0,
        replyTo: replyTo ?? null,
      };
      const next = [comment, ...comments];
      setComments(next);
      await lsSave(concertId, next);
    }
  }, [comments, concertId]);

  const likeComment = useCallback(async (idx: number) => {
    const c = comments[idx];
    if (!c) return;
    const next = [...comments];
    next[idx] = { ...c, likes: c.likes + 1 };
    setComments(next);
    await lsSave(concertId, next);

    // Update Supabase jika id numerik
    if (c.uid && !c.uid.startsWith('u_') && !isNaN(Number(c.uid))) {
      try { await DB.update('discussions', `id=eq.${c.uid}`, { likes: c.likes + 1 }); } catch {}
    }
  }, [comments, concertId]);

  return { comments, addComment, likeComment };
}
