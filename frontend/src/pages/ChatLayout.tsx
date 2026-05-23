import { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatArea from '@/components/chat/ChatArea';
import Workspace from '@/components/workspace/Workspace';
import { useUIStore } from '@/stores/uiStore';
import { useChatStore } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PanelRightOpen } from 'lucide-react';

export default function ChatLayout() {
  const { id } = useParams();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const workspaceOpen = useUIStore((s) => s.workspaceOpen);
  const workspaceWidth = useUIStore((s) => s.workspaceWidth);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const selectConversation = useChatStore((s) => s.selectConversation);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (id) {
      selectConversation(id);
    } else {
      useChatStore.getState().selectConversation('');
      useChatStore.setState({ currentConversation: null, messages: [] });
    }
  }, [id, selectConversation]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      useUIStore.getState().toggleSidebar();
    }
    if (e.key === 'Escape') {
      useUIStore.getState().setWorkspaceContent('');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div
        className={`hidden md:block shrink-0 border-r border-border transition-all duration-200 ease-out ${
          sidebarOpen ? '' : 'overflow-hidden'
        }`}
        style={{ width: sidebarOpen ? sidebarWidth : 0 }}
      >
        <Sidebar />
      </div>

      {/* Mobile sidebar via Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Floating sidebar reopen button (desktop only) */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-12 w-8 rounded-r-lg border border-l-0 border-border bg-sidebar text-muted-foreground hover:text-foreground"
          title="Open sidebar (Ctrl+/)"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      )}

      <div className="flex-1 flex min-w-0">
        <div className="flex-1 min-w-0">
          <ChatArea />
        </div>

        {workspaceOpen && (
          <div
            className="hidden sm:block shrink-0 border-l border-border transition-all duration-250 ease-out"
            style={{ width: workspaceWidth }}
          >
            <Workspace />
          </div>
        )}
      </div>
    </div>
  );
}
