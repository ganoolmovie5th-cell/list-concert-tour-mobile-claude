import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { strings, StringKey } from '../constants/strings';
import { Lang } from '../types';
import { CONCERTS } from '../data/concerts';
import { scheduleReminders, cancelReminders } from '../hooks/useNotifications';
import { useVoteCounts, VoteCounts } from '../hooks/useVoteCounts';

// ── Types ────────────────────────────────────────────────────────────────────

type ThemeMode = 'dark' | 'light' | 'system';

interface AppContextValue {
  // Theme
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof Colors.dark;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  // Language
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: StringKey) => string;
  // Wishlist — ponytail: Set in memory, Array in AsyncStorage
  wishlist: Set<string>;
  toggleWishlist: (id: string) => Promise<boolean>;
  isWishlisted: (id: string) => boolean;
  // Vote counts
  counts: VoteCounts;
  voteCountsLoading: boolean;
  getCount: (id: string) => { going: number; interested: number };
  fetchAll: () => Promise<void>;
}

const AppContext = createContext<AppContextValue>({} as AppContextValue);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();

  // Theme
  const [mode, setModeState] = useState<ThemeMode>('dark');
  useEffect(() => {
    AsyncStorage.getItem('cid_theme').then(v => {
      if (v === 'dark' || v === 'light' || v === 'system') setModeState(v);
    });
  }, []);
  const setMode = async (m: ThemeMode) => {
    setModeState(m);
    await AsyncStorage.setItem('cid_theme', m);
  };
  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const toggle = () => setMode(isDark ? 'light' : 'dark');

  // Language
  const [lang, setLangState] = useState<Lang>('id');
  useEffect(() => {
    AsyncStorage.getItem('cid_lang').then(v => {
      if (v === 'id' || v === 'en') setLangState(v);
    });
  }, []);
  const setLang = async (l: Lang) => {
    setLangState(l);
    await AsyncStorage.setItem('cid_lang', l);
  };
  const toggleLang = () => setLang(lang === 'id' ? 'en' : 'id');
  const t = (key: StringKey): string =>
    (strings[lang] as Record<string, string>)[key] ??
    (strings['id'] as Record<string, string>)[key] ??
    key;

  // Wishlist — ponytail: Array on disk, Set in memory (JSON.stringify doesn't support Set)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  useEffect(() => {
    AsyncStorage.getItem('cid_wishlist').then(v => {
      if (v) try { setWishlist(new Set(JSON.parse(v))); } catch {}
    });
  }, []);
  const toggleWishlist = useCallback(async (id: string): Promise<boolean> => {
    const current = await AsyncStorage.getItem('cid_wishlist');
    const set = current ? new Set<string>(JSON.parse(current)) : new Set<string>();
    const isAdding = !set.has(id);
    if (isAdding) {
      set.add(id);
      const concert = CONCERTS.find(c => c.id === id);
      if (concert) scheduleReminders(concert).catch(() => {});
    } else {
      set.delete(id);
      cancelReminders(id).catch(() => {});
    }
    await AsyncStorage.setItem('cid_wishlist', JSON.stringify([...set]));
    setWishlist(new Set(set));
    return isAdding;
  }, []);
  const isWishlisted = useCallback((id: string) => wishlist.has(id), [wishlist]);

  // Vote counts — delegates to existing hook
  const { counts, loading: voteCountsLoading, getCount, fetchAll } = useVoteCounts();

  return (
    <AppContext.Provider value={{
      mode, isDark, colors, setMode, toggle,
      lang, setLang, toggleLang, t,
      wishlist, toggleWishlist, isWishlisted,
      counts, voteCountsLoading, getCount, fetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
