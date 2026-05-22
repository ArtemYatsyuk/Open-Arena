import { useState, useEffect } from 'react';
import { Settings, Cpu, CheckCircle, XCircle, Download, Plus, X, Save, AlertCircle, Check } from 'lucide-react';

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

interface ModelForm {
  id: string;
  name: string;
  baseUrl: string;
  endpoint: string;
  modelId: string;
  apiKeyEnv: string;
  streaming: boolean;
  contextWindow: number;
  description: string;
}

const emptyModel: ModelForm = {
  id: '',
  name: '',
  baseUrl: '',
  endpoint: '/v1/chat/completions',
  modelId: '',
  apiKeyEnv: 'API_KEY',
  streaming: true,
  contextWindow: 32768,
  description: '',
};

export default function ConfigViewer() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [form, setForm] = useState<ModelForm>({ ...emptyModel });

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson('/api/admin/config');
      setConfig(data);
      setJsonText(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleBackup = async () => {
    try {
      const data = await fetchJson('/api/admin/config/backup', { method: 'POST' });
      showSuccess(data.message);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const parsed = JSON.parse(jsonText);
      await fetchJson('/api/admin/config', {
        method: 'PUT',
        body: JSON.stringify({ models: parsed.models, defaultModelId: parsed.defaultModelId }),
      });
      showSuccess('Config saved successfully');
      await loadConfig();
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleAddModel = async () => {
    if (!form.id || !form.name || !form.baseUrl || !form.modelId) {
      setError('Please fill in id, name, baseUrl, and modelId');
      return;
    }

    setError(null);
    try {
      const parsed = JSON.parse(jsonText);
      parsed.models.push({ ...form });
      parsed.defaultModelId = parsed.defaultModelId || form.id;
      const updated = JSON.stringify(parsed, null, 2);
      setJsonText(updated);
      setForm({ ...emptyModel });
      showSuccess('Model added to editor. Click "Save Changes" to persist.');
    } catch (e: any) {
      setError('Invalid JSON: ' + e.message);
    }
  };

  const handleRemoveModel = (index: number) => {
    try {
      const parsed = JSON.parse(jsonText);
      const removedId = parsed.models[index]?.id;
      parsed.models.splice(index, 1);
      if (removedId && parsed.defaultModelId === removedId) {
        parsed.defaultModelId = parsed.models[0]?.id || '';
      }
      setJsonText(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setError('Invalid JSON: ' + e.message);
    }
  };

  if (loading) return <div className="p-8 text-text-secondary animate-fadeIn">Loading config...</div>;

  const currentModels = (() => {
    try { return JSON.parse(jsonText).models || []; } catch { return []; }
  })();

  const isValidJson = (() => {
    try { JSON.parse(jsonText); return true; } catch { return false; }
  })();

  return (
    <div className="p-6 animate-fadeIn space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Config</h1>
            <p className="text-sm text-text-secondary">Manage models and application settings</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackup}
            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border rounded-xl hover:bg-bg-primary/60 transition text-sm"
          >
            <Download className="w-4 h-4" />
            Backup
          </button>
          <button
            onClick={handleSave}
            disabled={!isValidJson || saving}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover transition disabled:opacity-30 text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-xl text-sm text-success animate-fadeIn">
          <Check className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Add Model Form + Model List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Model */}
        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" />
            Add Model
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">ID</label>
                <input
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="my-model"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="My Model"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Base URL</label>
              <input
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="https://api.example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Endpoint</label>
                <input
                  value={form.endpoint}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="/v1/chat/completions"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Model ID</label>
                <input
                  value={form.modelId}
                  onChange={(e) => setForm({ ...form, modelId: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="provider/model-name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">API Key Env</label>
                <input
                  value={form.apiKeyEnv}
                  onChange={(e) => setForm({ ...form, apiKeyEnv: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="MY_API_KEY"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Context Window</label>
                <input
                  type="number"
                  value={form.contextWindow}
                  onChange={(e) => setForm({ ...form, contextWindow: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="Model description"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.streaming}
                onChange={(e) => setForm({ ...form, streaming: e.target.checked })}
                className="rounded border-border"
              />
              Streaming support
            </label>
            <button
              onClick={handleAddModel}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add to config
            </button>
          </div>
        </div>

        {/* Model List */}
        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            Models ({currentModels.length})
          </h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {currentModels.length === 0 ? (
              <p className="text-sm text-text-secondary p-4 text-center">No models configured</p>
            ) : (
              currentModels.map((model: any, i: number) => (
                <div
                  key={model.id || i}
                  className="flex items-center gap-3 p-3 bg-bg-primary rounded-xl group"
                >
                  {model.streaming ? (
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{model.name || model.id}</p>
                    <p className="text-xs text-text-secondary truncate">
                      {model.modelId} · {model.contextWindow?.toLocaleString()} ctx
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveModel(i)}
                    className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Remove model"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* JSON Editor */}
      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4 text-text-secondary" />
            config.json
          </span>
          {!isValidJson && (
            <span className="text-xs text-danger flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Invalid JSON
            </span>
          )}
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full h-[400px] p-4 text-sm font-mono bg-[#1e1e1e] text-[#d4d4d4] border-0 resize-y focus:outline-none leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
