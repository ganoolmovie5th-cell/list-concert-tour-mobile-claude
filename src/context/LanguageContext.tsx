// ponytail: logic merged into AppContext. Shim preserves import paths for consumers.
import React from 'react';
import { useApp } from './AppContext';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const useLanguage = () => {
  const { lang, setLang, toggleLang, t } = useApp();
  return { lang, setLang, toggleLang, t };
};
