import {
  Home,
  Search,
  Bell,
  User,
  Settings,
  Sparkles,
  TrendingUp,
  LayoutDashboard,
  Wallet,
  LogOut,
  Trophy,
  Megaphone,
  Users,
  Store,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/feed' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Users, label: 'Communities', path: '/explore?tab=community' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Megaphone, label: 'Ads', path: '/ads' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Store, label: 'E-Store', path: '/store' },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center gold-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Herald
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-full text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-lg"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-bold"
              >
                <item.icon className="w-6 h-6" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Post Button */}
        <Button variant="gold" className="w-full mt-4 py-6 text-lg font-bold rounded-full">
          Post
        </Button>
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <div className="flex items-center justify-between px-4 py-2">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 text-sidebar-foreground hover:text-sidebar-primary transition-colors"
            activeClassName="text-sidebar-primary"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
          <ThemeToggle />
        </div>
        {user && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
