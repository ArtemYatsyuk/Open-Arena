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
} from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import type { Message } from '../../stores/chatStore';

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
    <div className="relative my-4 rounded-xl overflow-hidden border border-border shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] text-xs text-text-secondary">
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
  const isUser = message.role === 'user';
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
          <div className="relative bg-bg-secondary border border-border/60 rounded-2xl px-4 py-3">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayContent}</p>
          </div>
          <div className="flex items-center gap-2 mt-1.5 justify-end">
            <span className="flex items-center gap-1 text-[11px] text-text-secondary/60">
              <Clock className="w-3 h-3" />
              {formatTime(message.createdAt)}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-white/[0.06] rounded-lg transition text-text-secondary/60 hover:text-text-secondary"
              title="Copy"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasReasoning = !!(displayReasoning || (isStreaming && message.reasoning));

  return (
    <div className="flex group animate-slideUp">
      <div className="flex-1 min-w-0">
        {/* AI model header */}
        <div className="flex items-center gap-2 mb-2">
          {modelImage ? (
            <img src={modelImage} alt="" className="w-6 h-6 rounded object-contain" />
          ) : (
            <div className="w-6 h-6 rounded-md bg-bg-secondary border border-border flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-text-secondary" />
            </div>
          )}
          <span className="text-sm font-medium text-text-primary">{displayModelName}</span>
        </div>

        {hasReasoning && (
          <div className="mb-2">
            <button
              onClick={() => setThoughtOpen(!thoughtOpen)}
              className="flex items-center gap-2 w-full text-left px-4 py-2 bg-accent/5 border border-accent/20 rounded-xl hover:bg-accent/10 transition group/reason"
            >
              <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="text-sm font-medium text-accent flex-1">
                {isStreaming ? 'Thinking...' : 'Thinking Process'}
              </span>
              {thoughtOpen ? (
                <ChevronDown className="w-4 h-4 text-accent" />
              ) : (
                <ChevronRight className="w-4 h-4 text-accent" />
              )}
            </button>
            {thoughtOpen && (
              <div className="mt-1 p-3 bg-accent/[0.03] border border-accent/10 rounded-xl text-sm text-text-secondary leading-relaxed whitespace-pre-wrap animate-slideUp">
                {displayReasoning}
              </div>
            )}
          </div>
        )}
        {message.webSearchSources?.length ? (
          <div className="mb-2">
            <button
              onClick={() => setSearchResultsOpen(!searchResultsOpen)}
              className="flex items-center gap-2 w-full text-left px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition group/reason"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex-1">
                Search results ({message.webSearchSources.length})
              </span>
              {searchResultsOpen ? (
                <ChevronDown className="w-4 h-4 text-blue-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-blue-400" />
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
                    className="flex items-start gap-2 p-3 bg-blue-500/[0.03] border border-blue-500/10 rounded-xl text-sm hover:bg-blue-500/[0.06] transition group"
                  >
                    <span className="w-5 h-5 rounded bg-blue-500/10 text-blue-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {src.index}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-text-primary font-medium group-hover:text-blue-500 transition">
                        {src.title}
                      </span>
                      <p className="text-text-secondary text-xs mt-0.5 line-clamp-2">
                        {src.snippet}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-text-secondary/50 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : null}
        <div className="relative bg-bg-secondary/50 border border-border/50 rounded-2xl pl-3 pr-5 py-3 shadow-sm">
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
                        className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-500/10 text-blue-500 text-xs font-bold mx-0.5 hover:bg-blue-500/20 hover:scale-110 transition-all"
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
                      className="px-1.5 py-0.5 bg-bg-secondary border border-border rounded-md text-sm font-mono"
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

          {isStreaming && <span className="streaming-cursor text-accent text-lg leading-none" />}
        </div>

        {/* Toolbar - appears on hover */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition text-text-secondary/60 hover:text-text-secondary"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => speak(displayContent)}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition text-text-secondary/60 hover:text-text-secondary"
            title="Read aloud"
          >
            <Speaker className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setThumbs(thumbs === 'up' ? null : 'up')}
            className={`p-1.5 rounded-lg transition ${
              thumbs === 'up'
                ? 'text-accent bg-accent/10'
                : 'text-text-secondary/60 hover:text-text-secondary hover:bg-white/[0.06]'
            }`}
            title="Good response"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setThumbs(thumbs === 'down' ? null : 'down')}
            className={`p-1.5 rounded-lg transition ${
              thumbs === 'down'
                ? 'text-danger bg-danger/10'
                : 'text-text-secondary/60 hover:text-text-secondary hover:bg-white/[0.06]'
            }`}
            title="Bad response"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => regenerateMessage(message.id)}
            disabled={isRegenerating}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition text-text-secondary/60 hover:text-text-secondary disabled:opacity-30"
            title="Regenerate"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {allVersions.length > 1 && (
            <div className="flex items-center gap-0.5 ml-2 px-1.5 py-0.5 bg-bg-secondary rounded-md">
              <button
                onClick={() => setVersionIdx(Math.max(0, versionIdx - 1))}
                disabled={versionIdx === 0}
                className="p-0.5 hover:text-text-primary disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-medium tabular-nums min-w-[1.5rem] text-center text-text-secondary">
                {versionIdx + 1}/{allVersions.length}
              </span>
              <button
                onClick={() => setVersionIdx(Math.min(allVersions.length - 1, versionIdx + 1))}
                disabled={versionIdx === allVersions.length - 1}
                className="p-0.5 hover:text-text-primary disabled:opacity-30 transition"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
          <span className="ml-auto text-[11px] text-text-secondary/60">
            {isStreaming ? 'Generating...' : formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
