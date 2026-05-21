import { useState, useEffect } from 'react';
import { Settings, Cpu, CheckCircle, XCircle } from 'lucide-react';

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

export default function ConfigViewer() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson('/api/models')
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-text-secondary">Loading...</div>;
  if (error) return <div className="p-8 text-danger">{error}</div>;
  if (!config) return <div className="p-8 text-danger">No config available</div>;

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Config</h1>
          <p className="text-sm text-text-secondary">Application settings and models</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-accent" />
            App Settings
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-secondary">Name</span>
              <span className="font-medium">Open Arena</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-secondary">Default Model</span>
              <span className="font-medium">{config.defaultModelId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-text-secondary">Registration</span>
              <span className="font-medium">Enabled</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-secondary">Max Conversations</span>
              <span className="font-medium">200</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            Active Models
          </h2>
          <div className="space-y-3">
            {config.models.map((model: any) => (
              <div key={model.id} className="flex items-center gap-3 p-3 bg-bg-primary rounded-xl">
                {model.streaming ? (
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-text-secondary flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
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

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-medium flex items-center gap-2">
          <Settings className="w-4 h-4 text-text-secondary" />
          config.json
        </div>
        <pre className="p-4 text-sm font-mono overflow-x-auto bg-[#1e1e1e] text-[#d4d4d4] max-h-96">
          <code>{JSON.stringify(config, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}
