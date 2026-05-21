import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isToday, isYesterday, subDays } from 'date-fns';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import SettingsModal from '../ui/SettingsModal';

export default function Sidebar() {
  const navigate = useNavigate();
  const conversations = useChatStore((s) => s.conversations);
  const currentConv = useChatStore((s) => s.currentConversation);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const updateConversation = useChatStore((s) => s.updateConversation);
  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const groupConversations = () => {
    const starred = conversations.filter((c) => c.isStarred);
    const today: typeof conversations = [];
    const yesterday: typeof conversations = [];
    const last7: typeof conversations = [];
    const older: typeof conversations = [];

    conversations.forEach((c) => {
      const d = new Date(c.updatedAt);
      if (isToday(d)) today.push(c);
      else if (isYesterday(d)) yesterday.push(c);
      else if (d > subDays(new Date(), 7)) last7.push(c);
      else older.push(c);
    });

    return { starred, today, yesterday, last7, older };
  };

  const groups = groupConversations();

  const handleNewChat = () => {
    useChatStore.getState().selectConversation('');
    useChatStore.setState({ currentConversation: null, messages: [] });
  };

  const startEdit = (conv: any) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveEdit = async (id: string) => {
    if (editTitle.trim()) {
      await updateConversation(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const renderGroup = (title: string, items: typeof conversations) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider px-3 py-1">{title}</h3>
        {items.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-all duration-150 text-sm ${
              currentConv?.id === conv.id
                ? 'bg-accent/10 text-accent'
                : 'hover:bg-bg-primary/60'
            }`}
            onClick={() => selectConversation(conv.id)}
          >
            <div className="flex-1 min-w-0">
              {editingId === conv.id ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => saveEdit(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(conv.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-full bg-bg-primary border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  autoFocus
                />
              ) : (
                <p className="truncate font-medium">{conv.title}</p>
              )}
            </div>
            <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateConversation(conv.id, { isStarred: !conv.isStarred });
                }}
                className="p-1 hover:text-accent transition text-xs"
                title={conv.isStarred ? 'Unstar' : 'Star'}
              >
                {conv.isStarred ? '★' : '☆'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(conv);
                }}
                className="p-1 hover:text-accent transition text-xs"
                title="Rename"
              >
                ✎
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="p-1 hover:text-danger transition text-xs"
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary w-full overflow-hidden">
      <div className="p-4 border-b border-border flex-shrink-0">
        <h1 className="text-lg font-semibold mb-3 tracking-tight">Open Arena</h1>
        <button
          onClick={handleNewChat}
          className="w-full py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-all duration-150 shadow-sm"
        >
          + New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        {renderGroup('Starred', groups.starred)}
        {renderGroup('Today', groups.today)}
        {renderGroup('Yesterday', groups.yesterday)}
        {renderGroup('Last 7 days', groups.last7)}
        {renderGroup('Older', groups.older)}
      </div>

      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm cursor-pointer hover:opacity-80 transition"
            style={{ backgroundColor: user?.avatarColor || '#6C4FF6' }}
            onClick={() => setSettingsOpen(true)}
          >
            {user?.username?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-xs text-text-secondary truncate">{user?.email}</p>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-bg-primary rounded-lg transition text-accent"
                title="Admin Panel"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-bg-primary rounded-lg transition"
              title="Settings"
            >
              ⚙
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 hover:bg-bg-primary rounded-lg transition"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-bg-primary rounded-lg transition"
              title="Close sidebar"
            >
              ◀
            </button>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
