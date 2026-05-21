import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { Send, Square, Globe } from 'lucide-react';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const currentConv = useChatStore((s) => s.currentConversation);
  const webSearchEnabled = useChatStore((s) => s.webSearchEnabled);
  const toggleWebSearch = useChatStore((s) => s.toggleWebSearch);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming) return;
    const content = input.trim();
    setInput('');
    const modelId = currentConv?.modelId || 'nemotron-nano';
    await sendMessage(content, modelId, currentConv?.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (input.startsWith('/')) {
    const cmd = input.split(' ')[0];
    if (cmd === '/clear') {
      useChatStore.setState({ messages: [], currentConversation: null });
    }
  }

  return (
    <div className="px-4 sm:px-6 py-4">
      <div className="max-w-3xl mx-auto">
        <div className={`relative bg-bg-secondary border rounded-2xl transition-all duration-200 ${
          isStreaming
            ? 'border-accent/40 ring-2 ring-accent/10 animate-pulseGlow'
            : 'border-border focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20 focus-within:shadow-lg focus-within:shadow-accent/5'
        }`}>
          {isStreaming && (
            <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-accent via-purple-500 to-accent rounded-full animate-gradient" />
          )}
          {/* Web search toggle */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <button
              onClick={toggleWebSearch}
              disabled={isStreaming}
              title={webSearchEnabled ? 'Web search enabled' : 'Web search disabled'}
              className={`p-2 rounded-xl transition ${
                webSearchEnabled
                  ? 'bg-accent/15 text-accent shadow-sm'
                  : 'text-text-secondary/50 hover:text-text-secondary hover:bg-bg-primary/50'
              } disabled:opacity-30`}
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'AI is generating...' : 'Message Open Arena...'}
            className="w-full bg-transparent text-base text-text-primary resize-none focus:outline-none min-h-[56px] max-h-[240px] py-4 pl-14 pr-14 leading-relaxed placeholder:text-text-secondary/50"
            rows={1}
            disabled={isStreaming}
          />

          {/* Right action button */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="p-2.5 bg-danger text-white rounded-xl hover:bg-danger/90 transition shadow-lg shadow-danger/20 flex items-center gap-1.5 text-sm font-medium"
                title="Stop generation"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="p-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-text-secondary/60 text-center mt-3">
          Open Arena Can Make Mistakes. Verify Important Information
        </p>
      </div>
    </div>
  );
}
