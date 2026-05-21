import { useState, useEffect } from 'react';

export default function ConfigViewer() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/models', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-text-secondary">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-heading font-medium mb-6">Config</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-bg-secondary border border-border rounded-card p-4">
          <h2 className="text-sm font-medium mb-4">App Settings</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Name</span>
              <span>Open Arena</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Default Model</span>
              <span>{config.defaultModelId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Registration</span>
              <span>Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Max Conversations</span>
              <span>200</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-card p-4">
          <h2 className="text-sm font-medium mb-4">Active Models</h2>
          <div className="space-y-3">
            {config.models.map((model: any) => (
              <div key={model.id} className="flex items-center gap-3 p-2 bg-bg-primary rounded">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: model.id.includes('gpt') ? '#10A37F' : '#D97757',
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{model.name}</p>
                  <p className="text-xs text-text-secondary">
                    {model.contextWindow.toLocaleString()} context · {model.streaming ? 'Streaming' : 'Non-streaming'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-card overflow-hidden">
        <div className="px-4 py-2 border-b border-border text-sm font-medium">config.json</div>
        <pre className="p-4 text-sm font-mono overflow-x-auto bg-[#1e1e1e] text-[#d4d4d4]">
          <code>{JSON.stringify(config, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}
