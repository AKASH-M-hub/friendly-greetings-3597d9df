import { Sun, Moon, Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { useTheme, Theme } from '@/contexts/ThemeContext';

const themeGroups = [
  { 
    id: 'orange', 
    name: 'Sunset Orange', 
    icon: <div className="h-4 w-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />,
    themes: ['sunset', 'sunset-light'] as Theme[]
  },
  { 
    id: 'blue', 
    name: 'Aqua Blue', 
    icon: <div className="h-4 w-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />,
    themes: ['aqua', 'aqua-light'] as Theme[]
  },
  { 
    id: 'green', 
    name: 'Cosmic Green', 
    icon: <div className="h-4 w-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500" />,
    themes: ['cosmic', 'cosmic-light'] as Theme[]
  },
  { 
    id: 'grey', 
    name: 'Neutral', 
    icon: <div className="h-4 w-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-600" />,
    themes: ['dark', 'light'] as Theme[]
  },
];

export function ThemeToggle() {
  const { theme, setTheme, themes, isDark } = useTheme();

  const currentIcon = isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;

  const getThemeLabel = (themeId: Theme) => {
    const t = themes.find(th => th.id === themeId);
    return t?.name || themeId;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {currentIcon}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themeGroups.map((group) => (
          <DropdownMenuSub key={group.id}>
            <DropdownMenuSubTrigger className="gap-3 cursor-pointer">
              {group.icon}
              <span className="flex-1">{group.name}</span>
              {group.themes.includes(theme) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {group.themes.map((themeId) => (
                  <DropdownMenuItem
                    key={themeId}
                    onClick={() => setTheme(themeId)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    {themeId.includes('light') || themeId === 'light' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    <span className="flex-1">{getThemeLabel(themeId)}</span>
                    {theme === themeId && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
