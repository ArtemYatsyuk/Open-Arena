import { useState, useEffect } from 'react';

interface Conversation {
  id: string;
  title: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  user: { username: string; email: string };
  _count: { messages: number };
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

export default function ConversationsBrowser() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), search });
      const data = await fetchJson(`/api/admin/conversations?${params}`);
      setConversations(data.conversations);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [page, search]);

  const loadMessages = async (conv: Conversation) => {
    setSelectedConv(conv);
    try {
      const data = await fetchJson(`/api/conversations/${conv.id}/messages`);
      setMessages(data);
    } catch (e: any) {
      console.error('Failed to load messages:', e);
    }
  };

  if (loading) return <div className="p-8 text-text-secondary">Loading...</div>;
  if (error) return <div className="p-8 text-danger">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-heading font-medium mb-6">Conversations</h1>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by title or username..."
          className="px-3 py-2 bg-bg-secondary border border-border rounded-input text-sm text-text-primary w-80 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="bg-bg-secondary border border-border rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-secondary border-b border-border">
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Model</th>
              <th className="text-left p-3">Messages</th>
              <th className="text-left p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((conv) => (
              <tr
                key={conv.id}
                onClick={() => loadMessages(conv)}
                className="border-b border-border/50 hover:bg-bg-primary/50 cursor-pointer"
              >
                <td className="p-3 font-medium">{conv.title}</td>
                <td className="p-3 text-text-secondary">{conv.user.username}</td>
                <td className="p-3 text-text-secondary">{conv.modelId}</td>
                <td className="p-3">{conv._count.messages}</td>
                <td className="p-3 text-text-secondary">{new Date(conv.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-text-secondary">Page {page} of {totalPages}</p>
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

      {selectedConv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8" onClick={() => setSelectedConv(null)}>
          <div className="bg-bg-primary border border-border rounded-card w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-heading font-medium">{selectedConv.title}</h3>
                <p className="text-xs text-text-secondary">
                  {selectedConv.user.username} · {selectedConv.modelId}
                </p>
              </div>
              <button
                onClick={() => setSelectedConv(null)}
                className="p-2 hover:bg-bg-secondary rounded transition"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-card text-sm ${
                      msg.role === 'user'
                        ? 'bg-accent-light text-text-primary'
                        : 'bg-bg-secondary border border-border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
