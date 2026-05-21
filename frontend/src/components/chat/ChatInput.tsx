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
    const modelId = currentConv?.modelId || 'owl-alpha';
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
    <div className="px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-bg-secondary border border-border rounded-card p-2 focus-within:border-accent/50 transition">
          <button
            className="p-2 hover:bg-bg-primary rounded transition flex-shrink-0 text-text-secondary"
            title="Attach file"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Open Arena..."
            className="flex-1 bg-transparent text-sm text-text-primary resize-none focus:outline-none min-h-[36px] max-h-[240px] py-1.5 leading-relaxed"
            rows={1}
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="p-2 bg-danger text-white rounded-full hover:opacity-90 transition flex-shrink-0 w-8 h-8 flex items-center justify-center"
              title="Stop generation"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="p-2 bg-accent text-white rounded-full hover:bg-accent-hover transition disabled:opacity-30 flex-shrink-0 w-8 h-8 flex items-center justify-center"
              title="Send"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-text-secondary text-center mt-2">
          Open Arena can make mistakes. Press Enter to send, Shift+Enter for new line.
        </p>
      </div>
    </div>
  );
}
