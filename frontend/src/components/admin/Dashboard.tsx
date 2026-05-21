import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Users, Activity, MessageSquare, Pencil, BarChart3, UserX } from 'lucide-react';

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
          <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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

  const hasData = stats.last30Days.length > 0 || stats.messagesToday > 0;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-6 h-6 text-blue-500" />, color: 'from-blue-500/10 to-blue-500/5' },
    { label: 'Active Today', value: stats.activeToday, icon: <Activity className="w-6 h-6 text-green-500" />, color: 'from-green-500/10 to-green-500/5' },
    { label: 'Conversations', value: stats.totalConversations, icon: <MessageSquare className="w-6 h-6 text-purple-500" />, color: 'from-purple-500/10 to-purple-500/5' },
    { label: 'Messages Today', value: stats.messagesToday, icon: <Pencil className="w-6 h-6 text-orange-500" />, color: 'from-orange-500/10 to-orange-500/5' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
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
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 flex items-center justify-center">
                {card.icon}
              </div>
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-4xl font-bold">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-accent rounded-full" />
            Messages Activity (Last 30 Days)
          </h2>
          {hasData ? (
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
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'auto']} tickCount={5} />
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
                  dot={{ r: 4, fill: '#6C4FF6' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BarChart3 className="w-12 h-12 text-text-secondary/50 mb-3" />
              <p className="text-text-secondary text-sm mb-1">No message activity yet</p>
              <p className="text-text-secondary/70 text-xs">Data will appear once users start sending messages</p>
            </div>
          )}
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full" />
            Top Active Users
          </h2>
          {stats.topUsers.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              <UserX className="w-12 h-12 text-text-secondary/50 mx-auto mb-2" />
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
