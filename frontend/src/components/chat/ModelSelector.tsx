import { useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Check, Database } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { fetchModels } from '../../utils/modelCache';

interface Model {
  id: string;
  name: string;
  contextWindow: number;
  description: string;
  image?: string;
}

export default function ModelSelector({ currentModelId }: { currentModelId?: string }) {
  const [models, setModels] = useState<Model[]>([]);
  const selectedModelId = useChatStore((s) => s.selectedModelId);
  const setSelectedModelId = useChatStore((s) => s.setSelectedModelId);

  useEffect(() => {
    fetchModels().then((m) => {
      setModels(m);
      const initialId = currentModelId || 'nemotron-nano';
      setSelectedModelId(initialId);
    });
  }, [currentModelId, setSelectedModelId]);

  const selected = models.find((m) => m.id === selectedModelId);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-xl text-sm hover:border-accent/50 transition-all duration-150 hover:shadow-md outline-none">
          {selected?.image ? (
            <img src={selected.image} alt="" className="w-6 h-6 rounded object-contain" />
          ) : null}
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

          <DropdownMenu.RadioGroup value={selectedModelId} onValueChange={setSelectedModelId}>
            {models.map((model) => {
              const isSelected = selectedModelId === model.id;
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
                  {model.image ? (
                    <img src={model.image} alt="" className="w-10 h-10 rounded-xl object-contain flex-shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-bg-secondary border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Database className="w-5 h-5 text-text-secondary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{model.name}</span>
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