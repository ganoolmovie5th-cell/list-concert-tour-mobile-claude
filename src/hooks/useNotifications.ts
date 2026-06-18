/**
 * useNotifications — Push Notification & Concert Reminder
 * Pakai expo-notifications untuk:
 * - H-7 reminder wishlist concert
 * - H-1 reminder wishlist concert
 * - Notif "Tiket on sale soon" (H-30, hanya confirmed)
 */
import { useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Concert } from '../types';
import { isPast } from '../utils/helpers';

// Lazy import expo-notifications agar tidak crash kalau belum diinstall
let Notifications: any = null;
try { Notifications = require('expo-notifications'); } catch {}

const SCHEDULED_KEY = 'cid_scheduled_notifs';
const PERM_KEY      = 'cid_notif_perm';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const cached = await AsyncStorage.getItem(PERM_KEY);
    if (cached === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    await AsyncStorage.setItem(PERM_KEY, status);
    return status === 'granted';
  } catch { return false; }
}

export async function scheduleReminders(concert: Concert): Promise<void> {
  if (!Notifications) return;
  if (isPast(concert) || concert.confirmStatus === 'rumor') return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const concertDate = concert.rawDate;
  const now         = new Date();

  // Cancel existing reminders for this concert
  await cancelReminders(concert.id);

  const ids: string[] = [];

  // H-7
  const h7 = new Date(concertDate.getTime() - 7 * 24 * 3600 * 1000);
  if (h7 > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎵 7 Hari Lagi! ${concert.artist}`,
        body: `Siapkan diri! ${concert.artist} tampil di ${concert.venue} — ${concert.dates[0]}`,
        data: { concertId: concert.id },
      },
      trigger: { date: h7 },
    });
    ids.push(id);
  }

  // H-1
  const h1 = new Date(concertDate.getTime() - 24 * 3600 * 1000);
  if (h1 > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 Besok! ${concert.artist}`,
        body: `Jangan lupa! ${concert.artist} tampil besok di ${concert.venue}. Siapkan tiket & outfit! 🎶`,
        data: { concertId: concert.id },
      },
      trigger: { date: h1 },
    });
    ids.push(id);
  }

  // H-30 (tiket reminder)
  const h30 = new Date(concertDate.getTime() - 30 * 24 * 3600 * 1000);
  if (h30 > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎫 30 Hari Lagi — ${concert.artist}`,
        body: `Konser ${concert.artist} tinggal 30 hari! Pastikan tiket kamu sudah aman 🎟️`,
        data: { concertId: concert.id },
      },
      trigger: { date: h30 },
    });
    ids.push(id);
  }

  // Simpan IDs
  const stored = await _getScheduled();
  stored[concert.id] = ids;
  await AsyncStorage.setItem(SCHEDULED_KEY, JSON.stringify(stored));
}

export async function cancelReminders(concertId: string): Promise<void> {
  if (!Notifications) return;
  const stored = await _getScheduled();
  const ids    = stored[concertId] || [];
  for (const id of ids) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
  }
  delete stored[concertId];
  await AsyncStorage.setItem(SCHEDULED_KEY, JSON.stringify(stored));
}

async function _getScheduled(): Promise<Record<string, string[]>> {
  try {
    const v = await AsyncStorage.getItem(SCHEDULED_KEY);
    return v ? JSON.parse(v) : {};
  } catch { return {}; }
}

export function useNotifications() {
  useEffect(() => {
    if (!Notifications) return;
    // Handler saat notifikasi di-tap
    const sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const { concertId } = response.notification.request.content.data || {};
      if (concertId) {
        // Navigation akan dihandle di AppNavigator via linking
        console.log('[Notif] Concert tapped:', concertId);
      }
    });
    return () => sub.remove();
  }, []);
}
