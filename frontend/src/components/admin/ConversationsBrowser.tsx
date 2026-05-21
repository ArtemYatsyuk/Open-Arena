import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Search, MessageSquare, ChevronLeft, ChevronRight, ArrowLeft, User, Calendar, Cpu, Copy, Check } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  user: { username: string; email: string };
  _count: { messages: number };
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
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
  const { id: urlConvId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

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
    navigate(`/admin/conversations/${conv.id}`, { replace: true });
    setMessagesLoading(true);
    try {
      const data = await fetchJson(`/api/admin/conversations/${conv.id}/messages`);
      setMessages(data);
    } catch (e: any) {
      console.error('Failed to load messages:', e);
    }
    setMessagesLoading(false);
  };

  useEffect(() => {
    if (urlConvId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === urlConvId);
      if (conv) {
        setSelectedConv(conv);
        setMessagesLoading(true);
        fetchJson(`/api/admin/conversations/${conv.id}/messages`)
          .then(setMessages)
          .catch(console.error)
          .finally(() => setMessagesLoading(false));
      }
    }
  }, [urlConvId, conversations]);

  const closeDetail = () => {
    setSelectedConv(null);
    setMessages([]);
    navigate('/admin/conversations', { replace: true });
  };

  return (
    <div className="flex h-full">
      {/* List panel */}
      <div className={`flex flex-col border-r border-border ${selectedConv ? 'w-1/2 min-w-0' : 'w-full'} p-6 overflow-y-auto animate-fadeIn`}>
        <h1 className="text-xl font-semibold mb-6">Conversations</h1>

        <div className="mb-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title or username..."
              className="w-full pl-10 pr-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-text-secondary text-center">Loading...</div>
        ) : error ? (
          <div className="p-8 text-danger">{error}</div>
        ) : (
          <>
            <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
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
                  {conversations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary">No conversations found</td>
                    </tr>
                  ) : (
                    conversations.map((conv) => (
                      <tr
                        key={conv.id}
                        onClick={() => loadMessages(conv)}
                        className={`border-b border-border/50 hover:bg-bg-primary/50 cursor-pointer transition ${
                          selectedConv?.id === conv.id ? 'bg-accent/5' : ''
                        }`}
                      >
                        <td className="p-3 font-medium">{conv.title}</td>
                        <td className="p-3 text-text-secondary">{conv.user.username}</td>
                        <td className="p-3 text-text-secondary">{conv.modelId}</td>
                        <td className="p-3">{conv._count.messages}</td>
                        <td className="p-3 text-text-secondary">{new Date(conv.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-text-secondary">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm bg-bg-secondary border border-border rounded-xl disabled:opacity-30 hover:border-accent/50 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm bg-bg-secondary border border-border rounded-xl disabled:opacity-30 hover:border-accent/50 transition flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail panel */}
      {selectedConv && (
        <div className="w-1/2 min-w-0 flex flex-col bg-bg-primary animate-fadeIn">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <button
              onClick={closeDetail}
              className="p-2 hover:bg-bg-secondary rounded-xl transition"
              title="Back to list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent flex-shrink-0" />
                {selectedConv.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {selectedConv.user.username}
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {selectedConv.modelId}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(selectedConv.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesLoading ? (
              <div className="p-8 text-text-secondary text-center">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-text-secondary text-center">No messages in this conversation</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-accent/10 border border-accent/20'
                        : 'bg-bg-secondary border border-border'
                    }`}
                  >
                    <div className="markdown-content leading-relaxed">
                      <MessageRenderer content={msg.content} />
                    </div>
                    <p className="text-xs text-text-secondary/60 mt-1.5">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageRenderer({ content }: { content: string }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  let blockCounter = 0;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      components={{
        code({ className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const codeStr = String(children).replace(/\n$/, '');
          const isBlock = className?.includes('language-');
          const idx = blockCounter++;

          if (isBlock && match) {
            return (
              <div className="relative my-4 rounded-xl overflow-hidden border border-border shadow-lg">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1e1e] text-xs text-text-secondary">
                  <span className="font-mono">{match[1]}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(codeStr);
                      setCopiedIdx(idx);
                      setTimeout(() => setCopiedIdx(null), 2000);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/10 transition text-xs"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, borderRadius: '0' }}
                >
                  {codeStr}
                </SyntaxHighlighter>
              </div>
            );
          }

          return (
            <code className="px-1.5 py-0.5 bg-bg-secondary border border-border rounded-md text-sm font-mono" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
