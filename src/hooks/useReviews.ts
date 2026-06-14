/**
 * useReviews — Review & Rating
 * Supabase primary, AsyncStorage fallback
 * Mirror dari reviews.js web
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB, getDeviceUID } from '../lib/supabase';
import { Review } from '../types';

const LS_KEY = 'cid_reviews';

function lsKey(id: string) { return `${LS_KEY}_${id}`; }

async function lsGet(concertId: string): Promise<Review[]> {
  try { return JSON.parse((await AsyncStorage.getItem(lsKey(concertId))) || '[]'); } catch { return []; }
}
async function lsSave(concertId: string, list: Review[]) {
  await AsyncStorage.setItem(lsKey(concertId), JSON.stringify(list));
}

export function useReviews(concertId: string) {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid   = await getDeviceUID();
      const local = await lsGet(concertId);
      if (!cancelled && local.length) setReviews(local);

      try {
        const rows = await DB.select('reviews',
          `concert_id=eq.${encodeURIComponent(concertId)}&order=created_at.desc`);
        const list: Review[] = rows.map((r: any) => ({
          uid:     String(r.id),
          author:  r.author,
          rating:  r.rating,
          comment: r.comment,
          date:    r.created_at,
          likes:   r.likes,
        }));
        const already = rows.some((r: any) => r.device_uid === uid);
        if (!cancelled) {
          setReviews(list);
          setHasReviewed(already);
          await lsSave(concertId, list);
        }
      } catch {
        // cek fallback
        const already = local.some(r => r.uid === uid);
        if (!cancelled) setHasReviewed(already);
      }
    })();
    return () => { cancelled = true; };
  }, [concertId]);

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const addReview = useCallback(async (author: string, rating: number, comment: string) => {
    if (hasReviewed) return;
    if (comment.trim().length < 10) return;
    const uid  = await getDeviceUID();
    const name = (author || 'Anonim').trim().slice(0, 30);
    const text = comment.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 500);

    try {
      // Cek duplikat
      const existing = await DB.select('reviews',
        `concert_id=eq.${encodeURIComponent(concertId)}&device_uid=eq.${uid}`);
      if (existing.length > 0) { setHasReviewed(true); return; }

      const rows = await DB.insert('reviews', {
        concert_id: concertId,
        device_uid: uid,
        author:     name,
        rating:     parseInt(String(rating)),
        comment:    text,
      });
      const review: Review = {
        uid:     String(rows[0]?.id ?? Date.now()),
        author:  name,
        rating,
        comment: text,
        date:    rows[0]?.created_at ?? new Date().toISOString(),
        likes:   0,
      };
      const next = [review, ...reviews];
      setReviews(next);
      setHasReviewed(true);
      await lsSave(concertId, next);
    } catch {
      // fallback
      const review: Review = {
        uid, author: name, rating, comment: text,
        date: new Date().toISOString(), likes: 0,
      };
      const next = [review, ...reviews];
      setReviews(next);
      setHasReviewed(true);
      await lsSave(concertId, next);
    }
  }, [reviews, hasReviewed, concertId]);

  const likeReview = useCallback(async (idx: number) => {
    const r = reviews[idx];
    if (!r) return;
    const next = [...reviews];
    next[idx] = { ...r, likes: r.likes + 1 };
    setReviews(next);
    await lsSave(concertId, next);

    if (r.uid && !isNaN(Number(r.uid))) {
      try { await DB.update('reviews', `id=eq.${r.uid}`, { likes: r.likes + 1 }); } catch {}
    }
  }, [reviews, concertId]);

  return { reviews, hasReviewed, avgRating, addReview, likeReview };
}
