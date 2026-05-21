import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';

interface Props {
  message: Message;
  initials: string;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, initials, isStreaming }: Props) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end group">
        <div className="max-w-[85%]">
          <div className="bg-accent/10 border border-accent/20 rounded-2xl rounded-br-md px-5 py-3.5">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          <div className="flex items-center gap-2 mt-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[11px] text-text-secondary">{formatTime(message.createdAt)}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-bg-secondary rounded-lg transition text-text-secondary hover:text-text-primary"
              title="Copy"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-semibold"
              style={{ backgroundColor: '#6C4FF6' }}
            >
              {initials}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 group">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-md">
        OA
      </div>
      <div className="flex-1 min-w-0">
        <div className="markdown-content text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              code({ className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeStr = String(children).replace(/\n$/, '');
                const isBlock = className?.includes('language-');

                if (isBlock && match) {
                  return (
                    <div className="relative my-4 rounded-xl overflow-hidden border border-border">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1e1e] text-xs text-text-secondary">
                        <span className="font-mono">{match[1]}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(codeStr);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/10 transition text-[11px]"
                        >
                          {copied ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
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
                  <code className="px-1.5 py-0.5 bg-bg-secondary border border-border rounded-md text-[13px] font-mono" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {isStreaming && (
          <span className="inline-flex gap-1.5 ml-1 mt-1">
            <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}

        <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[11px] text-text-secondary">{formatTime(message.createdAt)}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
