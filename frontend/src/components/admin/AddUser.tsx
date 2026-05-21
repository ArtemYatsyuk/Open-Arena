import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddUser() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-heading font-medium mb-6">Add User</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger/10 text-danger text-sm rounded">{error}</div>
        )}
        {success && (
          <div className="p-3 bg-success/10 text-success text-sm rounded">User created successfully!</div>
        )}

        <div>
          <label className="block text-ui text-text-secondary mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>
        <div>
          <label className="block text-ui text-text-secondary mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="^[a-zA-Z0-9_]+$"
            minLength={3}
            maxLength={30}
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>
        <div>
          <label className="block text-ui text-text-secondary mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>
        <div>
          <label className="block text-ui text-text-secondary mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-accent text-white rounded-pill text-sm font-medium hover:bg-accent-hover transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </div>
  );
}
