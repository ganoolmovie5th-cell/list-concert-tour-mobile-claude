import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_KEY = 'cid_ticket_market';

export interface TicketListing {
  uid: string;
  type: 'jual' | 'beli';
  name: string;
  category: string;
  qty: number;
  price: string;
  contact: string;
  note: string;
  date: string;
}

export function useTicketMarket(concertId: string) {
  const key = `${BASE_KEY}_${concertId}`;
  const [listings, setListings] = useState<TicketListing[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(key).then(v => {
      if (v) { try { setListings(JSON.parse(v)); } catch {} }
    });
  }, [concertId]);

  const addListing = useCallback(async (
    type: 'jual' | 'beli',
    name: string,
    category: string,
    qty: number,
    price: string,
    contact: string,
    note: string,
  ) => {
    if (!name.trim() || !contact.trim()) return false;
    const item: TicketListing = {
      uid: Date.now().toString(),
      type,
      name: name.trim().slice(0, 30),
      category: category.trim().slice(0, 30) || 'TBA',
      qty: Math.min(qty || 1, 4),
      price: price.trim().slice(0, 30),
      contact: contact.trim().slice(0, 60),
      note: note.trim().slice(0, 150),
      date: new Date().toISOString(),
    };
    const next = [item, ...listings].slice(0, 50);
    setListings(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    return true;
  }, [listings, key]);

  return { listings, addListing };
}
