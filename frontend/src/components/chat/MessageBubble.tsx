import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Clock, Copy, Check } from 'lucide-react';
import type { Message } from '../../stores/chatStore';

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
      <div className="flex gap-3 justify-end group animate-fadeIn">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bg-accent/10 border border-accent/20 rounded-2xl rounded-br-md px-5 py-4">
            <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          <div className="flex items-center gap-2 mt-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-sm text-text-secondary">{formatTime(message.createdAt)}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-bg-secondary rounded-lg transition text-text-secondary hover:text-text-primary"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
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
    <div className="flex gap-4 group animate-fadeIn">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md">
        OA
      </div>
      <div className="flex-1 min-w-0">
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
          <span className="text-sm text-text-secondary">{formatTime(message.createdAt)}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition"
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
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
