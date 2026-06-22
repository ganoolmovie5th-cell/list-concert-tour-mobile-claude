/**
 * SpotifyService.ts — Spotify OAuth (PKCE + implicit fallback) + Web API
 * Client ID : bc23ee30bdb948b483cd1af6ba321cd1
 * Redirect  : concertid://spotify-auth
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Constants ─────────────────────────────────────────────────────
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
const K_FLOW     = 'sp_auth_flow'; // 'pkce' | 'implicit'

// ── PKCE helpers ──────────────────────────────────────────────────
function genVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const arr   = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function genChallenge(verifier: string): Promise<string> {
  const data   = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64url(digest);
}

function hasPKCE(): boolean {
  try { return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'; }
  catch { return false; }
}

// ── Build auth URL (PKCE or implicit) ─────────────────────────────
export async function buildAuthUrl(): Promise<string> {
  const base = 'https://accounts.spotify.com/authorize';

  if (hasPKCE()) {
    const verifier   = genVerifier();
    const challenge  = await genChallenge(verifier);
    await AsyncStorage.setItem(K_VERIFIER, verifier);
    await AsyncStorage.setItem(K_FLOW, 'pkce');
    const p = new URLSearchParams({
      response_type: 'code', client_id: CLIENT_ID,
      scope: SCOPES, redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256', code_challenge: challenge,
    });
    return `${base}?${p.toString()}`;
  }

  // Fallback: implicit grant
  await AsyncStorage.setItem(K_FLOW, 'implicit');
  const p = new URLSearchParams({
    response_type: 'token', client_id: CLIENT_ID,
    scope: SCOPES, redirect_uri: REDIRECT_URI,
  });
  return `${base}?${p.toString()}`;
}

// ── Token exchange (PKCE only) ────────────────────────────────────
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

// ── Save implicit token ───────────────────────────────────────────
export async function saveImplicitToken(token: string, expiresIn: number): Promise<void> {
  await AsyncStorage.setItem(K_TOKEN,  token);
  await AsyncStorage.setItem(K_EXPIRY, String(Date.now() + expiresIn * 1000));
}

async function saveTokens(data: any): Promise<void> {
  await AsyncStorage.setItem(K_TOKEN,  data.access_token);
  await AsyncStorage.setItem(K_EXPIRY, String(Date.now() + data.expires_in * 1000));
  if (data.refresh_token) await AsyncStorage.setItem(K_REFRESH, data.refresh_token);
}

// ── Refresh token ─────────────────────────────────────────────────
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

// ── Get valid token (auto refresh) ───────────────────────────────
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
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
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
  isPlaying: boolean;
  progressMs: number;
  trackUri: string | null;
}

export async function apiGetPlayback(token: string): Promise<SpPlayback | null> {
  try {
    const r = await apiFetch(token, '/me/player');
    if (r.status === 204 || r.status === 404) return null;
    const d = await r.json();
    return { isPlaying: d.is_playing ?? false, progressMs: d.progress_ms ?? 0, trackUri: d.item?.uri ?? null };
  } catch { return null; }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([K_TOKEN, K_REFRESH, K_EXPIRY, K_VERIFIER, K_FLOW]);
}

export async function getAuthFlow(): Promise<string | null> {
  return AsyncStorage.getItem(K_FLOW);
}
