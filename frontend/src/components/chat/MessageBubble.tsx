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

  const handleWorkspaceTrigger = (content: string) => {
    const workspaceMatch = content.match(/<workspace>([\s\S]*?)<\/workspace>/);
    if (workspaceMatch) {
      useUIStore.getState().setWorkspaceContent(workspaceMatch[1].trim());
    }
  };

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%]">
          <div className="bg-bg-secondary border border-border rounded-card px-4 py-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex items-center gap-2 mt-1 justify-end">
            <span className="text-xs text-text-secondary">{formatTime(message.createdAt)}</span>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
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
    <div className="flex gap-3">
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium bg-accent"
      >
        AI
      </div>
      <div className="flex-1 min-w-0">
        <div className="markdown-content text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              code({ className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeStr = String(children).replace(/\n$/, '');
                const isBlock = className?.includes('language-');

                if (isBlock && match) {
                  return (
                    <div className="relative">
                      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] text-xs text-text-secondary border-b border-border">
                        <span>{match[1]}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(codeStr);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="hover:text-text-primary transition"
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: 0, borderRadius: '0 0 8px 8px' }}
                      >
                        {codeStr}
                      </SyntaxHighlighter>
                    </div>
                  );
                }

                return (
                  <code className={className} {...props}>
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
          <span className="inline-flex gap-1 ml-1">
            <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-text-secondary">{formatTime(message.createdAt)}</span>
          <button
            onClick={handleCopy}
            className="text-xs text-text-secondary hover:text-text-primary transition opacity-0 group-hover:opacity-100"
          >
            {copied ? 'Copied' : 'Copy'}
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
