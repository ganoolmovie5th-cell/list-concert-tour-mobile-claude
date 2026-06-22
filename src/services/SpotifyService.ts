/**
 * SpotifyService.ts — Spotify OAuth PKCE + Web API
 * Pure-JS SHA256 → tidak butuh crypto.subtle (selalu PKCE, no implicit fallback)
 * Implicit grant deprecated oleh Spotify sejak 2023.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLIENT_ID    = 'bc23ee30bdb948b483cd1af6ba321cd1';
export const REDIRECT_URI = 'concertid://spotify-auth';
export const SCOPES       = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

const K_TOKEN    = 'sp_access_token';
const K_REFRESH  = 'sp_refresh_token';
const K_EXPIRY   = 'sp_token_expiry';
const K_VERIFIER = 'sp_code_verifier';

// ── Pure-JS SHA-256 (no crypto.subtle needed) ─────────────────────
const SHA256_K = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
];

function rr(v: number, n: number) { return (v >>> n) | (v << (32 - n)); }

function sha256Bytes(msg: string): number[] {
  // UTF-8 encode
  const b: number[] = [];
  for (let i = 0; i < msg.length; i++) {
    const c = msg.charCodeAt(i);
    if (c < 0x80)        b.push(c);
    else if (c < 0x800)  b.push((c >> 6) | 0xc0, (c & 0x3f) | 0x80);
    else                 b.push((c >> 12) | 0xe0, ((c >> 6) & 0x3f) | 0x80, (c & 0x3f) | 0x80);
  }
  const len = b.length;
  b.push(0x80);
  while (b.length % 64 !== 56) b.push(0);
  const bits = len * 8;
  b.push(0,0,0,0,(bits>>>24)&0xff,(bits>>>16)&0xff,(bits>>>8)&0xff,bits&0xff);


  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a;
  let h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;

  for (let off = 0; off < b.length; off += 64) {
    const w: number[] = [];
    for (let i = 0; i < 16; i++)
      w[i] = (b[off+i*4]<<24)|(b[off+i*4+1]<<16)|(b[off+i*4+2]<<8)|b[off+i*4+3];
    for (let i = 16; i < 64; i++) {
      const s0 = rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3);
      const s1 = rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);
      w[i] = (w[i-16]+s0+w[i-7]+s1)|0;
    }
    let a=h0,b2=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rr(e,6)^rr(e,11)^rr(e,25)) + ((e&f)^(~e&g)) + SHA256_K[i] + w[i])|0;
      const t2 = ((rr(a,2)^rr(a,13)^rr(a,22)) + ((a&b2)^(a&c)^(b2&c)))|0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b2; b2=a; a=(t1+t2)|0;
    }
    h0=(h0+a)|0; h1=(h1+b2)|0; h2=(h2+c)|0; h3=(h3+d)|0;
    h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
  }
  const out: number[] = [];
  [h0,h1,h2,h3,h4,h5,h6,h7].forEach(x => {
    out.push((x>>>24)&0xff,(x>>>16)&0xff,(x>>>8)&0xff,x&0xff);
  });
  return out;
}

function base64url(bytes: number[]): string {
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

// ── PKCE ─────────────────────────────────────────────────────────
function genVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr   = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}

function genChallenge(verifier: string): string {
  return base64url(sha256Bytes(verifier));
}


// ── Auth URL (always PKCE) ────────────────────────────────────────
export async function buildAuthUrl(): Promise<string> {
  const verifier  = genVerifier();
  const challenge = genChallenge(verifier);
  await AsyncStorage.setItem(K_VERIFIER, verifier);
  const p = new URLSearchParams({
    response_type: 'code', client_id: CLIENT_ID,
    scope: SCOPES, redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256', code_challenge: challenge,
  });
  return `https://accounts.spotify.com/authorize?${p.toString()}`;
}

// ── Token exchange ────────────────────────────────────────────────
export async function exchangeCode(code: string): Promise<string | null> {
  const verifier = await AsyncStorage.getItem(K_VERIFIER);
  if (!verifier) return null;
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code', code,
      redirect_uri: REDIRECT_URI, client_id: CLIENT_ID,
      code_verifier: verifier,
    });
    const res  = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json();
    if (!data.access_token) return null;
    await saveTokens(data);
    await AsyncStorage.removeItem(K_VERIFIER);
    return data.access_token;
  } catch { return null; }
}

async function saveTokens(data: any): Promise<void> {
  await AsyncStorage.setItem(K_TOKEN,  data.access_token);
  await AsyncStorage.setItem(K_EXPIRY, String(Date.now() + data.expires_in * 1000));
  if (data.refresh_token) await AsyncStorage.setItem(K_REFRESH, data.refresh_token);
}

// ── Refresh & get valid token ─────────────────────────────────────
export async function refreshToken(): Promise<string | null> {
  const refresh = await AsyncStorage.getItem(K_REFRESH);
  if (!refresh) return null;
  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: refresh, client_id: CLIENT_ID,
    });
    const res  = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json();
    if (!data.access_token) return null;
    await saveTokens(data);
    return data.access_token;
  } catch { return null; }
}

export async function getValidToken(): Promise<string | null> {
  const token  = await AsyncStorage.getItem(K_TOKEN);
  const expiry = await AsyncStorage.getItem(K_EXPIRY);
  if (!token || !expiry) return null;
  if (Date.now() > parseInt(expiry) - 60_000) return refreshToken();
  return token;
}


// ── Playback API ──────────────────────────────────────────────────
async function apiFetch(token: string, path: string, opts: RequestInit = {}): Promise<Response> {
  return fetch(`https://api.spotify.com/v1${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers||{}) },
  });
}

export async function apiPlay(token: string, spotifyUri: string): Promise<boolean> {
  try {
    const r = await apiFetch(token, '/me/player/play', {
      method: 'PUT', body: JSON.stringify({ uris: [spotifyUri] }),
    });
    return r.status === 204 || r.status === 200 || r.status === 202;
  } catch { return false; }
}

export async function apiPause(token: string): Promise<boolean> {
  try {
    const r = await apiFetch(token, '/me/player/pause', { method: 'PUT' });
    return r.status === 204 || r.status === 200;
  } catch { return false; }
}

export async function apiResume(token: string): Promise<boolean> {
  try {
    const r = await apiFetch(token, '/me/player/play', { method: 'PUT' });
    return r.status === 204 || r.status === 200;
  } catch { return false; }
}

export interface SpPlayback {
  isPlaying: boolean; progressMs: number; trackUri: string | null;
}

export async function apiGetPlayback(token: string): Promise<SpPlayback | null> {
  try {
    const r = await apiFetch(token, '/me/player');
    if (r.status === 204 || r.status === 404) return null;
    const d = await r.json();
    return { isPlaying: d.is_playing??false, progressMs: d.progress_ms??0, trackUri: d.item?.uri??null };
  } catch { return null; }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([K_TOKEN, K_REFRESH, K_EXPIRY, K_VERIFIER]);
}


  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a;
  let h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
  for (let off = 0; off < b.length; off += 64) {
    const w: number[] = [];
    for (let i = 0; i < 16; i++)
      w[i] = (b[off+i*4]<<24)|(b[off+i*4+1]<<16)|(b[off+i*4+2]<<8)|b[off+i*4+3];
    for (let i = 16; i < 64; i++) {
      const s0 = rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3);
      const s1 = rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);
      w[i] = (w[i-16]+s0+w[i-7]+s1)|0;
    }
    let a=h0,bb=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for (let i = 0; i < 64; i++) {
      const t1 = (h+(rr(e,6)^rr(e,11)^rr(e,25))+((e&f)^(~e&g))+SHA256_K[i]+w[i])|0;
      const t2 = ((rr(a,2)^rr(a,13)^rr(a,22))+((a&bb)^(a&c)^(bb&c)))|0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=bb; bb=a; a=(t1+t2)|0;
    }
    h0=(h0+a)|0; h1=(h1+bb)|0; h2=(h2+c)|0; h3=(h3+d)|0;
    h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
  }
  const out: number[] = [];
  [h0,h1,h2,h3,h4,h5,h6,h7].forEach(x =>
    out.push((x>>>24)&0xff,(x>>>16)&0xff,(x>>>8)&0xff,x&0xff)
  );
  return out;
}

function base64url(bytes: number[]): string {
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

// ── PKCE helpers ──────────────────────────────────────────────────
function genVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr   = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}
function genChallenge(verifier: string): string { return base64url(sha256Bytes(verifier)); }

// ── Auth URL (always PKCE, no implicit fallback) ──────────────────
export async function buildAuthUrl(): Promise<string> {
  const verifier  = genVerifier();
  const challenge = genChallenge(verifier);
  await AsyncStorage.setItem(K_VERIFIER, verifier);
  const p = new URLSearchParams({
    response_type: 'code', client_id: CLIENT_ID,
    scope: SCOPES, redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256', code_challenge: challenge,
  });
  return `https://accounts.spotify.com/authorize?${p.toString()}`;
}

// ── Token exchange ────────────────────────────────────────────────
export async function exchangeCode(code: string): Promise<string | null> {
  const verifier = await AsyncStorage.getItem(K_VERIFIER);
  if (!verifier) return null;
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code', code,
      redirect_uri: REDIRECT_URI, client_id: CLIENT_ID,
      code_verifier: verifier,
    });
    const res  = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json();
    if (!data.access_token) return null;
    await saveTokens(data);
    await AsyncStorage.removeItem(K_VERIFIER);
    return data.access_token;
  } catch { return null; }
}

async function saveTokens(data: any): Promise<void> {
  await AsyncStorage.setItem(K_TOKEN,  data.access_token);
  await AsyncStorage.setItem(K_EXPIRY, String(Date.now() + data.expires_in * 1000));
  if (data.refresh_token) await AsyncStorage.setItem(K_REFRESH, data.refresh_token);
}


// ── Refresh & get valid token ─────────────────────────────────────
export async function refreshToken(): Promise<string | null> {
  const refresh = await AsyncStorage.getItem(K_REFRESH);
  if (!refresh) return null;
  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: refresh, client_id: CLIENT_ID,
    });
    const res  = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json();
    if (!data.access_token) return null;
    await saveTokens(data);
    return data.access_token;
  } catch { return null; }
}

export async function getValidToken(): Promise<string | null> {
  const token  = await AsyncStorage.getItem(K_TOKEN);
  const expiry = await AsyncStorage.getItem(K_EXPIRY);
  if (!token || !expiry) return null;
  if (Date.now() > parseInt(expiry) - 60_000) return refreshToken();
  return token;
}

// ── Playback API ──────────────────────────────────────────────────
async function apiFetch(token: string, path: string, opts: RequestInit = {}): Promise<Response> {
  return fetch(`https://api.spotify.com/v1${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers||{}) },
  });
}

export async function apiPlay(token: string, spotifyUri: string): Promise<boolean> {
  try {
    const r = await apiFetch(token, '/me/player/play', {
      method: 'PUT', body: JSON.stringify({ uris: [spotifyUri] }),
    });
    return r.status === 204 || r.status === 200 || r.status === 202;
  } catch { return false; }
}

export async function apiPause(token: string): Promise<boolean> {
  try {
    const r = await apiFetch(token, '/me/player/pause', { method: 'PUT' });
    return r.status === 204 || r.status === 200;
  } catch { return false; }
}

export async function apiResume(token: string): Promise<boolean> {
  try {
    const r = await apiFetch(token, '/me/player/play', { method: 'PUT' });
    return r.status === 204 || r.status === 200;
  } catch { return false; }
}

export interface SpPlayback {
  isPlaying: boolean; progressMs: number; trackUri: string | null;
}

export async function apiGetPlayback(token: string): Promise<SpPlayback | null> {
  try {
    const r = await apiFetch(token, '/me/player');
    if (r.status === 204 || r.status === 404) return null;
    const d = await r.json();
    return { isPlaying: d.is_playing??false, progressMs: d.progress_ms??0, trackUri: d.item?.uri??null };
  } catch { return null; }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([K_TOKEN, K_REFRESH, K_EXPIRY, K_VERIFIER]);
}
