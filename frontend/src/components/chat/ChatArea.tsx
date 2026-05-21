import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { Menu, AlertCircle, X, Sparkles, MessageSquare, Zap, Code, Atom, Search, Globe } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';

export default function ChatArea() {
  const messages = useChatStore((s) => s.messages);
  const currentConv = useChatStore((s) => s.currentConversation);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const reasoningContent = useChatStore((s) => s.reasoningContent);
  const webSearchEnabled = useChatStore((s) => s.webSearchEnabled);
  const webSearchCount = useChatStore((s) => s.webSearchCount);
  const error = useChatStore((s) => s.error);
  const setError = useChatStore((s) => s.setError);
  const user = useAuthStore((s) => s.user);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (currentConv) setTitleInput(currentConv.title);
  }, [currentConv]);

  const saveTitle = async () => {
    if (titleInput.trim() && currentConv) {
      await useChatStore.getState().updateConversation(currentConv.id, { title: titleInput.trim() });
    }
    setEditingTitle(false);
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || '?';

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-bg-primary/80 backdrop-blur-xl flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-bg-secondary rounded-xl transition md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MessageSquare className="w-4 h-4 text-text-secondary flex-shrink-0" />
          {editingTitle ? (
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              autoFocus
            />
          ) : (
            <h2
              className="flex-1 text-sm font-medium truncate cursor-pointer hover:text-accent transition px-2 py-1 rounded-lg hover:bg-bg-secondary/50"
              onClick={() => setEditingTitle(true)}
            >
              {currentConv?.title || 'New conversation'}
            </h2>
          )}
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-xs text-accent px-2 py-1 bg-accent/10 rounded-full animate-fadeIn">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              Generating
            </span>
          )}
          {webSearchEnabled && !isStreaming && (
            <span className="flex items-center gap-1.5 text-xs text-blue-500 px-2 py-1 bg-blue-500/10 rounded-full">
              <Globe className="w-3 h-3" />
              Web search
            </span>
          )}
          {webSearchEnabled && isStreaming && webSearchCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-blue-500 px-2 py-1 bg-blue-500/10 rounded-full animate-fadeIn">
              <Globe className="w-3 h-3" />
              {webSearchCount} web results
            </span>
          )}
        </div>
        <ModelSelector currentModelId={currentConv?.modelId} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 && !streamingContent ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} initials={initials} />
            ))}
            {isStreaming && streamingContent && (
              <MessageBubble
                message={{
                  id: 'streaming',
                  conversationId: '',
                  role: 'assistant',
                  content: streamingContent,
                  reasoning: reasoningContent || null,
                  createdAt: new Date().toISOString(),
                }}
                initials={initials}
                isStreaming
              />
            )}
            {isStreaming && !streamingContent && (
              <div className="flex gap-4 animate-slideUp">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent via-accent/90 to-purple-500 flex-shrink-0 flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 px-5 py-4 bg-bg-secondary/50 border border-border/50 rounded-2xl">
                  <span className="w-2 h-2 bg-accent rounded-full animate-typingDot" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-accent rounded-full animate-typingDot" style={{ animationDelay: '200ms' }} />
                  <span className="w-2 h-2 bg-accent rounded-full animate-typingDot" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 sm:mx-6 mb-3 p-3 bg-danger/10 text-danger text-sm rounded-xl flex items-center justify-between flex-shrink-0 border border-danger/20 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="ml-2 hover:opacity-70 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border bg-bg-primary/80 backdrop-blur-xl">
        <ChatInput />
      </div>
    </div>
  );
}

function EmptyState() {
  const prompts = [
    { icon: <Atom className="w-5 h-5" />, text: 'Explain quantum computing in simple terms' },
    { icon: <Code className="w-5 h-5" />, text: 'Write a Python function to sort a list' },
    { icon: <Zap className="w-5 h-5" />, text: 'Help me debug a React component' },
    { icon: <Search className="w-5 h-5" />, text: 'Summarize the latest AI research' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6 animate-fadeIn">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent via-accent/80 to-purple-500 flex items-center justify-center mb-5 shadow-lg shadow-accent/20 animate-pulseGlow">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-2 tracking-tight">How can I help you today?</h1>
      <p className="text-text-secondary text-sm sm:text-base mb-8 max-w-md">
        Start a conversation or try a suggestion
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
        {prompts.map((p) => (
          <button
            key={p.text}
            className="flex items-center gap-3 p-4 text-sm text-left bg-bg-secondary border border-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 group"
          >
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 group-hover:bg-accent/20 transition">
              {p.icon}
            </div>
            <span className="text-text-secondary group-hover:text-text-primary transition leading-snug">{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
