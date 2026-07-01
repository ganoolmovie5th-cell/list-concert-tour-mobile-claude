/**
 * useFanPhotos — Foto dari Fans
 * Supabase Storage primary, AsyncStorage fallback
 *
 * FIX: React Native tidak bisa fetch() local file:// URI untuk dapat Blob.
 * Solusi: pakai FileSystem.uploadAsync (multipart) ke Supabase Storage endpoint.
 * Fallback: simpan local URI jika upload gagal.
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { DB, getDeviceUID, SUPA_URL, SUPA_KEY } from '../lib/supabase';

const LS_KEY = 'cid_fan_photos';
const BUCKET = 'fan-photos';

function lsKey(id: string) { return `${LS_KEY}_${id}`; }

export interface FanPhoto {
  uid:     string;
  uri:     string;
  caption: string;
  author:  string;
  date:    string;
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
      // Tampilkan local cache dulu
      const local = await lsGet(concertId);
      if (!cancelled && local.length) setPhotos(local);

      // Fetch dari Supabase
      try {
        const rows = await DB.select('fan_photos',
          `concert_id=eq.${encodeURIComponent(concertId)}&order=created_at.desc&limit=20`);
        const list: FanPhoto[] = rows.map((r: any) => ({
          uid:     String(r.id),
          uri:     r.public_url,
          caption: r.caption || '',
          author:  r.author  || 'Anonymous',
          date:    r.created_at,
        }));
        if (!cancelled) { setPhotos(list); await lsSave(concertId, list); }
      } catch (err) {
        console.warn('[useFanPhotos] fetch error:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [concertId]);

  const addPhoto = useCallback(async (
    uri: string, caption: string, author: string,
  ): Promise<boolean> => {
    const uid  = await getDeviceUID();
    const name = (author.trim() || 'Anonymous').slice(0, 30);
    const cap  = caption.trim().slice(0, 100);
    const ts   = Date.now();

    // Compress dulu ke max 1200px quality 0.8
    let compressedUri = uri;
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      compressedUri = result.uri;
    } catch (err) {
      console.warn('[useFanPhotos] compress error (pakai original):', err);
    }

    const storagePath = `${concertId}/${uid}_${ts}.jpg`;
    const uploadUrl   = `${SUPA_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
    const publicUrl   = `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;

    try {
      // ── Upload ke Supabase Storage via FileSystem.uploadAsync ──
      // Ini cara yang benar di React Native / Expo untuk upload file lokal
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, compressedUri, {
        httpMethod:  'POST',
        uploadType:  FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'apikey':        SUPA_KEY,
          'Authorization': `Bearer ${SUPA_KEY}`,
          'Content-Type':  'image/jpeg',
          'Cache-Control': 'max-age=3600',
        },
      });

      if (uploadResult.status !== 200 && uploadResult.status !== 201) {
        console.warn('[useFanPhotos] storage upload failed:', uploadResult.status, uploadResult.body);
        throw new Error(`Storage upload gagal: ${uploadResult.status}`);
      }

      // ── Insert row ke tabel fan_photos ──
      const rows = await DB.insert('fan_photos', {
        concert_id:   concertId,
        device_uid:   uid,
        storage_path: storagePath,
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
      return true;

    } catch (err) {
      console.warn('[useFanPhotos] upload/insert error (fallback local):', err);
      // Fallback: simpan local URI — foto tetap tampil di device ini
      const item: FanPhoto = {
        uid:     String(ts),
        uri:     compressedUri,
        caption: cap,
        author:  name,
        date:    new Date().toISOString(),
      };
      const next = [item, ...photos].slice(0, 30);
      setPhotos(next);
      await lsSave(concertId, next);
      return false; // return false = sukses local tapi gagal Supabase
    }
  }, [photos, concertId]);

  return { photos, addPhoto };
}
