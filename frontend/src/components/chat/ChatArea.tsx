import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
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
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-primary flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-bg-secondary rounded-lg transition md:hidden"
        >
          
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
        <ModelSelector currentModelId={currentConv?.modelId} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 && !streamingContent ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
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
        <div className="mx-4 mb-2 p-3 bg-danger/10 text-danger text-sm rounded-lg flex items-center justify-between flex-shrink-0">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:opacity-70">×</button>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border bg-bg-primary">
        <ChatInput />
      </div>
    </div>
  );
}

function EmptyState() {
  const prompts = [
    'Explain quantum computing in simple terms',
    'Write a Python function to sort a list',
    'Help me debug a React component',
    'Summarize the latest AI research',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        <span className="text-2xl">✦</span>
      </div>
      <h1 className="text-xl font-semibold mb-2">How can I help you today?</h1>
      <p className="text-text-secondary text-sm mb-8">Start a conversation or try one of these prompts</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
        {prompts.map((p) => (
          <button
            key={p}
            className="p-4 text-sm text-left bg-bg-secondary border border-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all duration-150"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
