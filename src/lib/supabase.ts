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

/* ── Storage helper (untuk foto fans) ──────────────────────── */
const Storage = {
  async upload(bucket: string, path: string, blob: Blob): Promise<string> {
    const url = `${SUPA_URL}/storage/v1/object/${bucket}/${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey':         SUPA_KEY,
        'Authorization':  `Bearer ${SUPA_KEY}`,
        'Content-Type':   blob.type || 'image/jpeg',
        'Cache-Control':  'max-age=3600',
      },
      body: blob,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Upload gagal (${res.status}): ${errText}`);
    }
    return `${SUPA_URL}/storage/v1/object/public/${bucket}/${path}`;
  },

  publicUrl(bucket: string, path: string): string {
    return `${SUPA_URL}/storage/v1/object/public/${bucket}/${path}`;
  },
};

export { DB, Storage, SUPA_URL };
