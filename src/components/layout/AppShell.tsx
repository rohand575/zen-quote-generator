import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Menu, 
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService, AuthUser } from '@/lib/auth';
import { toast } from 'sonner';

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Quotations', path: '/quotations' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Package, label: 'Items', path: '/items' },
];

export const AppShell = ({ children }: AppShellProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    authService.getUser().then(setUser);
  }, []);

  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(async () => {
        try {
          await authService.signOut();
          toast.info('Logged out after 5 minutes of inactivity');
        } catch (error) {
          toast.error('Session expired. Please sign in again.');
        } finally {
          navigate('/login');
        }
      }, IDLE_TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--navy-dark))] via-[hsl(var(--background))] to-[hsl(var(--navy))] text-foreground">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-primary/40 flex items-center justify-between px-4 z-50 shadow-lg bg-[linear-gradient(120deg,hsl(var(--navy-dark)),hsl(var(--navy)))] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 border border-white/20 shadow-md">
            <img src="/zen-logo.png" alt="Zen Engineering logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-primary-foreground font-heading font-bold text-lg tracking-tight">Zen Engineering</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-primary-foreground hover:bg-primary/90"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 text-sidebar-foreground shadow-2xl border-r border-sidebar-border/60
          bg-[linear-gradient(180deg,hsl(var(--navy-dark))_0%,hsl(var(--background))_70%)]
          transform transition-transform duration-300 ease-in-out z-40
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border/50">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/20 shadow-lg">
              <img src="/zen-logo.png" alt="Zen Engineering logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg tracking-tight">Zen Engineering</h1>
              <p className="text-xs text-sidebar-foreground/80">Quotation Manager</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3.5 rounded-xl 
                        transition-all duration-300 group
                        ${isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-lg scale-105' 
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground hover:scale-105'
                        }
                      `}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border/50">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <p className="text-sm font-semibold">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-sidebar-foreground/80">{user?.email || ''}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 border-sidebar-border/50 text-sidebar-foreground hover:bg-sidebar-accent hover:scale-105 transition-all duration-300 shadow-md"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen bg-[radial-gradient(circle_at_20%_20%,hsl(var(--navy-light))_0%,transparent_35%),radial-gradient(circle_at_80%_0%,hsl(var(--navy))_0%,transparent_30%)]">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
