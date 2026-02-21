import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export function ThemeDropdown() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 px-3"
      onClick={toggleTheme}
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-primary" />
      ) : (
        <Sun className="h-4 w-4 text-primary" />
      )}
      <span className="hidden sm:inline text-sm font-medium">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </Button>
  );
}
