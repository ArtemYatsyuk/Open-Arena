import { useEffect, useCallback } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import Workspace from '../components/workspace/Workspace';
import ToastContainer from '../components/ui/ToastContainer';
import { useUIStore } from '../stores/uiStore';
import { useChatStore } from '../stores/chatStore';

export default function ChatLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const workspaceOpen = useUIStore((s) => s.workspaceOpen);
  const workspaceWidth = useUIStore((s) => s.workspaceWidth);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 border-r border-border transition-all duration-200 ease-out hidden md:block ${
          sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'
        }`}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-w-0">
        <div className="flex-1 min-w-0">
          <ChatArea />
        </div>

        {/* Workspace panel */}
        {workspaceOpen && (
          <div
            className="flex-shrink-0 border-l border-border transition-all duration-250 ease-out"
            style={{ width: workspaceWidth }}
          >
            <Workspace />
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
