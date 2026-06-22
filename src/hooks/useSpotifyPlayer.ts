/**
 * useSpotifyPlayer — Spotify OAuth connect + playback control
 * Handles PKCE code redirect AND implicit token redirect.
 * Polls /me/player every 1s while playing to sync progressMs.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Linking } from 'react-native';
import {
  buildAuthUrl, exchangeCode,
  getValidToken, apiPlay, apiPause, apiResume,
  apiGetPlayback, clearSession, SpPlayback,
} from '../services/SpotifyService';

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

  const tokenRef  = useRef<string | null>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted   = useRef(true);

  // ── Init: check existing token + listen for redirect ─────────────
  useEffect(() => {
    mounted.current = true;
    checkToken();
    const sub = Linking.addEventListener('url', ({ url }) => handleRedirect(url));
    Linking.getInitialURL().then(url => { if (url) handleRedirect(url); });
    return () => {
      mounted.current = false;
      sub.remove();
      stopPoll();
    };
  }, []);

  const checkToken = async () => {
    const token = await getValidToken();
    if (token && mounted.current) {
      tokenRef.current = token;
      setS({ isConnected: true });
    }
  };

  // ── Parse redirect URI (PKCE only: ?code=xxx) ────────────────────
  const handleRedirect = useCallback(async (url: string) => {
    if (!url.startsWith('concertid://spotify-auth')) return;
    const code = url.split('code=')[1]?.split('&')[0];
    if (!code) { setS({ connecting: false, error: 'Login dibatalkan.' }); return; }
    setS({ connecting: true, error: null });
    const token = await exchangeCode(code);
    if (!mounted.current) return;
    if (token) { tokenRef.current = token; setS({ isConnected: true, connecting: false, error: null }); }
    else setS({ connecting: false, error: 'Token exchange gagal. Coba lagi.' });
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setS({ connecting: true, error: null });
    try {
      const { url, redirectUri } = await buildAuthUrl();
      console.log('[Spotify] Auth URL:', url.slice(0, 80) + '...');
      console.log('[Spotify] Redirect URI (tambahkan ke Spotify Dashboard):', redirectUri);

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        setS({ connecting: false, error: 'Tidak bisa membuka browser.' });
        return;
      }
      await Linking.openURL(url);
    } catch (e: any) {
      console.error('[Spotify] connect error:', e);
      setS({ connecting: false, error: `Gagal membuka browser: ${e?.message || 'Unknown error'}` });
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
    else if (mounted.current) setS({ error: 'Gagal play. Pastikan Spotify aktif di device.' });
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
