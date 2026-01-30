import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  GraduationCap, 
  BookOpen, 
  Coins, 
  Clock, 
  Settings, 
  Sun, 
  Moon,
  ChevronLeft,
  ChevronRight,
  Zap,
  User,
  MessageSquare,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useMode } from '@/contexts/ModeContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string | number;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: 'Mode Selection', href: '/' },
  { icon: GraduationCap, label: 'Teaching', href: '/teaching' },
  { icon: BookOpen, label: 'Learning', href: '/learning' },
  { icon: Coins, label: 'Credits', href: '/credits' },
  { icon: History, label: 'Sessions', href: '/sessions' },
];

const secondaryNavItems: NavItem[] = [
  { icon: MessageSquare, label: 'Chrono AI', href: '/chat' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function ChronoSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { currentMode, modeHistory } = useMode();
  const location = useLocation();

  const totalCredits = 24; // This would come from a credits context

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo & Brand */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Clock className="h-5 w-5 text-primary-foreground" />
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-sidebar" />
          </div>
          {!isCollapsed && (
            <span className="font-display text-xl font-bold text-foreground">
              Chrono
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Credit Display */}
      <div className={cn(
        "mx-3 mt-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-3 transition-all duration-300",
        isCollapsed && "mx-2 p-2"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-xs text-muted-foreground">Available Credits</p>
              <p className="font-display text-xl font-bold text-foreground">{totalCredits}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mode Indicator */}
      {currentMode && !isCollapsed && (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          {currentMode === 'teaching' ? (
            <GraduationCap className="h-4 w-4 text-primary" />
          ) : (
            <BookOpen className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium text-foreground capitalize">
            {currentMode} Mode
          </span>
          <div className="ml-auto h-2 w-2 rounded-full bg-primary pulse-orange" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        <div className="mb-2 px-2">
          {!isCollapsed && (
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Main
            </span>
          )}
        </div>
        
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          const linkContent = (
            <Link
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200",
                isActive && "scale-110",
                !isActive && "group-hover:scale-105"
              )} />
              {!isCollapsed && <span>{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-semibold text-primary">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <div className="absolute left-0 h-8 w-1 rounded-r-full bg-primary" />
              )}
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  {item.label}
                  {item.badge && (
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                      {item.badge}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href} className="relative">{linkContent}</div>;
        })}

        <div className="my-4 border-t border-sidebar-border" />

        <div className="mb-2 px-2">
          {!isCollapsed && (
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              More
            </span>
          )}
        </div>

        {secondaryNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          const linkContent = (
            <Link
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}
      </nav>

      {/* Mode Stats (when expanded) */}
      {!isCollapsed && (
        <div className="mx-3 mb-3 rounded-lg bg-muted/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your Stats
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{modeHistory.teachingSessions}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{modeHistory.learningSessions}</span>
            </div>
          </div>
        </div>
      )}

      {/* Theme Toggle */}
      <div className="border-t border-sidebar-border p-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "default"}
              onClick={toggleTheme}
              className={cn(
                "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
                isCollapsed && "justify-center"
              )}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              {!isCollapsed && (
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              )}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
