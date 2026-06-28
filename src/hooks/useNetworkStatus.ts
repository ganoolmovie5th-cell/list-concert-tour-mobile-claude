/**
 * useNetworkStatus — Deteksi koneksi online/offline
 * Menggunakan fetch probe ke Supabase endpoint (ringan, no extra package)
 */
import { useState, useEffect, useCallback } from 'react';
import { SUPA_URL, SUPA_KEY } from '../lib/supabase';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  const checkOnline = useCallback(async () => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      await fetch(`${SUPA_URL}/rest/v1/`, {
        method: 'HEAD',
        signal: ctrl.signal,
        headers: { apikey: SUPA_KEY },
      });
      clearTimeout(timer);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    checkOnline();
    // Poll tiap 30 detik
    const id = setInterval(checkOnline, 30_000);
    return () => clearInterval(id);
  }, [checkOnline]);

  return { isOnline, checkOnline };
}
