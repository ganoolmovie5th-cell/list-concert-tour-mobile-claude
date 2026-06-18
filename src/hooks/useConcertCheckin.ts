/**
 * useConcertCheckin — Concert Check-in dengan Geolocation
 * Validasi kehadiran berdasarkan radius 1km dari venue
 * Simpan ke Supabase table: concert_checkins
 * Fallback ke AsyncStorage
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB, getDeviceUID } from '../lib/supabase';
import { Concert } from '../types';
import { isPast } from '../utils/helpers';
import { findVenueCoord, distanceMeters } from '../data/venueCoordinates';

// Lazy import expo-location
let Location: any = null;
try { Location = require('expo-location'); } catch {}

const LS_KEY = 'cid_checkins';

export interface CheckinData {
  concertId: string;
  deviceUid: string;
  checkedInAt: string;
  lat?: number;
  lng?: number;
  verified: boolean; // true = dalam radius venue
}

export function useConcertCheckin(concert: Concert) {
  const [checkedIn, setCheckedIn]   = useState(false);
  const [checking, setChecking]     = useState(false);
  const [checkInCount, setCheckInCount] = useState(0);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid  = await getDeviceUID();
      // Cek local
      const local = await _getLocal();
      if (local[concert.id]) {
        if (!cancelled) setCheckedIn(true);
      }
      // Fetch count dari Supabase
      try {
        const rows = await DB.select('concert_checkins',
          `concert_id=eq.${encodeURIComponent(concert.id)}&select=device_uid`);
        if (!cancelled) {
          setCheckInCount(rows.length);
          if (rows.some((r: any) => r.device_uid === uid)) setCheckedIn(true);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [concert.id]);

  const checkIn = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!isPast(concert)) {
      // Untuk konser past — langsung allow tanpa GPS
      return _doCheckIn(concert, null, null, false);
    }

    if (!Location) {
      return _doCheckIn(concert, null, null, false);
    }

    setChecking(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback check-in tanpa GPS
        setChecking(false);
        return _doCheckIn(concert, null, null, false);
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      const venueCoord = findVenueCoord(concert.venue);
      let verified = false;
      let message  = '';

      if (venueCoord) {
        const dist = distanceMeters(latitude, longitude, venueCoord.lat, venueCoord.lng);
        verified   = dist <= venueCoord.radiusMeters;
        message    = verified
          ? `✅ Check-in verified! Kamu ${Math.round(dist)}m dari ${venueCoord.name}`
          : `📍 Kamu ${Math.round(dist)}m dari venue (radius: ${venueCoord.radiusMeters}m). Check-in tetap dicatat.`;
      } else {
        message = '📍 Lokasi venue tidak ditemukan. Check-in dicatat tanpa verifikasi GPS.';
      }

      setChecking(false);
      return _doCheckIn(concert, latitude, longitude, verified, message);
    } catch (e: any) {
      setChecking(false);
      setError('Gagal mendapat lokasi');
      return _doCheckIn(concert, null, null, false);
    }
  }, [concert]);

  async function _doCheckIn(
    c: Concert, lat: number | null, lng: number | null,
    verified: boolean, extraMsg = '',
  ): Promise<{ success: boolean; message: string }> {
    const uid = await getDeviceUID();
    if (checkedIn) return { success: false, message: 'Sudah check-in sebelumnya' };

    const data: CheckinData = {
      concertId: c.id, deviceUid: uid,
      checkedInAt: new Date().toISOString(),
      ...(lat != null ? { lat, lng: lng! } : {}),
      verified,
    };

    try {
      await DB.insert('concert_checkins', {
        concert_id: c.id, device_uid: uid,
        checked_in_at: data.checkedInAt,
        lat, lng, verified,
      });
    } catch {}

    // Local fallback
    const local = await _getLocal();
    local[c.id] = data;
    await AsyncStorage.setItem(LS_KEY, JSON.stringify(local));

    setCheckedIn(true);
    setCheckInCount(p => p + 1);

    const msg = extraMsg || `🎵 Check-in berhasil! Selamat menikmati ${c.artist}!`;
    return { success: true, message: msg };
  }

  return { checkedIn, checking, checkInCount, error, checkIn };
}

async function _getLocal(): Promise<Record<string, CheckinData>> {
  try {
    const v = await AsyncStorage.getItem(LS_KEY);
    return v ? JSON.parse(v) : {};
  } catch { return {}; }
}
