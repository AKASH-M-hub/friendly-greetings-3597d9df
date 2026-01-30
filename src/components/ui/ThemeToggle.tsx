import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useTheme, Theme } from '@/contexts/ThemeContext';

const themeIcons: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  sunset: <div className="h-4 w-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />,
  aqua: <div className="h-4 w-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />,
  cosmic: <div className="h-4 w-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500" />,
};

export function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme();

  const isDark = theme === 'dark';
  const isLight = theme === 'light';
  const currentIcon = isDark ? <Moon className="h-4 w-4" /> : isLight ? <Sun className="h-4 w-4" /> : <Palette className="h-4 w-4" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {currentIcon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Light/Dark mode quick toggle */}
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Sun className="h-4 w-4" />
          <span className="flex-1">Light Mode</span>
          {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Moon className="h-4 w-4" />
          <span className="flex-1">Dark Mode</span>
          {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Color Schemes</DropdownMenuLabel>
        
        {themes.filter(t => !['light', 'dark'].includes(t.id)).map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div 
              className="h-4 w-4 rounded-full border border-border/50" 
              style={{ backgroundColor: t.color }}
            />
            <span className="flex-1">{t.name}</span>
            {theme === t.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
