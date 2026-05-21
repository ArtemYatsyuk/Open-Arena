import { create } from 'zustand';

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  tokenCount?: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  fetchConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  createConversation: (title: string, modelId: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversation: (id: string, data: { title?: string; isStarred?: boolean }) => Promise<void>;
  sendMessage: (content: string, modelId: string, conversationId?: string) => Promise<void>;
  stopStreaming: () => void;
  setError: (error: string | null) => void;
}

let abortController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/conversations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        set({ conversations: data });
      }
    } catch {
      set({ error: 'Failed to load conversations' });
    }
    set({ isLoading: false });
  },

  selectConversation: async (id) => {
    set({ isLoading: true, currentConversation: null, messages: [] });
    try {
      const [convRes, msgRes] = await Promise.all([
        fetch(`/api/conversations/${id}`, { credentials: 'include' }),
        fetch(`/api/conversations/${id}/messages`, { credentials: 'include' }),
      ]);
      if (convRes.ok && msgRes.ok) {
        const conv = await convRes.json();
        const messages = await msgRes.json();
        set({ currentConversation: conv, messages });
      }
    } catch {
      set({ error: 'Failed to load conversation' });
    }
    set({ isLoading: false });
  },

  createConversation: async (title, modelId) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, modelId }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    const conv = await res.json();
    set((state) => ({ conversations: [conv, ...state.conversations] }));
    return conv.id;
  },

  deleteConversation: async (id) => {
    await fetch(`/api/conversations/${id}`, { method: 'DELETE', credentials: 'include' });
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      ...(state.currentConversation?.id === id
        ? { currentConversation: null, messages: [] }
        : {}),
    }));
  },

  updateConversation: async (id, data) => {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    const updated = await res.json();
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updated } : c
      ),
      ...(state.currentConversation?.id === id
        ? { currentConversation: { ...state.currentConversation, ...updated } }
        : {}),
    }));
  },

  sendMessage: async (content, modelId, conversationId) => {
    const convId = conversationId || get().currentConversation?.id;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: convId || '',
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isStreaming: true,
      streamingContent: '',
      error: null,
    }));

    abortController = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, content, modelId }),
        credentials: 'include',
        signal: abortController.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chat failed');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      let newConvId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'chunk') {
              assistantContent += parsed.content;
              set({ streamingContent: assistantContent });
            } else if (parsed.type === 'conversation') {
              newConvId = parsed.id;
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message);
            } else if (parsed.type === 'done') {
              break;
            }
          } catch {}
        }
      }

      const assistantMsg: Message = {
        id: `temp-asst-${Date.now()}`,
        conversationId: newConvId || convId || '',
        role: 'assistant',
        content: assistantContent,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isStreaming: false,
        streamingContent: '',
      }));

      if (newConvId) {
        await get().fetchConversations();
        await get().selectConversation(newConvId);
      } else {
        await get().fetchConversations();
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        set({ isStreaming: false, streamingContent: '' });
      } else {
        set({ error: e.message, isStreaming: false, streamingContent: '' });
      }
    }
  },

  stopStreaming: () => {
    abortController?.abort();
    set({ isStreaming: false, streamingContent: '' });
  },

  setError: (error) => set({ error }),
}));
