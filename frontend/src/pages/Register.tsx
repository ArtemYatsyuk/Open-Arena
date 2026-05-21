import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const passwordScore = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const score = passwordScore(password);
  const scoreLabels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const scoreColors = ['bg-danger', 'bg-danger', 'bg-yellow-500', 'bg-success', 'bg-success'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-bg-primary">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-medium text-center mb-2">Create account</h1>
        <p className="text-text-secondary text-center text-sm mb-8">Join Open Arena</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-danger/10 text-danger text-sm rounded">{error}</div>
          )}
          <div>
            <label className="block text-ui text-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-input text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-input text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          <div>
            <label className="block text-ui text-text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-input text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition ${
                        i < score ? scoreColors[score - 1] : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-1">{scoreLabels[score - 1] || 'Too short'}</p>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent text-white rounded-pill text-sm font-medium hover:bg-accent-hover transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
