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
import * as Location from 'expo-location';

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
    // Block: konser sudah selesai
    if (isPast(concert)) {
      return { success: false, message: '⏰ Konser sudah selesai, tidak bisa check-in.' };
    }

    // Block: konser masih rumor
    if (concert.confirmStatus === 'rumor') {
      return { success: false, message: '🔮 Check-in hanya tersedia untuk konser yang sudah confirmed.' };
    }

    // Block: konser masih jauh — hanya boleh check-in di hari konser
    const today = new Date();
    const concertDay = concert.rawDate;
    const isConcertDay = (
      today.getFullYear() === concertDay.getFullYear() &&
      today.getMonth() === concertDay.getMonth() &&
      today.getDate() === concertDay.getDate()
    );
    if (!isConcertDay) {
      const daysLeft = Math.ceil((concertDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { success: false, message: `📅 Check-in hanya tersedia pada hari konser (${daysLeft} hari lagi).` };
    }

    setChecking(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setChecking(false);
        return { success: false, message: '📍 Izin lokasi diperlukan untuk check-in. Aktifkan di Pengaturan.' };
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      const venueCoord = findVenueCoord(concert.venue);
      if (!venueCoord) {
        setChecking(false);
        // Venue koordinat tidak diketahui — tetap izinkan check-in hari-H
        return _doCheckIn(concert, latitude, longitude, false, '📍 Koordinat venue tidak ditemukan. Check-in dicatat.');
      }

      const dist = distanceMeters(latitude, longitude, venueCoord.lat, venueCoord.lng);
      if (dist > venueCoord.radiusMeters) {
        setChecking(false);
        return { success: false, message: `📍 Kamu ${Math.round(dist)}m dari venue. Check-in hanya bisa dalam radius ${venueCoord.radiusMeters}m dari ${venueCoord.name}.` };
      }

      setChecking(false);
      return _doCheckIn(concert, latitude, longitude, true, `✅ Check-in verified! Kamu ${Math.round(dist)}m dari ${venueCoord.name}`);
    } catch (e: any) {
      setChecking(false);
      setError('Gagal mendapat lokasi');
      return { success: false, message: '❌ Gagal mendapatkan lokasi. Pastikan GPS aktif dan coba lagi.' };
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
