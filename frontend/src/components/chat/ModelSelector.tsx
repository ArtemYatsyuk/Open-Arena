import { useState, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';

interface Model {
  id: string;
  name: string;
  contextWindow: number;
  description: string;
}

export default function ModelSelector({ currentModelId }: { currentModelId?: string }) {
  const [models, setModels] = useState<Model[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(currentModelId || 'owl-alpha');

  useEffect(() => {
    fetch('/api/models', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch models');
        return r.json();
      })
      .then((data) => {
        setModels(data.models);
        setSelectedId(currentModelId || data.defaultModelId || 'owl-alpha');
      })
      .catch((e) => {
        console.error('Failed to load models:', e);
        setModels([{ id: 'nemotron-nano', name: 'Nemotron Nano 30B', contextWindow: 32000, description: 'NVIDIA reasoning model' }]);
      });
  }, [currentModelId]);

  const selected = models.find((m) => m.id === selectedId);

  const getProviderColor = (id: string) => {
    if (id.includes('gpt') || id.includes('openai')) return '#10A37F';
    if (id.includes('claude') || id.includes('anthropic')) return '#D97757';
    if (id.includes('nemotron') || id.includes('nvidia')) return '#76B900';
    if (id.includes('owl') || id.includes('openrouter')) return '#6C4FF6';
    return '#6C4FF6';
  };

  const getProviderName = (id: string) => {
    if (id.includes('gpt') || id.includes('openai')) return 'OpenAI';
    if (id.includes('claude') || id.includes('anthropic')) return 'Anthropic';
    if (id.includes('nemotron') || id.includes('nvidia')) return 'NVIDIA';
    if (id.includes('owl') || id.includes('openrouter')) return 'OpenRouter';
    return 'Custom';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border rounded-pill text-sm hover:border-accent/50 transition"
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: getProviderColor(selectedId) }}
        />
        <span>{selected?.name || 'Owl Alpha'}</span>
        <span className="text-text-secondary">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-bg-primary border border-border rounded-card shadow-lg z-20 overflow-hidden">
            <div className="p-2">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedId(model.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded hover:bg-bg-secondary transition flex items-start gap-3 ${
                    selectedId === model.id ? 'bg-accent-light' : ''
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: getProviderColor(model.id) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{model.name}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: getProviderColor(model.id) + '20',
                          color: getProviderColor(model.id),
                        }}
                      >
                        {getProviderName(model.id)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{model.description}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {model.contextWindow.toLocaleString()} context window
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
