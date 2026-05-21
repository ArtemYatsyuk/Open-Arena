import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface UserDetail {
  id: string;
  email: string;
  username: string;
  role: string;
  isBanned: boolean;
  banReason?: string;
  createdAt: string;
  lastActiveAt?: string;
  avatarColor: string;
  messageCount: number;
  _count: { conversations: number };
}

interface Conversation {
  id: string;
  title: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  messages: { role: string; content: string; createdAt: string }[];
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [banReason, setBanReason] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/users/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, [id]);

  const loadConversations = async () => {
    if (!id) return;
    const res = await fetch(`/api/admin/users/${id}/conversations`, { credentials: 'include' });
    const data = await res.json();
    setConversations(data);
  };

  if (loading) return <div className="p-8 text-text-secondary">Loading...</div>;
  if (!user) return <div className="p-8 text-danger">User not found</div>;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/admin/users')}
        className="text-sm text-accent hover:underline mb-4 inline-block"
      >
        ← Back to users
      </button>

      <div className="bg-bg-secondary border border-border rounded-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-medium flex-shrink-0"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-heading font-medium">{user.username}</h2>
            <p className="text-text-secondary text-sm">{user.email}</p>
            <div className="flex gap-4 mt-3 text-sm">
              <span>
                Role:{' '}
                <select
                  value={user.role}
                  onChange={async (e) => {
                    await fetch(`/api/admin/users/${user.id}/role`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ role: e.target.value }),
                      credentials: 'include',
                    });
                    setUser({ ...user, role: e.target.value });
                  }}
                  className="bg-bg-primary border border-border rounded-input px-2 py-0.5 text-sm"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </span>
              <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
              <span>Last active: {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}</span>
            </div>
            <div className="flex gap-4 mt-2 text-sm text-text-secondary">
              <span>{user._count.conversations} conversations</span>
              <span>{user.messageCount} messages</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (user.isBanned) {
                  fetch(`/api/admin/users/${user.id}/ban`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ban: false }),
                    credentials: 'include',
                  }).then(() => setUser({ ...user, isBanned: false, banReason: undefined }));
                } else {
                  setShowBanModal(true);
                }
              }}
              className={`px-4 py-2 text-sm rounded-pill transition ${
                user.isBanned
                  ? 'bg-success/10 text-success hover:bg-success/20'
                  : 'bg-danger/10 text-danger hover:bg-danger/20'
              }`}
            >
              {user.isBanned ? 'Unban' : 'Ban'}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm bg-danger/10 text-danger rounded-pill hover:bg-danger/20 transition"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={loadConversations}
          className="px-4 py-2 text-sm bg-bg-secondary border border-border rounded-pill hover:border-accent/50 transition"
        >
          View all conversations
        </button>
      </div>

      {conversations.length > 0 && (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div key={conv.id} className="bg-bg-secondary border border-border rounded-card overflow-hidden">
              <button
                onClick={() => setExpandedConv(expandedConv === conv.id ? null : conv.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-bg-primary/50 transition"
              >
                <div>
                  <p className="text-sm font-medium">{conv.title}</p>
                  <p className="text-xs text-text-secondary">
                    {conv.modelId} · {conv.messages.length} messages · {new Date(conv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span>{expandedConv === conv.id ? '▲' : '▼'}</span>
              </button>
              {expandedConv === conv.id && (
                <div className="p-4 border-t border-border space-y-3 max-h-96 overflow-y-auto">
                  {conv.messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-card text-sm ${
                          msg.role === 'user'
                            ? 'bg-accent-light text-text-primary'
                            : 'bg-bg-primary border border-border'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-primary border border-border rounded-card p-6 w-96">
            <h3 className="text-heading font-medium mb-4">Ban User</h3>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Ban reason..."
              className="w-full p-3 bg-bg-secondary border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent mb-4"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowBanModal(false)}
                className="px-4 py-2 text-sm bg-bg-secondary border border-border rounded-pill hover:border-accent/50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await fetch(`/api/admin/users/${user.id}/ban`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ban: true, reason: banReason }),
                    credentials: 'include',
                  });
                  setUser({ ...user, isBanned: true, banReason });
                  setShowBanModal(false);
                }}
                className="px-4 py-2 text-sm bg-danger text-white rounded-pill hover:opacity-90 transition"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-primary border border-border rounded-card p-6 w-96">
            <h3 className="text-heading font-medium mb-2">Delete Account</h3>
            <p className="text-sm text-text-secondary mb-4">
              Type <strong>{user.username}</strong> to confirm deletion.
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full p-3 bg-bg-secondary border border-border rounded-input text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent mb-4"
              placeholder={user.username}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm bg-bg-secondary border border-border rounded-pill hover:border-accent/50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirm === user.username) {
                    await fetch(`/api/admin/users/${user.id}`, {
                      method: 'DELETE',
                      credentials: 'include',
                    });
                    navigate('/admin/users');
                  }
                }}
                disabled={deleteConfirm !== user.username}
                className="px-4 py-2 text-sm bg-danger text-white rounded-pill hover:opacity-90 transition disabled:opacity-30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
