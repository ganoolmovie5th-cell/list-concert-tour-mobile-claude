import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); AsyncStorage.setItem(KEY, JSON.stringify([...next])); return next; }
      else { next.add(id); AsyncStorage.setItem(KEY, JSON.stringify([...next])); return next; }
    });
    const current = await AsyncStorage.getItem(KEY);
    const set = current ? new Set<string>(JSON.parse(current)) : new Set<string>();
    return set.has(id);
  }, []);

  const isWishlisted = useCallback((id: string) => wishlist.has(id), [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
