import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

const PALETTES = {
  light: {
    series: ['#2563EB', '#0D9488', '#1E3A8A', '#D97706', '#7C3AED', '#64748B'],
    grid: '#E2E8F0',
    axis: '#64748B',
    positive: '#0D9488',
    negative: '#DC2626',
  },
  dark: {
    series: ['#60A5FA', '#2DD4BF', '#818CF8', '#FBBF24', '#A78BFA', '#94A3B8'],
    grid: '#26324A',
    axis: '#94A3B8',
    positive: '#2DD4BF',
    negative: '#F87171',
  },
};

const initial = () => {
  try {
    const saved = localStorage.getItem('bankvision-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initial);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('bankvision-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo(() => ({ theme, setTheme, toggle, palette: PALETTES[theme] }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
