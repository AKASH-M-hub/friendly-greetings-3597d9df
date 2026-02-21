import { ZeroCreditRecovery } from '@/components/credits/ZeroCreditRecovery';
import { TopNavbar } from '@/components/layout/TopNavbar';

export default function Recovery() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <TopNavbar />
      <ZeroCreditRecovery />
    </div>
  );
}
