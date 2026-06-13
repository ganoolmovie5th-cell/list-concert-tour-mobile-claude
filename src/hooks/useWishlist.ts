import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cid_wishlist';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v) {
        try { setWishlist(new Set(JSON.parse(v))); } catch {}
      }
    });
  }, []);

  const save = async (s: Set<string>) => {
    setWishlist(new Set(s));
    await AsyncStorage.setItem(KEY, JSON.stringify([...s]));
  };

  const toggle = useCallback(async (id: string): Promise<boolean> => {
    const next = new Set(wishlist);
    if (next.has(id)) { next.delete(id); await save(next); return false; }
    else { next.add(id); await save(next); return true; }
  }, [wishlist]);

  const isWishlisted = useCallback((id: string) => wishlist.has(id), [wishlist]);

  return { wishlist, toggle, isWishlisted };
}
