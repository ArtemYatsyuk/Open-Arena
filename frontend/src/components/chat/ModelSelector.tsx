import { useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Check, Database } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { fetchModels } from '@/utils/modelCache';
import { cn } from '@/lib/utils';

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
        <button className="flex items-center gap-2 h-8 px-3 bg-muted border border-border rounded-lg text-sm hover:border-ring/50 transition-all outline-none">
          {selected?.image ? (
            <img src={selected.image} alt="" className="w-5 h-5 rounded object-contain" />
          ) : null}
          <span className="font-medium max-w-[120px] truncate text-foreground">
            {selected?.name || 'Select model'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="w-72 bg-popover border border-border rounded-xl shadow-2xl z-50 p-2 animate-fadeIn"
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                  className={cn(
                    'group flex items-start gap-3 p-3 rounded-lg cursor-pointer outline-none transition-all select-none',
                    isSelected
                      ? 'bg-accent/10 ring-1 ring-accent/30'
                      : 'hover:bg-accent/50 data-[highlighted]:bg-accent/50',
                  )}
                >
                  {model.image ? (
                    <img
                      src={model.image}
                      alt=""
                      className="w-10 h-10 rounded-lg object-contain shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 shadow-sm">
                      <Database className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{model.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {model.description}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {model.contextWindow.toLocaleString()} context
                    </p>
                  </div>
                  <DropdownMenu.ItemIndicator className="shrink-0 text-foreground">
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
