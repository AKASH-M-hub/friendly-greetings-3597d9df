import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'sunset' | 'aqua' | 'cosmic';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  themes: { id: Theme; name: string; color: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: { id: Theme; name: string; color: string }[] = [
  { id: 'sunset', name: 'Sunset Orange', color: 'hsl(24, 100%, 55%)' },
  { id: 'dark', name: 'Dark Mode', color: 'hsl(0, 0%, 85%)' },
  { id: 'light', name: 'Light Mode', color: 'hsl(220, 14%, 40%)' },
  { id: 'aqua', name: 'Aqua Blue', color: 'hsl(185, 100%, 50%)' },
  { id: 'cosmic', name: 'Cosmic Green', color: 'hsl(155, 100%, 50%)' },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chrono-theme') as Theme;
      if (stored && themes.find(t => t.id === stored)) return stored;
      return 'sunset'; // Default theme
    }
    return 'sunset';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'sunset', 'aqua', 'cosmic');
    root.classList.add(theme);
    localStorage.setItem('chrono-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      const currentIndex = themes.findIndex(t => t.id === prev);
      const nextIndex = (currentIndex + 1) % themes.length;
      return themes[nextIndex].id;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, themes }}>
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
