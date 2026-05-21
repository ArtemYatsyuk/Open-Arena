import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { Menu, AlertCircle, X } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';

export default function ChatArea() {
  const messages = useChatStore((s) => s.messages);
  const currentConv = useChatStore((s) => s.currentConversation);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
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
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-border bg-bg-primary/80 backdrop-blur-xl flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-bg-secondary rounded-xl transition md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        {editingTitle ? (
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            className="flex-1 bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            autoFocus
          />
        ) : (
          <h2
            className="flex-1 text-sm font-medium truncate cursor-pointer hover:text-accent transition px-2 py-1.5 rounded-xl hover:bg-bg-secondary/50"
            onClick={() => setEditingTitle(true)}
          >
            {currentConv?.title || 'New conversation'}
          </h2>
        )}
        <ModelSelector currentModelId={currentConv?.modelId} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 && !streamingContent ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
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
                  createdAt: new Date().toISOString(),
                }}
                initials={initials}
                isStreaming
              />
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
    { icon: '💡', text: 'Explain quantum computing in simple terms' },
    { icon: '💻', text: 'Write a Python function to sort a list' },
    { icon: '🐛', text: 'Help me debug a React component' },
    { icon: '', text: 'Summarize the latest AI research' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6 animate-fadeIn">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-6 shadow-lg">
        <span className="text-4xl">✦</span>
      </div>
      <h1 className="text-3xl font-semibold mb-2">How can I help you today?</h1>
      <p className="text-text-secondary text-base mb-10 max-w-md">
        Start a conversation or try one of these suggestions below
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl w-full">
        {prompts.map((p) => (
          <button
            key={p.text}
            className="p-5 text-base text-left bg-bg-secondary border border-border rounded-2xl hover:border-accent/50 hover:bg-accent/5 transition-all duration-200 group"
          >
            <span className="text-2xl mb-3 block">{p.icon}</span>
            <span className="text-text-secondary group-hover:text-text-primary transition">{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
