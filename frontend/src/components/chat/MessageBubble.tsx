import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Copy,
  Check,
  Clock,
  Brain,
  Globe,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  ExternalLink,
  Speaker,
  ThumbsUp,
  ThumbsDown,
  Bot,
  FileText,
  Image,
  Download,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';

function tryExtract(str: string, quote: string): string | null {
  const escaped = quote === '"' ? '\\"' : "'";
  const pattern = new RegExp(
    `^\\s*\\[\\s*\\{?['"]type['"]\\s*:\\s*['"]text['"]\\s*,\\s*['"]text['"]\\s*:\\s*${quote}((?:[^${escaped}\\\\]|\\\\.)*)${quote}\\s*\\}?\\s*\\]\\s*$`,
    'gm',
  );
  const matches = [...str.matchAll(pattern)];
  if (matches.length === 0) return null;
  return matches
    .map((m) => m[1])
    .join('\n\n')
    .trim();
}

function cleanContent(str: string): string {
  if (!str) return str;
  return tryExtract(str, '"') || tryExtract(str, "'") || str;
}

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const clean = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*#_~>|`-]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.92;
  utterance.pitch = 1.05;
  utterance.volume = 1;

  const voiceId = localStorage.getItem('ttsVoice');
  if (voiceId) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.voiceURI === voiceId);
    if (voice) utterance.voice = voice;
  } else {
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')),
    );
    if (preferred) utterance.voice = preferred;
  }

  window.speechSynthesis.speak(utterance);
}

