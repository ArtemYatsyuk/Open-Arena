import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, MessageSquare, Settings, ArrowLeft } from 'lucide-react';
import Dashboard from '../components/admin/Dashboard';
import UsersTable from '../components/admin/UsersTable';
import UserDetail from '../components/admin/UserDetail';
import AddUser from '../components/admin/AddUser';
import ConversationsBrowser from '../components/admin/ConversationsBrowser';
import ConfigViewer from '../components/admin/ConfigViewer';

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: '/admin/users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    { path: '/admin/users/new', label: 'Add User', icon: <UserPlus className="h-5 w-5" /> },
    { path: '/admin/conversations', label: 'Conversations', icon: <MessageSquare className="h-5 w-5" /> },
    { path: '/admin/config', label: 'Config', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Sidebar */}
      <div className="w-64 bg-bg-secondary border-r border-border flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-white text-sm font-bold">OA</span>
            </div>
            <div>
              <h1 className="text-base font-semibold">Admin Panel</h1>
              <p className="text-xs text-text-secondary">Manage your instance</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-accent/10 text-accent font-medium ring-2 ring-accent/30'
                    : 'text-text-secondary hover:bg-bg-primary/60 hover:text-text-primary hover:translate-x-1'
                }`}
              >
                <span className={isActive ? 'text-accent' : ''}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-text-secondary hover:bg-bg-primary/60 hover:text-text-primary transition"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to chat
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersTable />} />
          <Route path="/users/new" element={<AddUser />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/conversations" element={<ConversationsBrowser />} />
          <Route path="/config" element={<ConfigViewer />} />
        </Routes>
      </div>
    </div>
  );
}
