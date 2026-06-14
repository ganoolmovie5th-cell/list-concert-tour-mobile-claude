/**
 * useFanPhotos — Foto dari Fans
 * Supabase Storage primary, AsyncStorage fallback
 * Mirror dari UGC di features.js web
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB, Storage, getDeviceUID, SUPA_URL } from '../lib/supabase';

const LS_KEY = 'cid_fan_photos';

function lsKey(id: string) { return `${LS_KEY}_${id}`; }

export interface FanPhoto {
  uid: string;
  uri: string;         // URL publik Supabase atau local URI
  caption: string;
  author: string;
  date: string;
}

async function lsGet(concertId: string): Promise<FanPhoto[]> {
  try { return JSON.parse((await AsyncStorage.getItem(lsKey(concertId))) || '[]'); } catch { return []; }
}
async function lsSave(concertId: string, list: FanPhoto[]) {
  await AsyncStorage.setItem(lsKey(concertId), JSON.stringify(list));
}

export function useFanPhotos(concertId: string) {
  const [photos, setPhotos] = useState<FanPhoto[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = await lsGet(concertId);
      if (!cancelled && local.length) setPhotos(local);

      try {
        const rows = await DB.select('fan_photos',
          `concert_id=eq.${encodeURIComponent(concertId)}&order=created_at.desc`);
        const list: FanPhoto[] = rows.map((r: any) => ({
          uid:     String(r.id),
          uri:     r.public_url,
          caption: r.caption || '',
          author:  r.author || 'Anonymous',
          date:    r.created_at,
        }));
        if (!cancelled) { setPhotos(list); await lsSave(concertId, list); }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [concertId]);

  const addPhoto = useCallback(async (uri: string, caption: string, author: string) => {
    const uid   = await getDeviceUID();
    const name  = (author.trim() || 'Anonymous').slice(0, 30);
    const cap   = caption.trim().slice(0, 100);
    const ts    = Date.now();

    let publicUrl = uri; // fallback: pakai local URI

    // Upload ke Supabase Storage
    try {
      const path     = `${concertId}/${uid}_${ts}.jpg`;
      const response = await fetch(uri);
      const blob     = await response.blob();
      publicUrl      = await Storage.upload('fan-photos', path, blob);

      // Simpan ke tabel fan_photos
      const rows = await DB.insert('fan_photos', {
        concert_id:   concertId,
        device_uid:   uid,
        storage_path: path,
        public_url:   publicUrl,
        caption:      cap,
        author:       name,
      });

      const item: FanPhoto = {
        uid:     String(rows[0]?.id ?? ts),
        uri:     publicUrl,
        caption: cap,
        author:  name,
        date:    rows[0]?.created_at ?? new Date().toISOString(),
      };
      const next = [item, ...photos].slice(0, 30);
      setPhotos(next);
      await lsSave(concertId, next);
    } catch {
      // fallback: simpan local URI saja
      const item: FanPhoto = {
        uid:     String(ts),
        uri,
        caption: cap,
        author:  name,
        date:    new Date().toISOString(),
      };
      const next = [item, ...photos].slice(0, 30);
      setPhotos(next);
      await lsSave(concertId, next);
    }

    return true;
  }, [photos, concertId]);

  return { photos, addPhoto };
}
