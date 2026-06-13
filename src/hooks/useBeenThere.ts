import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cid_been_there';

export function useBeenThere() {
  const [attended, setAttended] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v) { try { setAttended(new Set(JSON.parse(v))); } catch {} }
    });
  }, []);

  const save = async (s: Set<string>) => {
    setAttended(new Set(s));
    await AsyncStorage.setItem(KEY, JSON.stringify([...s]));
  };

  const toggle = useCallback(async (id: string): Promise<boolean> => {
    const next = new Set(attended);
    if (next.has(id)) { next.delete(id); await save(next); return false; }
    else { next.add(id); await save(next); return true; }
  }, [attended]);

  const hasAttended = useCallback((id: string) => attended.has(id), [attended]);

  return { toggle, hasAttended };
}
