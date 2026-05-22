import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { Plus, LayoutGrid, Mic, Send, Square, Globe, Brain, Code } from 'lucide-react';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const currentConv = useChatStore((s) => s.currentConversation);
  const webSearchEnabled = useChatStore((s) => s.webSearchEnabled);
  const toggleWebSearch = useChatStore((s) => s.toggleWebSearch);
  const reasoningEnabled = useChatStore((s) => s.reasoningEnabled);
  const setReasoningEnabled = useChatStore((s) => s.setReasoningEnabled);
  const selectedModelId = useChatStore((s) => s.selectedModelId);
  const toggleWorkspace = useUIStore((s) => s.toggleWorkspace);
  const workspaceOpen = useUIStore((s) => s.workspaceOpen);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming) return;
    const content = input.trim();
    const modelId = currentConv?.modelId || selectedModelId;
    try {
      await sendMessage(content, modelId, currentConv?.id);
      setInput('');
    } catch {
      // input preserved on failure
    }
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

  return (
    <div className="px-4 sm:px-6 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-bg-secondary border border-border rounded-2xl transition-all duration-200 focus-within:border-accent/50 focus-within:shadow-lg">
          {/* Left icons */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition text-text-secondary/60 hover:text-text-secondary"
              title="Attach file"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setIntegrationsOpen(!integrationsOpen)}
                className={`p-1.5 rounded-lg transition text-text-secondary/60 hover:text-text-secondary ${
                  integrationsOpen ? 'bg-white/[0.08] text-text-secondary' : ''
                }`}
                title="Integrations"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              {integrationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIntegrationsOpen(false)} />
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-52 bg-bg-primary border border-border rounded-xl shadow-2xl p-2">
                    <p className="text-xs font-semibold text-text-secondary px-2 py-1.5">Integrations</p>
                    <div className="h-px bg-border mx-2 my-1" />
                    <div className="space-y-0.5">
                      <button
                        onClick={() => { toggleWebSearch(); }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-bg-secondary transition text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-text-secondary" />
                          Web Search
                        </span>
                        <span className={`w-8 h-4 rounded-full transition-colors relative ${
                          webSearchEnabled ? 'bg-accent' : 'bg-border'
                        }`}>
                          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${
                            webSearchEnabled ? 'left-[18px]' : 'left-0.5'
                          }`} />
                        </span>
                      </button>
                      <button
                        onClick={() => { toggleWorkspace(); setIntegrationsOpen(false); }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-bg-secondary transition text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Code className="w-4 h-4 text-text-secondary" />
                          Code Interpreter
                        </span>
                        <span className={`w-8 h-4 rounded-full transition-colors relative ${
                          workspaceOpen ? 'bg-accent' : 'bg-border'
                        }`}>
                          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${
                            workspaceOpen ? 'left-[18px]' : 'left-0.5'
                          }`} />
                        </span>
                      </button>
                      <button
                        onClick={() => setReasoningEnabled(!reasoningEnabled)}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-bg-secondary transition text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-text-secondary" />
                          Reasoning
                        </span>
                        <span className={`w-8 h-4 rounded-full transition-colors relative ${
                          reasoningEnabled ? 'bg-accent' : 'bg-border'
                        }`}>
                          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${
                            reasoningEnabled ? 'left-[18px]' : 'left-0.5'
                          }`} />
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message"
            className="w-full bg-transparent text-sm text-text-primary resize-none focus:outline-none min-h-[52px] max-h-[240px] py-3 pl-[72px] pr-[92px] leading-relaxed placeholder:text-text-secondary/50"
            rows={1}
            disabled={isStreaming}
          />

          {/* Right icons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition text-text-secondary/60 hover:text-text-secondary"
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
            </button>
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="p-2 bg-bg-reverse text-text-reverse rounded-xl hover:opacity-90 transition shadow-sm flex items-center justify-center"
                title="Stop generation"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="p-2 bg-bg-reverse text-text-reverse rounded-xl hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-text-secondary/50 text-center mt-2">
          Open Arena Can Make Mistakes. Verify Important Information
        </p>
      </div>
    </div>
  );
}