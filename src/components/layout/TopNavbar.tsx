import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
import { useTheme } from '@/contexts/ThemeContext';
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
} from '@/components/ui/dropdown-menu';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNavItems: NavItem[] = [
  { icon: GraduationCap, label: 'Teaching', href: '/teaching' },
  { icon: BookOpen, label: 'Learning', href: '/learning' },
  { icon: Coins, label: 'Credits', href: '/credits' },
  { icon: History, label: 'Sessions', href: '/sessions' },
];

export function TopNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [totalCredits, setTotalCredits] = useState(0);
  const { theme, toggleTheme, isDark } = useTheme();
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

  const visibleNavItems = mainNavItems;

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
            {visibleNavItems.map((item) => {
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

            {/* Theme Toggle Button - Sunset Dark/Light */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleTheme}
            >
              {isDark ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>

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
                {visibleNavItems.map((item) => {
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

                {/* Theme toggle in mobile */}
                <div className="mt-2 flex items-center gap-2 px-4">
                  <span className="text-sm text-muted-foreground mr-2">Theme:</span>
                  <Button
                    variant={!isDark ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => toggleTheme()}
                    className="h-8 gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={isDark ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => toggleTheme()}
                    className="h-8 gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
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
