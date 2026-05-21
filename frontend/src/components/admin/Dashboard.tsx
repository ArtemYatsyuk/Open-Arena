import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

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
        const processedData = {
          ...data,
          last30Days: (data.last30Days || []).map((d: any) => ({
            date: new Date(d.date || d.createdAt).toLocaleDateString(),
            messages: Number(d.count || 0),
          })),
          topUsers: data.topUsers || [],
        };
        setStats(processedData);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Dashboard error:', e);
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-danger/5 rounded-2xl border border-danger/20">
          <p className="text-danger font-medium mb-2">Failed to load dashboard</p>
          <p className="text-text-secondary text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-danger text-white rounded-lg text-sm hover:bg-danger/90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const chartData = stats.last30Days.length > 0
    ? stats.last30Days
    : Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        messages: 0,
      }));

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'from-blue-500/10 to-blue-500/5' },
    { label: 'Active Today', value: stats.activeToday, icon: '🟢', color: 'from-green-500/10 to-green-500/5' },
    { label: 'Conversations', value: stats.totalConversations, icon: '💬', color: 'from-purple-500/10 to-purple-500/5' },
    { label: 'Messages Today', value: stats.messagesToday, icon: '️', color: 'from-orange-500/10 to-orange-500/5' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
        <p className="text-text-secondary text-sm">Overview of your Open Arena instance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} border border-border rounded-2xl p-5 hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-accent rounded-full" />
            Messages Activity (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C4FF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C4FF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#6C4FF6"
                strokeWidth={2}
                fill="url(#colorMessages)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full" />
            Top Active Users
          </h2>
          {stats.topUsers.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              <p className="text-3xl mb-2">👤</p>
              <p>No users yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topUsers.map((u, index) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 bg-bg-primary rounded-xl hover:bg-accent/5 transition"
                >
                  <span className="text-xs font-bold text-text-secondary w-5">#{index + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent">
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.username}</p>
                    <p className="text-xs text-text-secondary truncate">{u.email}</p>
                  </div>
                  <span className="text-xs font-semibold text-accent">{u._count.conversations}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
