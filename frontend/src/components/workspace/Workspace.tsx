import { useUIStore } from '@/stores/uiStore';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Workspace() {
  const workspaceTab = useUIStore((s) => s.workspaceTab);
  const setWorkspaceTab = useUIStore((s) => s.setWorkspaceTab);
  const workspaceContent = useUIStore((s) => s.workspaceContent);
  const setWorkspaceContent = useUIStore((s) => s.setWorkspaceContent);

  return (
    <div className="flex flex-col h-full bg-background animate-fadeIn">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <Tabs value={workspaceTab} onValueChange={(v) => setWorkspaceTab(v as 'preview' | 'code')}>
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setWorkspaceContent('')}
          title="Close workspace"
          className="text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
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
