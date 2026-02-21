import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'sunset' | 'sunset-light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  themes: { id: Theme; name: string; color: string }[];
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: { id: Theme; name: string; color: string }[] = [
  { id: 'sunset', name: 'Sunset Dark', color: 'hsl(24, 100%, 55%)' },
  { id: 'sunset-light', name: 'Sunset Light', color: 'hsl(24, 100%, 50%)' },
];

const darkThemes: Theme[] = ['sunset'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chrono-theme');
      if (stored === 'sunset' || stored === 'sunset-light') return stored;
    }
    return 'sunset';
  });

  const isDark = darkThemes.includes(theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('sunset', 'sunset-light');
    root.classList.add(theme);
    localStorage.setItem('chrono-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'sunset' ? 'sunset-light' : 'sunset');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, themes, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
