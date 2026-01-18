import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
  hideMobileNav?: boolean;
}

export function MainLayout({ children, rightSidebar, hideMobileNav = false }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      <main className={`flex-1 max-w-2xl border-r border-border ${isMobile && !hideMobileNav ? 'pb-20' : ''}`}>
        {children}
      </main>

      {rightSidebar && (
        <aside className="w-80 h-screen sticky top-0 p-4 space-y-4 overflow-y-auto hidden lg:block scrollbar-none flex-shrink-0">
          {rightSidebar}
        </aside>
      )}

      {isMobile && !hideMobileNav && <MobileBottomNav />}
    </div>
  );
}
