import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Sun,
  Moon,
  LogIn,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
  const [totalCredits, setTotalCredits] = useState(0);
  const { theme, setTheme, themes } = useTheme();
  const { currentMode } = useMode();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch real credits from database
  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('teaching_sessions')
      .select('credits_earned')
      .eq('teacher_id', user.id)
      .eq('status', 'completed');

    const total = data?.reduce((sum, s) => sum + (s.credits_earned || 0), 0) || 0;
    setTotalCredits(total);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  // Quick toggle between light/dark or cycle through color themes
  const toggleLightDark = () => {
    if (isLight) {
      setTheme('dark');
    } else if (isDark) {
      setTheme('sunset');
    } else {
      setTheme('light');
    }
  };

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
            {user && (
              <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-4 py-2 sm:flex">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{totalCredits}</span>
                <span className="text-xs text-muted-foreground">credits</span>
              </div>
            )}

            {/* Mode Indicator */}
            {currentMode && user && (
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

            {/* Theme Toggle Button - Light/Dark quick switch */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={toggleLightDark}
            >
              {isDark ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : isLight ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <div 
                  className="h-5 w-5 rounded-full border border-border"
                  style={{ backgroundColor: themes.find(t => t.id === theme)?.color }}
                />
              )}
            </Button>

            {/* Theme Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-xs">
                  Theme
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Light/Dark Mode */}
                <DropdownMenuItem
                  onClick={() => setTheme('light')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Sun className="h-4 w-4" />
                  <span className="flex-1">Light Mode</span>
                  {theme === 'light' && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => setTheme('dark')}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Moon className="h-4 w-4" />
                  <span className="flex-1">Dark Mode</span>
                  {theme === 'dark' && <span className="text-primary">✓</span>}
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
                    {theme === t.id && <span className="text-primary">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile & Settings / Auth */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 cursor-pointer text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="flex items-center gap-2 cursor-pointer">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                )}
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
                {user && (
                  <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">{totalCredits} credits available</span>
                  </div>
                )}

                {/* Theme selector in mobile */}
                <div className="mt-2 flex items-center gap-2 px-4">
                  <span className="text-sm text-muted-foreground mr-2">Theme:</span>
                  <Button
                    variant={isLight ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="h-8"
                  >
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isDark ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="h-8"
                  >
                    <Moon className="h-4 w-4" />
                  </Button>
                  {themes.filter(t => !['light', 'dark'].includes(t.id)).map((t) => (
                    <Button
                      key={t.id}
                      variant={theme === t.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTheme(t.id)}
                      className="h-8 w-8 p-0"
                    >
                      <div 
                        className="h-4 w-4 rounded-full" 
                        style={{ backgroundColor: t.color }}
                      />
                    </Button>
                  ))}
                </div>

                {/* Auth in mobile */}
                <div className="mt-2">
                  {user ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-destructive"
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </Button>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                      <LogIn className="h-5 w-5" />
                      Sign In
                    </Link>
                  )}
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