function formatModelId(id: string): string {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface Props {
  message: Message;
  isStreaming?: boolean;
  modelName?: string;
  modelImage?: string;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative my-4 rounded-xl overflow-hidden ring-1 ring-border shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] text-xs text-muted-foreground">
        <span className="font-mono">{language}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/10 transition text-xs"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: '0' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default function MessageBubble({ message, isStreaming, modelName, modelImage }: Props) {
  const isUser = message.role === 'USER';
  const [copied, setCopied] = useState(false);
  const [thoughtOpen, setThoughtOpen] = useState(isStreaming);
  const [searchResultsOpen, setSearchResultsOpen] = useState(isStreaming);
  const [versionIdx, setVersionIdx] = useState(0);
  const [thumbs, setThumbs] = useState<'up' | 'down' | null>(null);
  const regenerateMessage = useChatStore((s) => s.regenerateMessage);
  const isRegenerating = useChatStore((s) => s.isStreaming);
  const currentConv = useChatStore((s) => s.currentConversation);

  const allVersions = useMemo(() => {
    const current = { content: message.content, reasoning: message.reasoning || undefined };
    try {
      const alts = message.alternatives ? JSON.parse(message.alternatives) : [];
      return [...alts, current];
    } catch {
      return [current];
    }
  }, [message.content, message.reasoning, message.alternatives]);

  const currentVersion = useMemo(() => {
    const v = allVersions[versionIdx] || allVersions[allVersions.length - 1];
    return v;
  }, [allVersions, versionIdx]);

  const displayContent = useMemo(() => {
    const raw = cleanContent(isStreaming ? message.content || '' : currentVersion.content);
    const sources = Array.isArray(message.webSearchSources) ? message.webSearchSources : [];
    if (!sources.length) return raw;
    let result = raw;
    for (const src of sources) {
      result = result.replace(new RegExp(`\\[${src.index}\\]`, 'g'), `[${src.index}](${src.url})`);
    }
    return result;
  }, [message.content, message.webSearchSources, isStreaming, currentVersion.content]);
  const displayReasoning = useMemo(() => {
    const r = currentVersion.reasoning || message.reasoning;
    return r ? cleanContent(r) : null;
  }, [message.reasoning, currentVersion.reasoning]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayModelName = modelName || formatModelId(currentConv?.modelId || '');

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end group animate-slideUp">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="relative bg-muted border border-border/60 rounded-2xl px-4 py-3">
            {displayContent && (
              <p className="text-sm whitespace-pre-wrap leading-relaxed mb-2">{displayContent}</p>
            )}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((file) => (
                  <AttachmentPreview key={file.id} file={file} />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 justify-end">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
              <Clock className="w-3 h-3" />
              {formatTime(message.createdAt)}
            </span>
            {displayContent && (
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-muted/50 rounded-lg transition text-muted-foreground/60 hover:text-muted-foreground"
                title="Copy"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const hasReasoning = !!(displayReasoning || (isStreaming && message.reasoning));

  return (
    <div className="flex group animate-slideUp">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {modelImage ? (
            <img src={modelImage} alt="" className="w-6 h-6 rounded object-contain" />
          ) : (
            <div className="w-6 h-6 rounded-md bg-muted border border-border flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
          <span className="text-sm font-medium text-foreground">{displayModelName}</span>
        </div>

        {hasReasoning && (
          <div className="mb-2">
            <button
              onClick={() => setThoughtOpen(!thoughtOpen)}
              className="flex items-center gap-2 w-full text-left px-4 py-2 bg-muted/50 border border-border rounded-xl hover:bg-muted transition"
            >
              <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Brain className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">
                {isStreaming ? 'Thinking...' : 'Thinking Process'}
              </span>
              {thoughtOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {thoughtOpen && (
              <div className="mt-1 p-3 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap animate-slideUp">
                {displayReasoning}
              </div>
            )}
          </div>
        )}
        {message.webSearchSources?.length ? (
          <div className="mb-2">
            <button
              onClick={() => setSearchResultsOpen(!searchResultsOpen)}
              className="flex items-center gap-2 w-full text-left px-4 py-2 bg-muted/50 border border-border rounded-xl hover:bg-muted transition"
            >
              <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">
                Search results ({message.webSearchSources.length})
              </span>
              {searchResultsOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {searchResultsOpen && (
              <div className="mt-1 space-y-2 animate-slideUp">
                {message.webSearchSources.map((src) => (
                  <a
                    key={src.index}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-xl text-sm hover:bg-muted/50 transition group"
                  >
                    <span className="w-5 h-5 rounded bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {src.index}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground font-medium group-hover:text-foreground transition">
                        {src.title}
                      </span>
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                        {src.snippet}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : null}
        <div className="relative bg-muted/30 border border-border/50 rounded-2xl pl-3 pr-5 py-3 shadow-sm">
          <div className="markdown-content text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              components={{
                a({ href, children, ...props }: any) {
                  const text = Array.isArray(children) ? children.join('') : String(children || '');
                  if (href && /^https?:\/\//.test(href) && /^\[\d+\]$/.test(text)) {
                    const num = text.replace(/\[|\]/g, '');
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted text-muted-foreground text-xs font-bold mx-0.5 hover:bg-muted/80 hover:scale-110 transition-all"
                      >
                        {num}
                      </a>
                    );
                  }
                  return (
                    <a href={href} {...props}>
                      {children}
                    </a>
                  );
                },
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeStr = String(children).replace(/\n$/, '');
                  const isBlock = className?.includes('language-');

                  if (isBlock && match) {
                    return <CodeBlock language={match[1]} code={codeStr} />;
                  }

                  return (
                    <code
                      className="px-1.5 py-0.5 bg-muted border border-border rounded-md text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>

          {isStreaming && <span className="streaming-cursor text-lg leading-none" />}
        </div>

        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            title="Copy"
            className="text-muted-foreground/60 hover:text-muted-foreground"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => speak(displayContent)}
            title="Read aloud"
            className="text-muted-foreground/60 hover:text-muted-foreground"
          >
            <Speaker className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setThumbs(thumbs === 'up' ? null : 'up')}
            title="Good response"
            className={
              thumbs === 'up'
                ? 'text-foreground bg-accent/50'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            }
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setThumbs(thumbs === 'down' ? null : 'down')}
            title="Bad response"
            className={
              thumbs === 'down'
                ? 'text-destructive bg-destructive/10'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            }
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => regenerateMessage(message.id)}
            disabled={isRegenerating}
            title="Regenerate"
            className="text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          {allVersions.length > 1 && (
            <div className="flex items-center gap-0.5 ml-2 px-1.5 py-0.5 bg-muted rounded-md">
              <button
                onClick={() => setVersionIdx(Math.max(0, versionIdx - 1))}
                disabled={versionIdx === 0}
                className="p-0.5 hover:text-foreground disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-medium tabular-nums min-w-[1.5rem] text-center text-muted-foreground">
                {versionIdx + 1}/{allVersions.length}
              </span>
              <button
                onClick={() => setVersionIdx(Math.min(allVersions.length - 1, versionIdx + 1))}
                disabled={versionIdx === allVersions.length - 1}
                className="p-0.5 hover:text-foreground disabled:opacity-30 transition"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground/60">
            {isStreaming ? 'Generating...' : formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function AttachmentPreview({
  file,
}: {
  file: { id: string; fileName: string; mimeType: string; size: number; url: string };
}) {
  const isImage = file.mimeType.startsWith('image/');

  if (isImage) {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg overflow-hidden ring-1 ring-border hover:ring-ring transition max-w-[240px]"
      >
        <img
          src={file.url}
          alt={file.fileName}
          className="w-full h-auto max-h-48 object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      download={file.fileName}
      className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-xs hover:bg-muted transition group"
    >
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="flex-1 min-w-0 truncate text-foreground">{file.fileName}</span>
      <span className="text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
      <Download className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition shrink-0" />
    </a>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
