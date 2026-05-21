import { useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useChatStore } from '../../stores/chatStore';
import { ChevronDown, Check, Brain, Cpu, Globe, Sparkles, Database } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  contextWindow: number;
  description: string;
}

const PROVIDER_CONFIG: Record<string, { name: string; color: string; icon: typeof Brain }> = {
  nvidia: { name: 'NVIDIA', color: '#76B900', icon: Cpu },
  nemotron: { name: 'NVIDIA', color: '#76B900', icon: Cpu },
  gpt: { name: 'OpenAI', color: '#10A37F', icon: Brain },
  openai: { name: 'OpenAI', color: '#10A37F', icon: Brain },
  claude: { name: 'Anthropic', color: '#D97757', icon: Sparkles },
  anthropic: { name: 'Anthropic', color: '#D97757', icon: Sparkles },
  owl: { name: 'OpenRouter', color: '#6C4FF6', icon: Globe },
  openrouter: { name: 'OpenRouter', color: '#6C4FF6', icon: Globe },
};

function getProvider(id: string) {
  const lowerId = id.toLowerCase();
  for (const [key, config] of Object.entries(PROVIDER_CONFIG)) {
    if (lowerId.includes(key)) return config;
  }
  return { name: 'Custom', color: '#6C4FF6', icon: Database };
}

export default function ModelSelector({ currentModelId }: { currentModelId?: string }) {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedId, setSelectedId] = useState(currentModelId || 'nemotron-nano');

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
  const provider = getProvider(selectedId);
  const ProviderIcon = provider.icon;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm hover:border-accent/50 transition-all duration-150 hover:shadow-md outline-none">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: provider.color + '15' }}
          >
            <ProviderIcon className="w-3.5 h-3.5" style={{ color: provider.color }} />
          </div>
          <span className="font-medium max-w-[120px] truncate">{selected?.name || 'Select model'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="w-72 bg-bg-primary border border-border rounded-2xl shadow-2xl z-50 p-2 animate-fadeIn"
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Available Models
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="h-px bg-border mx-2 my-1" />

          <DropdownMenu.RadioGroup value={selectedId} onValueChange={setSelectedId}>
            {models.map((model) => {
              const p = getProvider(model.id);
              const Icon = p.icon;
              const isSelected = selectedId === model.id;
              return (
                <DropdownMenu.RadioItem
                  key={model.id}
                  value={model.id}
                  className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer outline-none transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-accent/10 ring-1 ring-accent/30'
                      : 'hover:bg-bg-secondary data-[highlighted]:bg-bg-secondary'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: p.color + '15' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: p.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{model.name}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: p.color + '15', color: p.color }}
                      >
                        {p.name}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{model.description}</p>
                    <p className="text-xs text-text-secondary/70 mt-0.5 flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {model.contextWindow.toLocaleString()} context
                    </p>
                  </div>
                  <DropdownMenu.ItemIndicator className="flex-shrink-0 text-accent">
                    <Check className="w-4 h-4" />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              );
            })}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
