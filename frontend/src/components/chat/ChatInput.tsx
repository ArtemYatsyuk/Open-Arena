import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useUIStore } from '@/stores/uiStore';
import {
  Plus,
  LayoutGrid,
  Mic,
  Send,
  Square,
  Globe,
  Brain,
  Code,
  Paperclip,
  X,
  FileText,
  Image,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { post } from '@/utils/apiClient';
import { formatFileSize } from '@/lib/utils';

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  return FileText;
}

export default function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const pendingUploads = useChatStore((s) => s.pendingUploads);
  const addPendingUpload = useChatStore((s) => s.addPendingUpload);
  const removePendingUpload = useChatStore((s) => s.removePendingUpload);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const convId = currentConv?.id || useChatStore.getState().currentConversation?.id;
    if (!convId) {
      // Create conversation first - but sendMessage handles this. For now, upload without convId won't work.
      useChatStore.getState().setError('Create a conversation first before uploading files');
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', convId);

        const result = await post<any>('/attachments', formData);
        addPendingUpload(result);
      }
    } catch (err: any) {
      useChatStore.getState().setError(err.message || 'File upload failed');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if ((!input.trim() && !pendingUploads.length) || isStreaming) return;
    const content = input.trim() || '';
    const modelId = currentConv?.modelId || selectedModelId;

    const attachmentIds = pendingUploads.map((f) => f.id);

    try {
      await sendMessage(content, modelId, currentConv?.id, attachmentIds);
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

  const ToggleSwitch = ({ active, onChange }: { active: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`w-8 h-4 rounded-full transition-colors relative ${
        active ? 'bg-foreground' : 'bg-input'
      }`}
    >
      <span
        className={`absolute top-0.5 w-3 h-3 bg-background rounded-full shadow-sm transition-all ${
          active ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  );

  return (
    <div className="px-4 sm:px-6 py-4">
      <div className="max-w-3xl mx-auto">
        {/* Pending uploads preview */}
        {pendingUploads.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingUploads.map((file) => {
              const Icon = getFileIcon(file.mimeType);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 bg-muted border border-border rounded-lg text-xs"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[120px] truncate text-foreground">{file.fileName}</span>
                  <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removePendingUpload(file.id)}
                    className="text-muted-foreground/60 hover:text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="relative bg-muted border border-border rounded-xl transition-all duration-200 focus-within:border-ring/50 focus-within:shadow-lg">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-muted-foreground/60 hover:text-muted-foreground"
              title="Attach file"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv,application/json"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="relative">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIntegrationsOpen(!integrationsOpen)}
                className={`text-muted-foreground/60 hover:text-muted-foreground ${
                  integrationsOpen ? 'bg-muted/80 text-muted-foreground' : ''
                }`}
                title="Integrations"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              {integrationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIntegrationsOpen(false)} />
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-52 bg-popover border border-border rounded-xl shadow-2xl p-2">
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                      Integrations
                    </p>
                    <Separator className="my-1" />
                    <div className="space-y-0.5">
                      <button
                        onClick={toggleWebSearch}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-accent/50 transition text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          Web Search
                        </span>
                        <ToggleSwitch active={webSearchEnabled} onChange={toggleWebSearch} />
                      </button>
                      <button
                        onClick={() => {
                          toggleWorkspace();
                          setIntegrationsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-accent/50 transition text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Code className="w-4 h-4 text-muted-foreground" />
                          Code Interpreter
                        </span>
                        <ToggleSwitch active={workspaceOpen} onChange={() => {}} />
                      </button>
                      <button
                        onClick={() => setReasoningEnabled(!reasoningEnabled)}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-accent/50 transition text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-muted-foreground" />
                          Reasoning
                        </span>
                        <ToggleSwitch
                          active={reasoningEnabled}
                          onChange={() => setReasoningEnabled(!reasoningEnabled)}
                        />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message"
            className="min-h-[52px] max-h-[240px] py-3 pl-[76px] pr-[96px] leading-relaxed border-0 focus-visible:ring-0 bg-transparent resize-none"
            rows={1}
            disabled={isStreaming}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground/60 hover:text-muted-foreground"
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </Button>
            {isStreaming ? (
              <Button
                onClick={stopStreaming}
                size="icon-sm"
                className="bg-foreground text-background hover:opacity-90 rounded-lg"
                title="Stop generation"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() && !pendingUploads.length}
                size="icon-sm"
                className="bg-foreground text-background hover:opacity-90 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          Open Arena Can Make Mistakes. Verify Important Information
        </p>
      </div>
    </div>
  );
}
