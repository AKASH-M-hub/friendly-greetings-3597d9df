import { useState } from 'react';
import { ChevronDown, Check, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function ThemeDropdown() {
  const { theme, setTheme, themes } = useTheme();
  const currentTheme = themes.find(t => t.id === theme);

  // Group themes by their group
  const groupedThemes = themes.reduce((acc, t) => {
    if (!acc[t.group]) {
      acc[t.group] = [];
    }
    acc[t.group].push(t);
    return acc;
  }, {} as Record<string, typeof themes>);

  const groupLabels: Record<string, string> = {
    orange: 'Sunset',
    blue: 'Aqua',
    green: 'Cosmic',
    grey: 'Neutral',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 px-3"
        >
          <div 
            className="h-4 w-4 rounded-full ring-1 ring-border"
            style={{ 
              backgroundColor: currentTheme?.color,
              boxShadow: `0 0 8px ${currentTheme?.color}40`
            }}
          />
          <span className="hidden sm:inline text-sm font-medium">
            {currentTheme?.name.split(' ')[0]}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-popover border-border z-50"
      >
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Palette className="h-3.5 w-3.5" />
          Choose Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(groupedThemes).map(([group, groupThemes], groupIndex) => (
          <div key={group}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground capitalize">
              {groupLabels[group] || group}
            </DropdownMenuLabel>
            {groupThemes.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer",
                  theme === t.id && "bg-accent"
                )}
              >
                <div 
                  className={cn(
                    "h-5 w-5 rounded-full ring-1 ring-border transition-all",
                    theme === t.id && "ring-2 ring-primary"
                  )}
                  style={{ 
                    backgroundColor: t.color,
                    boxShadow: theme === t.id ? `0 0 12px ${t.color}` : 'none'
                  }}
                />
                <span className="flex-1 text-sm">{t.name}</span>
                {theme === t.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
