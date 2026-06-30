// ponytail: logic merged into AppContext. Shim preserves import paths for consumers.
import React from 'react';
import { useApp } from './AppContext';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const useTheme = () => {
  const { mode, isDark, colors, setMode, toggle } = useApp();
  return { mode, isDark, colors, setMode, toggle };
};
