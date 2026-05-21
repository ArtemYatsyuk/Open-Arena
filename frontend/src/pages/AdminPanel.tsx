import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from '../components/admin/Dashboard';
import UsersTable from '../components/admin/UsersTable';
import UserDetail from '../components/admin/UserDetail';
import AddUser from '../components/admin/AddUser';
import ConversationsBrowser from '../components/admin/ConversationsBrowser';
import ConfigViewer from '../components/admin/ConfigViewer';

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [subNavOpen, setSubNavOpen] = useState(true);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/users/new', label: 'Add User', icon: '➕' },
    { path: '/admin/conversations', label: 'Conversations', icon: '💬' },
    { path: '/admin/config', label: 'Config', icon: '⚙' },
    { path: '/', label: '← Back to chat', icon: '' },
  ];

  return (
    <div className="flex h-screen bg-bg-primary">
      <div className={`w-56 bg-bg-secondary border-r border-border flex-shrink-0 ${subNavOpen ? '' : 'hidden'}`}>
        <div className="p-4 border-b border-border">
          <h1 className="text-heading font-medium">Admin Panel</h1>
        </div>
        <nav className="p-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition text-left ${
                location.pathname === item.path
                  ? 'bg-accent-light text-accent'
                  : 'hover:bg-bg-primary text-text-secondary'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

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
