import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface MainLayoutProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
}

export function MainLayout({ children, rightSidebar }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      <main className="flex-1 max-w-2xl border-r border-border">
        {children}
      </main>

      {rightSidebar && (
        <aside className="w-80 h-screen sticky top-0 p-4 space-y-4 overflow-y-auto hidden lg:block scrollbar-none flex-shrink-0">
          {rightSidebar}
        </aside>
      )}
    </div>
  );
}
