import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { strings, StringKey } from '../constants/strings';
import { Lang } from '../types';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: StringKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export function LanguageProvider({ children }: { children: ReactNode }) {
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

  const t = (key: StringKey): string => {
    return (strings[lang] as Record<string, string>)[key] ?? (strings['id'] as Record<string, string>)[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
