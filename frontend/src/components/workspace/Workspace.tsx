import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { Eye, Code, X } from 'lucide-react';

export default function Workspace() {
  const workspaceTab = useUIStore((s) => s.workspaceTab);
  const setWorkspaceTab = useUIStore((s) => s.setWorkspaceTab);
  const workspaceContent = useUIStore((s) => s.workspaceContent);
  const setWorkspaceContent = useUIStore((s) => s.setWorkspaceContent);
  const workspaceOpen = useUIStore((s) => s.workspaceOpen);

  if (!workspaceOpen) return null;

  return (
    <div className="flex flex-col h-full bg-bg-primary animate-fadeIn">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex gap-1 bg-bg-secondary p-1 rounded-xl">
          <button
            onClick={() => setWorkspaceTab('preview')}
            className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1.5 ${
              workspaceTab === 'preview'
                ? 'bg-accent text-white shadow-sm'
                : 'hover:bg-bg-tertiary text-text-secondary'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={() => setWorkspaceTab('code')}
            className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1.5 ${
              workspaceTab === 'code'
                ? 'bg-accent text-white shadow-sm'
                : 'hover:bg-bg-tertiary text-text-secondary'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Code
          </button>
        </div>
        <button
          onClick={() => setWorkspaceContent('')}
          className="p-2 hover:bg-bg-secondary rounded-lg transition text-text-secondary"
          title="Close workspace"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {workspaceTab === 'preview' ? (
          <iframe
            srcDoc={extractHtml(workspaceContent)}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            title="Preview"
          />
        ) : (
          <pre className="w-full h-full p-4 overflow-auto text-sm font-mono bg-[#1e1e1e] text-[#d4d4d4]">
            <code>{workspaceContent}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

function extractHtml(content: string): string {
  const htmlMatch = content.match(/```html\n?([\s\S]*?)```/);
  if (htmlMatch) return htmlMatch[1];

  const jsxMatch = content.match(/```(?:jsx|tsx)\n?([\s\S]*?)```/);
  if (jsxMatch)
    return `<!DOCTYPE html><html><head><script src="https://unpkg.com/react@18/umd/react.development.js"></script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script></head><body><div id="root"></div><script type="text/babel">${jsxMatch[1]}</script></body></html>`;

  return content;
}
