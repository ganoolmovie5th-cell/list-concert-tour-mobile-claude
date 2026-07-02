// ponytail: native Network check replaces Supabase HEAD poll every 30s
import { useState, useEffect, useCallback } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  const checkOnline = useCallback(async () => {
    const state = await Network.getNetworkStateAsync();
    setIsOnline(state.isConnected ?? true);
  }, []);

  useEffect(() => {
    checkOnline();
    // expo-network has no event listener API; poll at same cadence but zero network cost
    const id = setInterval(checkOnline, 30_000);
    return () => clearInterval(id);
  }, [checkOnline]);

  return { isOnline, checkOnline };
}
