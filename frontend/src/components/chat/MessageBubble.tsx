import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Clock, Brain, Globe, ChevronDown, ChevronRight, ChevronLeft, RotateCcw, ExternalLink } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import type { Message } from '../../stores/chatStore';

function tryExtract(str: string, quote: string): string | null {
  const escaped = quote === '"' ? '\\"' : "'";
  const pattern = new RegExp(
    `^\\s*\\[\\s*\\{?['"]type['"]\\s*:\\s*['"]text['"]\\s*,\\s*['"]text['"]\\s*:\\s*${quote}((?:[^${escaped}\\\\]|\\\\.)*)${quote}\\s*\\}?\\s*\\]\\s*$`,
    'gm'
  );
  const matches = [...str.matchAll(pattern)];
  if (matches.length === 0) return null;
  return matches.map((m) => m[1]).join('\n\n').trim();
}

function cleanContent(str: string): string {
  if (!str) return str;
  return tryExtract(str, '"') || tryExtract(str, "'") || str;
}

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [thoughtOpen, setThoughtOpen] = useState(isStreaming);
  const [searchResultsOpen, setSearchResultsOpen] = useState(isStreaming);
  const [versionIdx, setVersionIdx] = useState(0);
  const regenerateMessage = useChatStore((s) => s.regenerateMessage);
  const isRegenerating = useChatStore((s) => s.isStreaming);

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

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end group animate-slideUp">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="relative bg-accent/10 border border-accent/20 rounded-2xl rounded-br-sm px-5 py-4 shadow-sm bubble-tail-user">
            <p className="text-base whitespace-pre-wrap leading-relaxed">{displayContent}</p>
          </div>
          <div className="flex items-center gap-2 mt-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <Clock className="w-3 h-3" />
              {formatTime(message.createdAt)}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-bg-secondary rounded-lg transition text-text-secondary hover:text-text-primary"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasReasoning = !!(displayReasoning || (isStreaming && message.reasoning));

  return (
    <div className="flex gap-4 group animate-slideUp">
      <div className="flex-1 min-w-0">
        {hasReasoning && (
          <div className="mb-2">
            <button
              onClick={() => setThoughtOpen(!thoughtOpen)}
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition group/reason"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400 flex-1">
                {isStreaming ? 'Thinking...' : 'Thinking Process'}
              </span>
              {thoughtOpen ? (
                <ChevronDown className="w-4 h-4 text-amber-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-amber-400" />
              )}
            </button>
            {thoughtOpen && (
              <div className="mt-1 ml-1 p-4 bg-amber-500/[0.03] border border-amber-500/10 rounded-xl text-sm text-text-secondary leading-relaxed whitespace-pre-wrap animate-slideUp">
                {displayReasoning}
              </div>
            )}
          </div>
        )}
        {message.webSearchSources?.length ? (
          <div className="mb-2">
            <button
              onClick={() => setSearchResultsOpen(!searchResultsOpen)}
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition group/reason"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-blue-500" />
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
              <div className="mt-1 ml-1 space-y-2 animate-slideUp">
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
                      <span className="text-text-primary font-medium group-hover:text-blue-500 transition">{src.title}</span>
                      <p className="text-text-secondary text-xs mt-0.5 line-clamp-2">{src.snippet}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-text-secondary/50 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : null}
        <div className="relative bg-bg-secondary/50 border border-border/50 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm bubble-tail-assistant">
          <div className="markdown-content text-base leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              components={{
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeStr = String(children).replace(/\n$/, '');
                  const isBlock = className?.includes('language-');

                  if (isBlock && match) {
                    return (
                      <div className="relative my-4 rounded-xl overflow-hidden border border-border shadow-lg">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1e1e] text-xs text-text-secondary">
                          <span className="font-mono">{match[1]}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(codeStr);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/10 transition text-xs"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus as any}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, borderRadius: '0' }}
                        >
                          {codeStr}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  return (
                    <code className="px-1.5 py-0.5 bg-bg-secondary border border-border rounded-md text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>

          {isStreaming && (
            <span className="streaming-cursor text-accent text-lg leading-none" />
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
          <span className="flex items-center gap-1 text-xs text-text-secondary">
            <Clock className="w-3 h-3" />
            {isStreaming ? 'Generating...' : formatTime(message.createdAt)}
          </span>
          {allVersions.length > 1 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-bg-secondary rounded-lg text-xs text-text-secondary">
              <button
                onClick={() => setVersionIdx(Math.max(0, versionIdx - 1))}
                disabled={versionIdx === 0}
                className="p-0.5 hover:text-text-primary disabled:opacity-30 transition"
                title="Previous version"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-medium tabular-nums min-w-[2rem] text-center">{versionIdx + 1}/{allVersions.length}</span>
              <button
                onClick={() => setVersionIdx(Math.min(allVersions.length - 1, versionIdx + 1))}
                disabled={versionIdx === allVersions.length - 1}
                className="p-0.5 hover:text-text-primary disabled:opacity-30 transition"
                title="Next version"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {!isStreaming && (
            <>
              <button
                onClick={() => regenerateMessage(message.id)}
                disabled={isRegenerating}
                className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition disabled:opacity-30"
                title="Regenerate response"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
