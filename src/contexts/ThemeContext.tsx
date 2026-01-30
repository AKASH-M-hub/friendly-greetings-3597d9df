import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'sunset' | 'sunset-light' | 'aqua' | 'aqua-light' | 'cosmic' | 'cosmic-light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  themes: { id: Theme; name: string; color: string; group: string }[];
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: { id: Theme; name: string; color: string; group: string }[] = [
  // Orange themes
  { id: 'sunset', name: 'Sunset Dark', color: 'hsl(24, 100%, 55%)', group: 'orange' },
  { id: 'sunset-light', name: 'Sunset Light', color: 'hsl(24, 100%, 50%)', group: 'orange' },
  // Blue themes
  { id: 'aqua', name: 'Aqua Dark', color: 'hsl(185, 100%, 50%)', group: 'blue' },
  { id: 'aqua-light', name: 'Aqua Light', color: 'hsl(185, 100%, 42%)', group: 'blue' },
  // Green themes
  { id: 'cosmic', name: 'Cosmic Dark', color: 'hsl(155, 100%, 50%)', group: 'green' },
  { id: 'cosmic-light', name: 'Cosmic Light', color: 'hsl(155, 100%, 38%)', group: 'green' },
  // Grey/Neutral themes
  { id: 'dark', name: 'Dark Mode', color: 'hsl(0, 0%, 85%)', group: 'grey' },
  { id: 'light', name: 'Light Mode', color: 'hsl(220, 14%, 40%)', group: 'grey' },
];

const darkThemes: Theme[] = ['dark', 'sunset', 'aqua', 'cosmic'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chrono-theme') as Theme;
      if (stored && themes.find(t => t.id === stored)) return stored;
      return 'sunset'; // Default theme
    }
    return 'sunset';
  });

  const isDark = darkThemes.includes(theme);

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all theme classes
    themes.forEach(t => root.classList.remove(t.id));
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
