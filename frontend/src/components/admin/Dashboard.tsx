import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  totalUsers: number;
  activeToday: number;
  totalConversations: number;
  messagesToday: number;
  last30Days: { date: string; count: number }[];
  topUsers: { id: string; username: string; email: string; _count: { conversations: number } }[];
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

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson('/api/admin/stats')
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-text-secondary">Loading...</div>;
  if (error) return <div className="p-8 text-danger">{error}</div>;
  if (!stats) return <div className="p-8 text-danger">Failed to load stats</div>;

  const chartData = stats.last30Days.map((d) => ({
    date: new Date(d.date).toLocaleDateString(),
    messages: d.count,
  }));

  return (
    <div className="p-6">
      <h1 className="text-heading font-medium mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Active Today" value={stats.activeToday} />
        <StatCard label="Conversations" value={stats.totalConversations} />
        <StatCard label="Messages Today" value={stats.messagesToday} />
      </div>

      <div className="bg-bg-secondary border border-border rounded-card p-4 mb-8">
        <h2 className="text-sm font-medium mb-4">Messages (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="messages" stroke="#6C4FF6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-bg-secondary border border-border rounded-card p-4">
        <h2 className="text-sm font-medium mb-4">Top Active Users</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-secondary border-b border-border">
              <th className="text-left py-2 px-3">Username</th>
              <th className="text-left py-2 px-3">Email</th>
              <th className="text-right py-2 px-3">Conversations</th>
            </tr>
          </thead>
          <tbody>
            {stats.topUsers.map((u) => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="py-2 px-3">{u.username}</td>
                <td className="py-2 px-3 text-text-secondary">{u.email}</td>
                <td className="py-2 px-3 text-right">{u._count.conversations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-card p-4">
      <p className="text-ui text-text-secondary">{label}</p>
      <p className="text-2xl font-medium mt-1">{value.toLocaleString()}</p>
    </div>
  );
}
