import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  GraduationCap, 
  BookOpen, 
  Coins, 
  Clock, 
  Settings, 
  User,
  History,
  Zap,
  Menu,
  X,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useMode } from '@/contexts/ModeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: GraduationCap, label: 'Teaching', href: '/teaching' },
  { icon: BookOpen, label: 'Learning', href: '/learning' },
  { icon: Coins, label: 'Credits', href: '/credits' },
  { icon: History, label: 'Sessions', href: '/sessions' },
];

export function TopNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme, themes } = useTheme();
  const { currentMode } = useMode();
  const location = useLocation();

  const totalCredits = 24;

  return (
    <>
      <header className="navbar-glass fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary transition-transform hover:scale-105">
              <Clock className="h-5 w-5 text-primary-foreground" />
              <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Chrono
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {mainNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary/15 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isActive && "scale-110",
                    !isActive && "group-hover:scale-105"
                  )} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Credits Display */}
            <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-4 py-2 sm:flex">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{totalCredits}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>

            {/* Mode Indicator */}
            {currentMode && (
              <div className="hidden items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 lg:flex">
                {currentMode === 'teaching' ? (
                  <GraduationCap className="h-4 w-4 text-primary" />
                ) : (
                  <BookOpen className="h-4 w-4 text-primary" />
                )}
                <span className="text-sm font-medium capitalize text-foreground">
                  {currentMode}
                </span>
                <div className="h-2 w-2 rounded-full bg-primary pulse-primary" />
              </div>
            )}

            {/* Theme Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Choose Theme
                </div>
                <DropdownMenuSeparator />
                {themes.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer",
                      theme === t.id && "bg-primary/10"
                    )}
                  >
                    <div 
                      className="h-4 w-4 rounded-full ring-2 ring-offset-2 ring-offset-background"
                      style={{ backgroundColor: t.color, boxShadow: theme === t.id ? `0 0 10px ${t.color}` : 'none' }}
                    />
                    <span className={cn(theme === t.id && "font-medium text-primary")}>
                      {t.name}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile & Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
            >
              <nav className="flex flex-col gap-1 p-4">
                {mainNavItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                        isActive 
                          ? "bg-primary/15 text-primary" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                
                <div className="my-2 border-t border-border" />
                
                {/* Credits in mobile */}
                <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">{totalCredits} credits available</span>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}
