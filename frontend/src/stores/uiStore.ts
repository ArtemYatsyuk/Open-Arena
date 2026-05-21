import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  workspaceOpen: boolean;
  workspaceWidth: number;
  sidebarWidth: number;
  theme: 'light' | 'dark';
  workspaceTab: 'preview' | 'code';
  workspaceContent: string;
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];

  toggleSidebar: () => void;
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
  workspaceOpen: false,
  workspaceWidth: parseInt(localStorage.getItem('workspaceWidth') || '480'),
  sidebarWidth: parseInt(localStorage.getItem('sidebarWidth') || '260'),
  theme: getSystemTheme(),
  workspaceTab: 'code',
  workspaceContent: '',
  toasts: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

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
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
