import { ChronoSidebar } from './ChronoSidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <ChronoSidebar />
      <main className={cn(
        "ml-64 min-h-screen transition-all duration-300",
        // Responsive adjustment handled by sidebar state
        className
      )}>
        {children}
      </main>
    </div>
  );
}
