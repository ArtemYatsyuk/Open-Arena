import { useState, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';

interface Model {
  id: string;
  name: string;
  contextWindow: number;
  description: string;
}

// Model icon mapping - fetches from known sources
const MODEL_ICONS: Record<string, string> = {
  'nemotron': 'https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/01-nvidia-logo-vert-500x200-2c50-d@2x.png',
  'nvidia': 'https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/01-nvidia-logo-vert-500x200-2c50-d@2x.png',
  'gpt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png',
  'openai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png',
  'claude': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/512px-Anthropic_logo.svg.png',
  'anthropic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/512px-Anthropic_logo.svg.png',
  'owl': 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png',
  'openrouter': 'https://openrouter.ai/icons/android-chrome-192x192.png',
};

function getModelIcon(modelId: string): string | null {
  const lowerId = modelId.toLowerCase();
  for (const [key, icon] of Object.entries(MODEL_ICONS)) {
    if (lowerId.includes(key)) {
      return icon;
    }
  }
  return null;
}

export default function ModelSelector({ currentModelId }: { currentModelId?: string }) {
  const [models, setModels] = useState<Model[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(currentModelId || 'nemotron-nano');
  const [iconError, setIconError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/models', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch models');
        return r.json();
      })
      .then((data) => {
        setModels(data.models);
        setSelectedId(currentModelId || data.defaultModelId || 'nemotron-nano');
      })
      .catch((e) => {
        console.error('Failed to load models:', e);
        setModels([{ id: 'nemotron-nano', name: 'Nemotron Nano 30B', contextWindow: 32000, description: 'NVIDIA reasoning model' }]);
      });
  }, [currentModelId]);

  const selected = models.find((m) => m.id === selectedId);
  const selectedIcon = getModelIcon(selectedId);

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
        className="flex items-center gap-2.5 px-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm hover:border-accent/50 transition-all duration-150 hover:shadow-md"
      >
        {selectedIcon && !iconError[selectedId] ? (
          <img
            src={selectedIcon}
            alt={selected?.name}
            className="w-5 h-5 rounded-md object-contain"
            onError={() => setIconError((prev) => ({ ...prev, [selectedId]: true }))}
          />
        ) : (
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ backgroundColor: getProviderColor(selectedId) + '20' }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getProviderColor(selectedId) }}
            />
          </div>
        )}
        <span className="font-medium">{selected?.name || 'Select model'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-bg-primary border border-border rounded-2xl shadow-2xl z-20 overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Available Models
              </div>
              {models.map((model) => {
                const icon = getModelIcon(model.id);
                const hasError = iconError[model.id];
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedId(model.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl hover:bg-bg-secondary transition-all duration-150 flex items-start gap-3 ${
                      selectedId === model.id ? 'bg-accent/10 ring-1 ring-accent/30' : ''
                    }`}
                  >
                    {icon && !hasError ? (
                      <img
                        src={icon}
                        alt={model.name}
                        className="w-10 h-10 rounded-xl object-contain bg-bg-secondary p-1.5 flex-shrink-0"
                        onError={() => setIconError((prev) => ({ ...prev, [model.id]: true }))}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getProviderColor(model.id) + '15' }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getProviderColor(model.id) }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{model.name}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: getProviderColor(model.id) + '15',
                            color: getProviderColor(model.id),
                          }}
                        >
                          {getProviderName(model.id)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{model.description}</p>
                      <p className="text-[11px] text-text-secondary/70 mt-0.5">
                        {model.contextWindow.toLocaleString()} context window
                      </p>
                    </div>
                    {selectedId === model.id && (
                      <div className="flex-shrink-0 text-accent">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
