import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  Ban,
  CheckCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  Mail,
  User,
  Lock,
  Shield,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
  isBanned: boolean;
  banReason?: string;
  createdAt: string;
  lastActiveAt?: string;
  avatarColor: string;
  _count: { conversations: number };
}

async function fetchJson(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: `Server error: ${res.status}` };
    }
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}

function AddUserForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, role }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }
      setSuccess(true);
      setEmail('');
      setUsername('');
      setPassword('');
      setRole('USER');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger/10 text-danger text-sm rounded-xl border border-danger/20 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-success/10 text-success text-sm rounded-xl border border-success/20">
            User created successfully!
          </div>
        )}

        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              pattern="^[a-zA-Z0-9_]+$"
              minLength={3}
              maxLength={30}
              className="w-full pl-10 pr-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full pl-10 pr-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">Role</label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
              className="w-full pl-10 pr-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition disabled:opacity-50 shadow-lg shadow-accent/20"
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </div>
  );
}

export default function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState<'users' | 'add'>('users');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), search });
      const data = await fetchJson(`/api/admin/users?${params}`);
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.length === users.length ? [] : users.map((u) => u.id)));
  };

  const bulkAction = async (action: 'ban' | 'delete') => {
    try {
      for (const id of selected) {
        if (action === 'ban') {
          await fetchJson(`/api/admin/users/${id}/ban`, {
            method: 'PATCH',
            body: JSON.stringify({ ban: true, reason: 'Bulk ban' }),
          });
        } else {
          await fetchJson(`/api/admin/users/${id}`, { method: 'DELETE' });
        }
      }
      setSelected([]);
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const exportCSV = () => {
    const headers = 'ID,Username,Email,Role,Status,Joined\n';
    const rows = users
      .map(
        (u) =>
          `${u.id},${u.username},${u.email},${u.role},${u.isBanned ? 'Banned' : 'Active'},${u.createdAt}`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
  };

  const getStatus = (u: AdminUser) => {
    if (u.isBanned) return { label: 'Banned', color: 'text-danger' };
    if (u.lastActiveAt && new Date(u.lastActiveAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      return { label: 'Active', color: 'text-success' };
    return { label: 'Inactive', color: 'text-text-secondary' };
  };

  return (
    <div className="p-6 animate-fadeIn">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            tab === 'users'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          All Users
        </button>
        <button
          onClick={() => setTab('add')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
            tab === 'add'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {tab === 'users' ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">Users</h1>
            <div className="flex gap-2">
              {selected.length > 0 && (
                <>
                  <button
                    onClick={() => bulkAction('ban')}
                    className="px-3 py-1.5 text-sm bg-danger/10 text-danger rounded-xl hover:bg-danger/20 transition flex items-center gap-1.5"
                  >
                    <Ban className="w-4 h-4" />
                    Ban ({selected.length})
                  </button>
                  <button
                    onClick={() => bulkAction('delete')}
                    className="px-3 py-1.5 text-sm bg-danger/10 text-danger rounded-xl hover:bg-danger/20 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selected.length})
                  </button>
                </>
              )}
              <button
                onClick={exportCSV}
                className="px-3 py-1.5 text-sm bg-bg-secondary border border-border rounded-xl hover:border-accent/50 transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search users..."
                className="w-full pl-10 pr-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-text-secondary text-center">Loading...</div>
          ) : error ? (
            <div className="p-8 text-danger">{error}</div>
          ) : (
            <>
              <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-secondary border-b border-border">
                      <th className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.length === users.length}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="text-left p-3">Username</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Joined</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const status = getStatus(u);
                      return (
                        <tr key={u.id} className="border-b border-border/50 hover:bg-bg-primary/50">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selected.includes(u.id)}
                              onChange={() => toggleSelect(u.id)}
                            />
                          </td>
                          <td className="p-3">{u.username}</td>
                          <td className="p-3 text-text-secondary">{u.email}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                u.role === 'ADMIN'
                                  ? 'bg-accent/20 text-accent'
                                  : 'bg-bg-primary text-text-secondary'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className={`p-3 ${status.color}`}>{status.label}</td>
                          <td className="p-3 text-text-secondary">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => navigate(`/admin/users/${u.id}`)}
                                className="px-2 py-1 text-xs bg-bg-primary border border-border rounded-lg hover:border-accent/50 transition flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
                              <button
                                onClick={async () => {
                                  await fetchJson(`/api/admin/users/${u.id}/ban`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({
                                      ban: !u.isBanned,
                                      reason: 'Banned by admin',
                                    }),
                                  });
                                  fetchUsers();
                                }}
                                className={`px-2 py-1 text-xs rounded-lg transition flex items-center gap-1 ${
                                  u.isBanned
                                    ? 'bg-success/10 text-success hover:bg-success/20'
                                    : 'bg-danger/10 text-danger hover:bg-danger/20'
                                }`}
                              >
                                {u.isBanned ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <Ban className="w-3 h-3" />
                                )}
                                {u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-text-secondary">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm bg-bg-secondary border border-border rounded-xl disabled:opacity-30 hover:border-accent/50 transition flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm bg-bg-secondary border border-border rounded-xl disabled:opacity-30 hover:border-accent/50 transition flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Add User</h1>
              <p className="text-sm text-text-secondary">Create a new user account</p>
            </div>
          </div>
          <AddUserForm />
        </div>
      )}
    </div>
  );
}
