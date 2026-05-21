import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatLayout from './pages/ChatLayout';
import AdminPanel from './pages/AdminPanel';
import BannedPage from './pages/BannedPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <div className="flex items-center justify-center h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <div className="flex items-center justify-center h-screen" />;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/banned" element={<BannedPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/c/:id"
        element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
