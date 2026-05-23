import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, Filter, ArrowLeft } from 'lucide-react';
import Dashboard from '@/components/admin/Dashboard';
import UsersTable from '@/components/admin/UsersTable';
import UserDetail from '@/components/admin/UserDetail';
import ConversationsBrowser from '@/components/admin/ConversationsBrowser';
import ConfigViewer from '@/components/admin/ConfigViewer';
import FiltersManager from '@/components/admin/FiltersManager';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: '/admin/users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    {
      path: '/admin/conversations',
      label: 'Conversations',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    { path: '/admin/config', label: 'Config', icon: <Settings className="h-5 w-5" /> },
    { path: '/admin/filters', label: 'Filters', icon: <Filter className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-sidebar border-r border-sidebar-border shrink-0 flex flex-col">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted ring-1 ring-border flex items-center justify-center">
              <img src="/favicon.png" alt="Open Arena" className="w-8 h-8 rounded-lg" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-sidebar-foreground">Admin Panel</h1>
              <p className="text-xs text-sidebar-foreground/60">Manage your instance</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 text-left',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium ring-1 ring-sidebar-ring'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full justify-start gap-3 h-9 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to chat
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersTable />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/conversations" element={<ConversationsBrowser />} />
          <Route path="/conversations/:id" element={<ConversationsBrowser />} />
          <Route path="/config" element={<ConfigViewer />} />
          <Route path="/filters" element={<FiltersManager />} />
        </Routes>
      </div>
    </div>
  );
}
