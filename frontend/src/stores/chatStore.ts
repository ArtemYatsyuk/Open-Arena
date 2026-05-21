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

async function fetchJson(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: `Server error: ${res.status}` };
    }
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchJson('/api/conversations');
      set({ conversations: data });
    } catch (e: any) {
      set({ error: e.message });
    }
    set({ isLoading: false });
  },

  selectConversation: async (id) => {
    set({ isLoading: true, currentConversation: null, messages: [], error: null });
    try {
      const [conv, messages] = await Promise.all([
        fetchJson(`/api/conversations/${id}`),
        fetchJson(`/api/conversations/${id}/messages`),
      ]);
      set({ currentConversation: conv, messages });
    } catch (e: any) {
      set({ error: e.message });
    }
    set({ isLoading: false });
  },

  createConversation: async (title, modelId) => {
    const conv = await fetchJson('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, modelId }),
    });
    set((state) => ({ conversations: [conv, ...state.conversations] }));
    return conv.id;
  },

  deleteConversation: async (id) => {
    await fetchJson(`/api/conversations/${id}`, { method: 'DELETE' });
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      ...(state.currentConversation?.id === id
        ? { currentConversation: null, messages: [] }
        : {}),
    }));
  },

  updateConversation: async (id, data) => {
    const updated = await fetchJson(`/api/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          errorData = { error: 'Chat failed' };
        }
        throw new Error(errorData.error || 'Chat failed');
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
          } catch (e: any) {
            if (e.message && !e.message.includes('JSON')) {
              throw e;
            }
          }
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
