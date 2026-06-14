import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_KEY   = 'cid_ticket_market';
const OWNER_KEY  = 'cid_uid';

export interface TicketListing {
  uid: string;
  ownerUid: string;
  type: 'jual' | 'beli';
  name: string;
  category: string;
  qty: number;
  price: string;       // angka murni, tanpa titik/Rp
  contact: string;
  note: string;
  date: string;
  sold: boolean;
}

function getOwnerUID(): string {
  // Sync — AsyncStorage tidak bisa di sini, jadi pakai key global sementara
  // Sebenarnya dihandle di hook via state
  return 'local';
}

function genPostUID(): string {
  return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function buildWaHref(contact: string): string | null {
  const digits = contact.replace(/\D/g, '');
  if (!digits || digits.length < 8) return null;
  let num = digits;
  if (num.startsWith('0')) num = '62' + num.slice(1);
  else if (!num.startsWith('62')) num = '62' + num;
  return `https://wa.me/${num}`;
}

export function formatRpDisplay(price: string): string {
  if (!price) return '';
  const num = parseInt(price.replace(/\D/g, ''));
  if (!num) return '';
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1).replace('.0', '')} jt`;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

export function useTicketMarket(concertId: string) {
  const key = `${BASE_KEY}_${concertId}`;
  const [listings, setListings] = useState<TicketListing[]>([]);
  const [ownerUid, setOwnerUid] = useState('');

  useEffect(() => {
    // Load ownerUid
    AsyncStorage.getItem(OWNER_KEY).then(uid => {
      if (uid) { setOwnerUid(uid); return; }
      const newUid = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      AsyncStorage.setItem(OWNER_KEY, newUid);
      setOwnerUid(newUid);
    });
    // Load listings
    AsyncStorage.getItem(key).then(v => {
      if (v) { try { setListings(JSON.parse(v)); } catch {} }
    });
  }, [concertId]);

  const save = useCallback(async (next: TicketListing[]) => {
    setListings(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }, [key]);

  const addListing = useCallback(async (
    type: 'jual' | 'beli', name: string, category: string,
    qty: number, price: string, contact: string, note: string,
  ) => {
    if (!name.trim() || !contact.trim()) return false;
    const item: TicketListing = {
      uid:      genPostUID(),
      ownerUid,
      type,
      name:     name.trim().slice(0, 30),
      category: (category.trim() || 'TBA').slice(0, 30),
      qty:      Math.min(qty || 1, 20),
      price:    price.replace(/\./g, '').trim().slice(0, 20),
      contact:  contact.trim().slice(0, 60),
      note:     note.trim().slice(0, 150),
      date:     new Date().toISOString(),
      sold:     false,
    };
    await save([item, ...listings].slice(0, 50));
    return true;
  }, [listings, ownerUid, save]);

  const markSold = useCallback(async (uid: string) => {
    const next = listings.map(l => l.uid === uid ? { ...l, sold: true } : l);
    await save(next);
  }, [listings, save]);

  const deleteListing = useCallback(async (uid: string) => {
    await save(listings.filter(l => l.uid !== uid));
  }, [listings, save]);

  const updateListing = useCallback(async (uid: string, fields: Partial<TicketListing>) => {
    const next = listings.map(l => l.uid === uid ? { ...l, ...fields } : l);
    await save(next);
  }, [listings, save]);

  return { listings, ownerUid, addListing, markSold, deleteListing, updateListing };
}
