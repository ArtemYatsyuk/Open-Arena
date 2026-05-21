import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

export default function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), search });
    fetch(`/api/admin/users?${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.length === users.length ? [] : users.map((u) => u.id)));
  };

  const bulkAction = async (action: 'ban' | 'delete') => {
    for (const id of selected) {
      if (action === 'ban') {
        await fetch(`/api/admin/users/${id}/ban`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ban: true, reason: 'Bulk ban' }),
          credentials: 'include',
        });
      } else {
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
      }
    }
    setSelected([]);
    fetchUsers();
  };

  const exportCSV = () => {
    const headers = 'ID,Username,Email,Role,Status,Joined\n';
    const rows = users
      .map((u) => `${u.id},${u.username},${u.email},${u.role},${u.isBanned ? 'Banned' : 'Active'},${u.createdAt}`)
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

  if (loading) return <div className="p-8 text-text-secondary">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading font-medium">Users</h1>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <>
              <button
                onClick={() => bulkAction('ban')}
                className="px-3 py-1.5 text-sm bg-danger/10 text-danger rounded-pill hover:bg-danger/20 transition"
              >
                Ban Selected ({selected.length})
              </button>
              <button
                onClick={() => bulkAction('delete')}
                className="px-3 py-1.5 text-sm bg-danger/10 text-danger rounded-pill hover:bg-danger/20 transition"
              >
                Delete Selected ({selected.length})
              </button>
            </>
          )}
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 text-sm bg-bg-secondary border border-border rounded-pill hover:border-accent/50 transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search users..."
          className="px-3 py-2 bg-bg-secondary border border-border rounded-input text-sm text-text-primary w-64 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="bg-bg-secondary border border-border rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-secondary border-b border-border">
              <th className="p-3">
                <input type="checkbox" checked={selected.length === users.length} onChange={toggleAll} />
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
                        u.role === 'ADMIN' ? 'bg-accent/20 text-accent' : 'bg-bg-primary text-text-secondary'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className={`p-3 ${status.color}`}>{status.label}</td>
                  <td className="p-3 text-text-secondary">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        className="px-2 py-1 text-xs bg-bg-primary border border-border rounded hover:border-accent/50 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/users/${u.id}/ban`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ban: !u.isBanned, reason: 'Banned by admin' }),
                            credentials: 'include',
                          });
                          fetchUsers();
                        }}
                        className={`px-2 py-1 text-xs rounded transition ${
                          u.isBanned
                            ? 'bg-success/10 text-success hover:bg-success/20'
                            : 'bg-danger/10 text-danger hover:bg-danger/20'
                        }`}
                      >
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
            className="px-3 py-1.5 text-sm bg-bg-secondary border border-border rounded-pill disabled:opacity-30 hover:border-accent/50 transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm bg-bg-secondary border border-border rounded-pill disabled:opacity-30 hover:border-accent/50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
