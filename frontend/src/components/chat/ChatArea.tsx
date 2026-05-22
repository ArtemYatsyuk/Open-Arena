import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { AlertCircle, X, Zap, Code, Atom, Globe, Search, User } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';
import { fetchModels } from '../../utils/modelCache';

export default function ChatArea() {
  const messages = useChatStore((s) => s.messages);
  const currentConv = useChatStore((s) => s.currentConversation);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const reasoningContent = useChatStore((s) => s.reasoningContent);
  const error = useChatStore((s) => s.error);
  const setError = useChatStore((s) => s.setError);
  const theme = useUIStore((s) => s.theme);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [models, setModels] = useState<{ id: string; name: string; image?: string }[]>([]);

  useEffect(() => {
    fetchModels().then(setModels);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const currentModel = models.find((m) => m.id === (currentConv?.modelId || 'nemotron-nano'));
  const modelName = currentModel?.name || 'AI';
  const modelImage = currentModel?.image;

  const handleNewChat = () => {
    useChatStore.getState().selectConversation('');
    useChatStore.setState({ currentConversation: null, messages: [] });
    window.history.pushState(null, '', '/');
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Top bar */}
      <div className="flex items-center gap-1.5 px-4 sm:px-6 py-3 border-b border-border bg-bg-primary/80 backdrop-blur-xl flex-shrink-0">
        <ModelSelector currentModelId={currentConv?.modelId} />
        <div className="flex-1" />
        <button onClick={toggleSidebar} className="p-1.5 hover:bg-bg-secondary rounded-lg transition md:hidden" title="Toggle sidebar">
          <User className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 && !streamingContent ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} modelName={modelName} modelImage={modelImage} />
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
                isStreaming
                modelName={modelName}
                modelImage={modelImage}
              />
            )}
            {isStreaming && !streamingContent && (
              <div className="flex items-center gap-3 animate-slideUp">
                <div className="w-8 h-8 rounded-lg bg-bg-secondary border border-border flex items-center justify-center">
                  {modelImage ? (
                    <img src={modelImage} alt="" className="w-6 h-6 rounded object-contain" />
                  ) : (
                    <img src={theme === 'dark' ? '/OpenArena-Black.png' : '/favicon.png'} alt="Open Arena" className="w-5 h-5 rounded-md" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-text-secondary">{modelName}</span>
                  <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-blink" />
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
  const theme = useUIStore((s) => s.theme);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const currentConv = useChatStore((s) => s.currentConversation);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const prompts = [
    { icon: <Atom className="w-5 h-5" />, text: 'Explain quantum computing in simple terms' },
    { icon: <Code className="w-5 h-5" />, text: 'Write a Python function to sort a list' },
    { icon: <Zap className="w-5 h-5" />, text: 'Help me debug a React component' },
    { icon: <Search className="w-5 h-5" />, text: 'Summarize the latest AI research' },
  ];

  const handlePrompt = (text: string) => {
    if (isStreaming) return;
    const modelId = currentConv?.modelId || 'nemotron-nano';
    sendMessage(text, modelId, currentConv?.id);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6 animate-fadeIn">
      <div className="w-20 h-20 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center mb-5 shadow-lg">
        <img src={theme === 'dark' ? '/OpenArena-Black.png' : '/favicon.png'} alt="Open Arena" className="w-12 h-12 rounded-xl" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-2 tracking-tight">How can I help you today?</h1>
      <p className="text-text-secondary text-sm sm:text-base mb-8 max-w-md">
        Start a conversation or try a suggestion
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
        {prompts.map((p) => (
          <button
            key={p.text}
            onClick={() => handlePrompt(p.text)}
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