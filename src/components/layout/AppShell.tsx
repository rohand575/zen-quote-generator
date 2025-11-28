import { useState, useEffect } from 'react';
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
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    authService.getUser().then(setUser);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-light via-background to-neutral-light">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 premium-gradient-bg border-b border-primary/20 flex items-center justify-between px-4 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 premium-gradient-accent rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-base">Z</span>
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
          fixed top-0 left-0 h-full w-64 premium-gradient-bg text-sidebar-foreground shadow-2xl
          transform transition-transform duration-300 ease-in-out z-40
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border/50">
            <div className="w-11 h-11 premium-gradient-accent rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">Z</span>
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
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground hover:scale-105'
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
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
