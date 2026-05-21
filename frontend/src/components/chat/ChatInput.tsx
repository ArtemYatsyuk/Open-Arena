import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const currentConv = useChatStore((s) => s.currentConversation);

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
    <div className="px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-bg-secondary border border-border rounded-2xl focus-within:border-accent/50 focus-within:shadow-lg focus-within:shadow-accent/5 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Open Arena..."
            className="w-full bg-transparent text-sm text-text-primary resize-none focus:outline-none min-h-[44px] max-h-[240px] py-3.5 px-12 leading-relaxed placeholder:text-text-secondary/50"
            rows={1}
          />
          
          {/* Left action button */}
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 hover:bg-bg-primary rounded-xl transition text-text-secondary hover:text-text-primary"
            title="Attach file"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          {/* Right action button */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="p-2.5 bg-danger text-white rounded-xl hover:bg-danger/90 transition shadow-lg shadow-danger/20"
                title="Stop generation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="p-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
                title="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-text-secondary/60 text-center mt-2.5">
          Open Arena can make mistakes. Press <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border rounded text-[10px] font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border rounded text-[10px] font-mono">Shift+Enter</kbd> for new line.
        </p>
      </div>
    </div>
  );
}
