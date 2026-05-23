let cachedModels:
  | { id: string; name: string; contextWindow: number; description: string; image?: string }[]
  | null = null;
let pending: Promise<any> | null = null;

export async function fetchModels(): Promise<
  { id: string; name: string; contextWindow: number; description: string; image?: string }[]
> {
  if (cachedModels) return cachedModels;
  if (pending) return pending.then(() => cachedModels!);
  pending = (async () => {
    try {
      const res = await fetch('/api/models', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      cachedModels = data.models || [];
      return cachedModels;
    } catch {
      cachedModels = [
        {
          id: 'nemotron-nano',
          name: 'Nemotron Nano 30B',
          contextWindow: 32000,
          description: 'NVIDIA reasoning model',
        },
      ];
      return cachedModels;
    } finally {
      pending = null;
    }
  })();
  return pending;
}
