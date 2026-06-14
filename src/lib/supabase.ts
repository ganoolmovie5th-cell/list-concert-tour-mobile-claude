/* ================================================================
   ConcertID Mobile — Supabase Client
   Mirror dari supabase.js di web, disesuaikan untuk React Native
   ================================================================ */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPA_URL = 'https://crtqxgsruywurdlcsjfp.supabase.co';
const SUPA_KEY = 'sb_publishable_G9oVhoD74guR61dZ755SYw_QwcrRKmc';

const UID_KEY = 'cid_uid';

/* ── Device UID — persistent, untuk ownership check ────────── */
let _cachedUid: string | null = null;

export async function getDeviceUID(): Promise<string> {
  if (_cachedUid) return _cachedUid;
  let uid = await AsyncStorage.getItem(UID_KEY);
  if (!uid) {
    uid = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    await AsyncStorage.setItem(UID_KEY, uid);
  }
  _cachedUid = uid;
  return uid;
}

/* ── Supabase REST helper ───────────────────────────────────── */
const DB = {
  async _fetch(path: string, options: any = {}): Promise<any> {
    const url = `${SUPA_URL}/rest/v1/${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        apikey:          SUPA_KEY,
        Authorization:   `Bearer ${SUPA_KEY}`,
        'Content-Type':  'application/json',
        Prefer:          options._prefer || 'return=representation',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.details || `HTTP ${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  },

  select(table: string, query = ''): Promise<any[]> {
    return this._fetch(`${table}?${query}`);
  },

  insert(table: string, data: object): Promise<any[]> {
    return this._fetch(table, {
      method: 'POST',
      body:   JSON.stringify(data),
      _prefer: 'return=representation',
    });
  },

  update(table: string, filter: string, data: object): Promise<any[]> {
    return this._fetch(`${table}?${filter}`, {
      method:  'PATCH',
      body:    JSON.stringify(data),
      _prefer: 'return=representation',
    });
  },

  delete(table: string, filter: string): Promise<void> {
    return this._fetch(`${table}?${filter}`, {
      method:  'DELETE',
      _prefer: 'return=minimal',
    });
  },
};

/* ── Storage helper — CATATAN untuk mobile ──────────────────
   Di React Native, upload file lokal ke Supabase Storage TIDAK bisa
   pakai fetch() + blob karena local file:// URI tidak support blob.
   Gunakan FileSystem.uploadAsync dari expo-file-system (lihat useFanPhotos.ts)
   Fungsi upload() di sini hanya dipakai dari web/browser environment.
─────────────────────────────────────────────────────────── */
const Storage = {
  publicUrl(bucket: string, path: string): string {
    return `${SUPA_URL}/storage/v1/object/public/${bucket}/${path}`;
  },
};

export { DB, Storage, SUPA_URL, SUPA_KEY };
