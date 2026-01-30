import { TopNavbar } from './TopNavbar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  hideNavbar?: boolean;
}

export function MainLayout({ children, className, hideNavbar = false }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {!hideNavbar && <TopNavbar />}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        className
      )}>
        {children}
      </main>
    </div>
  );
}
