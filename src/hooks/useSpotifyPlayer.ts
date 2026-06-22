/**
 * useSpotifyPlayer — Spotify OAuth (expo-web-browser) + playback control
 *
 * Alur OAuth:
 * 1. openAuthSessionAsync buka browser sheet
 * 2. User login Spotify → redirect ke list-concert-tour.web.id/spotify-callback?code=xxx
 * 3. expo-web-browser intercept URL tersebut SEBELUM halaman dimuat → return ke app
 * 4. App extract code → exchange ke access_token
 * Tidak perlu deep link / concertid:// scheme → works di Expo Go & production.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import {
  buildAuthUrl, exchangeCode, getValidToken,
  apiPlay, apiPause, apiResume, apiGetPlayback,
  clearSession, REDIRECT_URI, SpPlayback,
} from '../services/SpotifyService';

// Diperlukan untuk iOS agar auth session ditutup dengan benar
WebBrowser.maybeCompleteAuthSession();

export interface SpotifyPlayerState {
  isConnected : boolean;
  isPlaying   : boolean;
  progressMs  : number;
  connecting  : boolean;
  error       : string | null;
}

export function useSpotifyPlayer() {
  const [state, setState] = useState<SpotifyPlayerState>({
    isConnected: false, isPlaying: false,
    progressMs: 0, connecting: false, error: null,
  });

  const tokenRef = useRef<string | null>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted  = useRef(true);

  // ── Init: cek token tersimpan ─────────────────────────────────────
  useEffect(() => {
    mounted.current = true;
    (async () => {
      const token = await getValidToken();
      if (token && mounted.current) {
        tokenRef.current = token;
        setS({ isConnected: true });
      }
    })();
    // Warmup browser Android (opsional, mempercepat buka)
    WebBrowser.warmUpAsync().catch(() => {});
    return () => {
      mounted.current = false;
      stopPoll();
      WebBrowser.coolDownAsync().catch(() => {});
    };
  }, []);

  // ── Connect: buka browser sheet, intercept redirect ───────────────
  const connect = useCallback(async () => {
    setS({ connecting: true, error: null });
    try {
      const { url } = await buildAuthUrl();
      console.log('[Spotify] Opening auth session...');

      const result = await WebBrowser.openAuthSessionAsync(url, REDIRECT_URI);
      console.log('[Spotify] Auth result type:', result.type);

      if (result.type !== 'success') {
        setS({ connecting: false, error: result.type === 'cancel' ? 'Login dibatalkan.' : 'Gagal login Spotify.' });
        return;
      }

      // Extract code dari redirect URL
      // result.url = https://list-concert-tour.web.id/spotify-callback?code=xxx
      const raw  = (result as any).url as string;
      const code = raw.split('code=')[1]?.split('&')[0];

      if (!code) {
        setS({ connecting: false, error: 'Tidak ada code dari Spotify. Coba lagi.' });
        return;
      }

      console.log('[Spotify] Got code, exchanging...');
      const token = await exchangeCode(decodeURIComponent(code));

      if (!mounted.current) return;

      if (token) {
        tokenRef.current = token;
        setS({ isConnected: true, connecting: false, error: null });
        console.log('[Spotify] ✅ Connected!');
      } else {
        setS({ connecting: false, error: 'Token exchange gagal. Coba lagi.' });
      }
    } catch (e: any) {
      console.error('[Spotify] connect error:', e);
      setS({ connecting: false, error: `Error: ${e?.message || 'Unknown'}` });
    }
  }, []);

  const disconnect = useCallback(async () => {
    await clearSession();
    tokenRef.current = null;
    stopPoll();
    setState({ isConnected: false, isPlaying: false, progressMs: 0, connecting: false, error: null });
  }, []);

  // ── Playback ──────────────────────────────────────────────────────
  const playTrack = useCallback(async (spotifyId: string): Promise<boolean> => {
    const token = await ensureToken();
    if (!token) { setS({ error: 'Tidak terkoneksi ke Spotify.' }); return false; }
    const ok = await apiPlay(token, `spotify:track:${spotifyId}`);
    if (ok && mounted.current) { setS({ isPlaying: true, progressMs: 0, error: null }); startPoll(); }
    else if (mounted.current) setS({ error: 'Gagal play. Pastikan app Spotify aktif di device.' });
    return ok;
  }, []);

  const pause = useCallback(async (): Promise<boolean> => {
    const token = tokenRef.current;
    if (!token) return false;
    const ok = await apiPause(token);
    if (ok && mounted.current) { setS({ isPlaying: false }); stopPoll(); }
    return ok;
  }, []);

  const resume = useCallback(async (): Promise<boolean> => {
    const token = await ensureToken();
    if (!token) return false;
    const ok = await apiResume(token);
    if (ok && mounted.current) { setS({ isPlaying: true }); startPoll(); }
    return ok;
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────
  const ensureToken = async (): Promise<string | null> => {
    const t = tokenRef.current || await getValidToken();
    if (t) tokenRef.current = t;
    return t;
  };

  const startPoll = () => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      const token = tokenRef.current;
      if (!token || !mounted.current) return;
      const pb: SpPlayback | null = await apiGetPlayback(token);
      if (pb && mounted.current) setS({ isPlaying: pb.isPlaying, progressMs: pb.progressMs });
    }, 1000);
  };

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const setS = (partial: Partial<SpotifyPlayerState>) => {
    if (mounted.current) setState(s => ({ ...s, ...partial }));
  };

  return { ...state, connect, disconnect, playTrack, pause, resume };
}
