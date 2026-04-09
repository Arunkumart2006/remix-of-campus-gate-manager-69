import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { useLateStudentChecker } from '@/hooks/useLateStudentChecker';
import {
  LayoutDashboard,
  Bus,
  FileCheck,
  Users,
  Search,
  LogOut,
  Menu,
  X,
  Shield,
  Sun,
  Moon,
  UserPlus,
  Crown,
  GraduationCap,
  Briefcase,
  Eye,
  ChevronRight,
  CreditCard,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import AIChat from '@/components/AIChat';

type NavItem = { path: string; label: string; icon: typeof LayoutDashboard; roles?: AppRole[] };

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['md', 'principal', 'hod', 'staff', 'watchman'] },
  { path: '/student-dashboard', label: 'My Dashboard', icon: LayoutDashboard, roles: ['student'] },
  { path: '/manage-accounts', label: 'Manage Accounts', icon: UserPlus, roles: ['admin', 'md', 'principal', 'hod', 'staff'] },
  { path: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin'] },
  { path: '/outpass', label: 'Outpass', icon: FileCheck, roles: ['md', 'principal', 'hod', 'staff', 'watchman'] },
  { path: '/bus-entry', label: 'Bus Entry', icon: Bus, roles: ['watchman'] },
  { path: '/visitors', label: 'Visitors', icon: Users, roles: ['watchman'] },
  { path: '/records', label: 'Records', icon: Search, roles: ['md', 'principal', 'hod', 'staff', 'watchman'] },
  { path: '/profile', label: 'Profile', icon: UserIcon },
];

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  md: 'MD',
  principal: 'Principal',
  hod: 'HOD',
  staff: 'Staff',
  student: 'Student',
  watchman: 'Watchman',
};

const roleIcons: Record<string, typeof Crown> = {
  admin: Shield,
  md: Crown,
  principal: GraduationCap,
  hod: Briefcase,
  staff: Users,
  student: GraduationCap,
  watchman: Eye,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useLateStudentChecker();
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => !item.roles || (role && item.roles.includes(role)));
  const RoleIcon = role ? roleIcons[role] || Shield : Shield;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 md:hidden backdrop-blur-xl border-b border-sidebar-border" style={{ background: 'var(--gradient-sidebar)' }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-sidebar-foreground p-1 rounded-lg hover:bg-sidebar-accent transition-colors">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <h1 className="font-display text-lg font-bold text-sidebar-foreground tracking-tight">Smart Campus</h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={() => setDark(!dark)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors p-1 rounded-lg hover:bg-sidebar-accent">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col transition-transform duration-300 md:relative md:translate-x-0 border-r border-sidebar-border',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}>
            <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-sidebar-foreground tracking-tight">Smart Campus</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/35">Management System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 mt-2">
          {filteredNav.map((item, i) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-primary)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight className="relative z-10 ml-auto h-4 w-4 opacity-60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl px-3.5 py-2">
            <NotificationBell />
            <span className="text-sm font-medium text-sidebar-foreground/55">Notifications</span>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-sidebar-foreground/55 transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* User card */}
          <div className="rounded-2xl bg-sidebar-accent/40 backdrop-blur-sm p-3.5 border border-sidebar-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20 bg-muted shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sidebar-foreground/30">
                    <UserIcon size={20} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">{profile?.full_name || user?.email}</p>
                {profile?.institute && <p className="text-[10px] text-sidebar-foreground/40 truncate">{profile.institute}</p>}
              </div>
            </div>
            {profile?.department && <p className="text-[11px] text-sidebar-foreground/40 truncate mb-1">{profile.department}</p>}
            <div className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ background: 'var(--gradient-primary)', color: 'white', boxShadow: '0 2px 8px hsl(245 58% 51% / 0.3)' }}>
              <RoleIcon size={10} />
              {roleLabels[role || ''] || 'No role'}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start gap-2 text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive rounded-xl"
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="container max-w-6xl py-8 px-4 md:px-8">{children}</div>
      </main>

      {/* Global AI Assistant */}
      <AIChat />
    </div>
  );
}
