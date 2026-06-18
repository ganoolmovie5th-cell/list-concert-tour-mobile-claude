import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONCERTS } from '../data/concerts';
import { scheduleReminders, cancelReminders } from '../hooks/useNotifications';

const KEY = 'cid_wishlist';

interface WishlistContextValue {
  wishlist: Set<string>;
  toggle: (id: string) => Promise<boolean>;
  isWishlisted: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue>({
  wishlist: new Set(),
  toggle: async () => false,
  isWishlisted: () => false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v) try { setWishlist(new Set(JSON.parse(v))); } catch {}
    });
  }, []);

  const toggle = useCallback(async (id: string): Promise<boolean> => {
    const current = await AsyncStorage.getItem(KEY);
    const set     = current ? new Set<string>(JSON.parse(current)) : new Set<string>();
    const isAdding = !set.has(id);

    if (isAdding) {
      set.add(id);
      // Schedule notifications for this concert
      const concert = CONCERTS.find(c => c.id === id);
      if (concert) scheduleReminders(concert).catch(() => {});
    } else {
      set.delete(id);
      cancelReminders(id).catch(() => {});
    }

    await AsyncStorage.setItem(KEY, JSON.stringify([...set]));
    setWishlist(new Set(set));
    return isAdding;
  }, []);

  const isWishlisted = useCallback((id: string) => wishlist.has(id), [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
