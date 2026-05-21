import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { Paperclip, Send, Square } from 'lucide-react';

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
    <div className="px-4 sm:px-6 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-bg-secondary border border-border rounded-2xl focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20 focus-within:shadow-lg focus-within:shadow-accent/5 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Open Arena..."
            className="w-full bg-transparent text-base text-text-primary resize-none focus:outline-none min-h-[56px] max-h-[240px] py-4 pl-16 pr-16 leading-relaxed placeholder:text-text-secondary/50"
            rows={1}
          />
          
          {/* Left action button */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-bg-primary rounded-xl transition text-text-secondary hover:text-text-primary"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Right action button */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="p-2.5 bg-danger text-white rounded-xl hover:bg-danger/90 transition shadow-lg shadow-danger/20"
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
        <p className="text-sm text-text-secondary/60 text-center mt-3">
          Open Arena can make mistakes. Press <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border rounded text-xs font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border rounded text-xs font-mono">Shift+Enter</kbd> for new line.
        </p>
      </div>
    </div>
  );
}
