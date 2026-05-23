import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  workspaceOpen: boolean;
  workspaceWidth: number;
  sidebarWidth: number;
  theme: 'light' | 'dark';
  workspaceTab: 'preview' | 'code';
  workspaceContent: string;
  toasts: Toast[];

  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleWorkspace: () => void;
  setWorkspaceWidth: (w: number) => void;
  setSidebarWidth: (w: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setWorkspaceTab: (tab: 'preview' | 'code') => void;
  setWorkspaceContent: (content: string) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

function getSystemTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: window.innerWidth >= 768,
  mobileSidebarOpen: false,
  workspaceOpen: false,
  workspaceWidth: parseInt(localStorage.getItem('workspaceWidth') || '480'),
  sidebarWidth: parseInt(localStorage.getItem('sidebarWidth') || '260'),
  theme: getSystemTheme(),
  workspaceTab: 'code',
  workspaceContent: '',
  toasts: [],

  toggleSidebar: () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen }));
    } else {
      set((state) => ({ sidebarOpen: !state.sidebarOpen }));
    }
  },
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  toggleWorkspace: () => set((state) => ({ workspaceOpen: !state.workspaceOpen })),

  setWorkspaceWidth: (w) => {
    localStorage.setItem('workspaceWidth', String(w));
    set({ workspaceWidth: w });
  },

  setSidebarWidth: (w) => {
    localStorage.setItem('sidebarWidth', String(w));
    set({ sidebarWidth: w });
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  setWorkspaceTab: (tab) => set({ workspaceTab: tab }),

  setWorkspaceContent: (content) => set({ workspaceContent: content, workspaceOpen: !!content }),

  addToast: (message, type = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 4);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    const timeout = setTimeout(() => get().removeToast(id), 4000);
    (timeout as any).toastId = id;
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
