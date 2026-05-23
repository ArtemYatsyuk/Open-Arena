import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isToday, isYesterday, subDays } from 'date-fns';
import {
  Building2,
  Pencil,
  Search,
  PanelLeftClose,
  MoreHorizontal,
  Trash2,
  Edit3,
  X,
  Settings,
  Layers,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SettingsModal from '@/components/ui/SettingsModal';

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  return `${Math.floor(diffDays / 30)}mo`;
}

export default function Sidebar() {
  const navigate = useNavigate();
  const conversations = useChatStore((s) => s.conversations);
  const currentConv = useChatStore((s) => s.currentConversation);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const updateConversation = useChatStore((s) => s.updateConversation);
  const user = useAuthStore((s) => s.user);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const filteredConversations = searchQuery
    ? conversations.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const groupConversations = () => {
    const today: typeof conversations = [];
    const yesterday: typeof conversations = [];
    const last7: typeof conversations = [];
    const older: typeof conversations = [];

    filteredConversations.forEach((c) => {
      const d = new Date(c.updatedAt);
      if (isToday(d)) today.push(c);
      else if (isYesterday(d)) yesterday.push(c);
      else if (d > subDays(new Date(), 7)) last7.push(c);
      else older.push(c);
    });

    return { today, yesterday, last7, older };
  };

  const groups = groupConversations();

  const handleNewChat = () => {
    navigate('/');
    useChatStore.getState().selectConversation('');
    useChatStore.setState({ currentConversation: null, messages: [] });
  };

  const startEdit = (conv: { id: string; title: string }) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const saveEdit = async (id: string) => {
    if (editTitle.trim()) {
      await updateConversation(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    setMenuOpenId(null);
    await deleteConversation(id);
  };

  const renderGroup = (title: string, items: typeof conversations) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-1">
        <h3 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 py-1.5">
          {title}
        </h3>
        {items.map((conv) => (
          <div
            key={conv.id}
            className={`group relative flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-all duration-150 text-sm ${
              currentConv?.id === conv.id
                ? 'bg-accent/10 ring-1 ring-accent/30'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => navigate('/c/' + conv.id)}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {editingId === conv.id ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => saveEdit(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(conv.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-full bg-background border border-border rounded-lg px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="truncate text-[13px]">{conv.title}</span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground/60 shrink-0">
              {formatRelativeTime(conv.updatedAt)}
            </span>
            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted/50 transition"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menuOpenId === conv.id && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-28 bg-popover border border-border rounded-lg shadow-xl p-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(conv);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md hover:bg-accent/50 transition text-left"
                    >
                      <Edit3 className="w-3 h-3" />
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(conv.id);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md hover:bg-destructive/10 hover:text-destructive transition text-left"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-sidebar w-full overflow-hidden">
      <div className="p-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sidebar-foreground" />
            <h1 className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Open Arena
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            title="Close sidebar"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-0.5">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-8 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={handleNewChat}
          >
            <Pencil className="w-4 h-4" />
            New Chat
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-8 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="w-4 h-4" />
            Search
          </Button>
        </div>
      </div>

      {searchOpen && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-8 pr-8 h-7 text-xs"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-3 h-3 text-muted-foreground/60" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1 min-h-0">
        <div className="px-3 py-1.5">
          <h3 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
            Chats
          </h3>
        </div>
        {renderGroup('Today', groups.today)}
        {renderGroup('Yesterday', groups.yesterday)}
        {renderGroup('Previous 7 days', groups.last7)}
        {renderGroup('Older', groups.older)}
      </div>

      <div className="p-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar
            className="h-8 w-8 cursor-pointer hover:opacity-80"
            onClick={() => setSettingsOpen(true)}
          >
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span
            className="text-sm font-medium truncate cursor-pointer hover:text-muted-foreground transition flex-1 text-sidebar-foreground"
            onClick={() => setSettingsOpen(true)}
          >
            {user?.username || 'Admin'}
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            {user?.role === 'ADMIN' && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => navigate('/admin')}
                title="Admin Panel"
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
              >
                <Layers className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
