/**
 * useTicketMarket — Forum Jual Beli Tiket
 * Supabase primary, AsyncStorage fallback
 * Mirror dari TicketMarket di features3.js web
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DB, getDeviceUID } from '../lib/supabase';
import { makeUID } from '../utils/helpers';

const LS_KEY = 'cid_ticket_market';

function lsKey(id: string) { return `${LS_KEY}_${id}`; }

export interface TicketListing {
  uid: string;
  ownerUid: string;
  type: 'jual' | 'beli';
  name: string;
  category: string;
  qty: number;
  price: string;
  contact: string;
  note: string;
  date: string;
  sold: boolean;
}

export function formatRpDisplay(price: string): string {
  if (!price) return '';
  const num = parseInt(price.replace(/\D/g, ''));
  if (!num) return '';
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1).replace('.0', '')} jt`;
  return `Rp ${num.toLocaleString('id-ID')}`;
}

async function lsGet(concertId: string): Promise<TicketListing[]> {
  try { return JSON.parse((await AsyncStorage.getItem(lsKey(concertId))) || '[]'); } catch { return []; }
}
async function lsSave(concertId: string, list: TicketListing[]) {
  await AsyncStorage.setItem(lsKey(concertId), JSON.stringify(list));
}

function mapRow(r: any): TicketListing {
  return {
    uid:      r.post_uid,
    ownerUid: r.owner_uid,
    type:     r.type     || 'jual',
    name:     r.name     || 'Anonim',
    category: r.category || 'TBA',
    qty:      r.qty      || 1,
    price:    r.price    || '',
    contact:  r.contact  || '',
    note:     r.note     || '',
    date:     r.created_at,
    sold:     r.sold     || false,
  };
}

export function useTicketMarket(concertId: string) {
  const [listings, setListings]   = useState<TicketListing[]>([]);
  const [ownerUid, setOwnerUid]   = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid = await getDeviceUID();
      if (!cancelled) setOwnerUid(uid);

      const local = await lsGet(concertId);
      if (!cancelled && local.length) setListings(local);

      try {
        const rows = await DB.select('ticket_market',
          `concert_id=eq.${encodeURIComponent(concertId)}&order=created_at.desc`);
        const list = rows.map(mapRow);
        if (!cancelled) { setListings(list); await lsSave(concertId, list); }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [concertId]);

  const addListing = useCallback(async (
    type: 'jual' | 'beli', name: string, category: string,
    qty: number, price: string, contact: string, note: string,
  ) => {
    if (!name.trim() || !contact.trim()) return false;
    const uid     = await getDeviceUID();
    const postUid = makeUID('p_');
    const item: TicketListing = {
      uid: postUid, ownerUid: uid, type,
      name:     name.trim().slice(0, 30),
      category: (category.trim() || 'TBA').slice(0, 30),
      qty:      Math.min(qty || 1, 20),
      price:    price.replace(/\./g, '').trim().slice(0, 20),
      contact:  contact.trim().slice(0, 60),
      note:     note.trim().slice(0, 150),
      date:     new Date().toISOString(),
      sold:     false,
    };

    try {
      await DB.insert('ticket_market', {
        concert_id: concertId,
        post_uid:   postUid,
        owner_uid:  uid,
        type, name: item.name, category: item.category,
        qty: item.qty, price: item.price,
        contact: item.contact, note: item.note,
      });
    } catch {}

    const next = [item, ...listings].slice(0, 50);
    setListings(next);
    await lsSave(concertId, next);
    return true;
  }, [listings, concertId]);

  const markSold = useCallback(async (uid: string) => {
    const next = listings.map(l => l.uid === uid ? { ...l, sold: true } : l);
    setListings(next);
    await lsSave(concertId, next);
    try { await DB.update('ticket_market', `post_uid=eq.${uid}`, { sold: true }); } catch {}
  }, [listings, concertId]);

  const deleteListing = useCallback(async (uid: string) => {
    const next = listings.filter(l => l.uid !== uid);
    setListings(next);
    await lsSave(concertId, next);
    try { await DB.delete('ticket_market', `post_uid=eq.${uid}`); } catch {}
  }, [listings, concertId]);

  const updateListing = useCallback(async (uid: string, fields: Partial<TicketListing>) => {
    const next = listings.map(l => l.uid === uid ? { ...l, ...fields } : l);
    setListings(next);
    await lsSave(concertId, next);
    const mapped: any = {};
    if (fields.name)     mapped.name     = fields.name;
    if (fields.category) mapped.category = fields.category;
    if (fields.qty)      mapped.qty      = fields.qty;
    if (fields.price)    mapped.price    = (fields.price || '').replace(/\./g, '');
    if (fields.contact)  mapped.contact  = fields.contact;
    if ('note' in fields) mapped.note    = fields.note;
    try { await DB.update('ticket_market', `post_uid=eq.${uid}`, mapped); } catch {}
  }, [listings, concertId]);

  return { listings, ownerUid, addListing, markSold, deleteListing, updateListing };
}
