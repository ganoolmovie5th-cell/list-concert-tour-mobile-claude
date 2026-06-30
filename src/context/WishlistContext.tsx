// ponytail: logic merged into AppContext. Shim preserves import paths for consumers.
import React from 'react';
import { useApp } from './AppContext';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const useWishlist = () => {
  const { wishlist, toggleWishlist, isWishlisted } = useApp();
  // ponytail: toggle alias matches old WishlistContext API
  return { wishlist, toggle: toggleWishlist, isWishlisted };
};
