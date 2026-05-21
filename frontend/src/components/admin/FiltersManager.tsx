import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Play, CheckCircle, XCircle } from 'lucide-react';

interface Filter {
  id: string;
  name: string;
  description: string;
  code: string;
  isGlobal: boolean;
  isActive: boolean;
  priority: number;
  valves: string;
  author: { username: string };
  createdAt: string;
  updatedAt: string;
}

const defaultCode = `// Open Arena Filter
// Export inlet/outlet functions to hook into chat requests.
// Return the (possibly modified) body or throw to block.

module.exports = {
  title: "My Filter",

  // Optional: declare valves (configurable values)
  valves: {
    maxTokens: { type: "number", default: 4096, description: "Max tokens" },
  },

  // Called before each chat request. Return modified body or throw to block.
  inlet: (body, user) => {
    // body: { messages, modelId, webSearch }
    // user: { id, role }
    return body;
  },

  // Called after each response. Return modified body or throw to reject.
  outlet: (body, user) => {
    // body: { messages }
    // user: { id, role }
    return body;
  }
};
`;

export default function FiltersManager() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    code: defaultCode,
    isGlobal: false,
    isActive: true,
    priority: 0,
    valves: '{}',
  });
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const fetchFilters = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/filters/admin', { credentials: 'include' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load');
      setFilters(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFilters(); }, []);

  const handleSave = async () => {
    setError('');
    setTestResult(null);
    try {
      const body = { ...form };
      const url = editingId
        ? `/api/filters/admin/${editingId}`
        : '/api/filters/admin';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', description: '', code: defaultCode, isGlobal: false, isActive: true, priority: 0, valves: '{}' });
      await fetchFilters();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this filter?')) return;
    try {
      const res = await fetch(`/api/filters/admin/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchFilters();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEdit = (f: Filter) => {
    setForm({
      name: f.name,
      description: f.description,
      code: f.code,
      isGlobal: f.isGlobal,
      isActive: f.isActive,
      priority: f.priority,
      valves: f.valves,
    });
    setEditingId(f.id);
    setShowForm(true);
    setTestResult(null);
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const res = await fetch('/api/filters/admin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: form.code }),
      });
      setTestResult(await res.json());
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    }
  };

  const handleToggleActive = async (f: Filter) => {
    try {
      const res = await fetch(`/api/filters/admin/${f.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !f.isActive }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      await fetchFilters();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div className="p-6 text-text-secondary">Loading filters...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Filters</h2>
          <p className="text-sm text-text-secondary">JS hooks that run before (inlet) and after (outlet) every chat request.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchFilters} className="btn-ghost p-2" title="Refresh"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', description: '', code: defaultCode, isGlobal: false, isActive: true, priority: 0, valves: '{}' }); setTestResult(null); }} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
            <Plus className="h-4 w-4" /> New Filter
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {showForm && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editingId ? 'Edit' : 'New'} Filter</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm" placeholder="Rate Limiter" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Priority (lower = runs first)</label>
              <input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm" placeholder="Optional description" />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Code (JavaScript)</label>
            <textarea value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm font-mono" rows={16} />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isGlobal} onChange={e => setForm({ ...form, isGlobal: e.target.checked })} className="rounded" />
              Global
            </label>
          </div>

          <div className="flex gap-2">
            <button onClick={handleTest} className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-border">
              <Play className="h-4 w-4" /> Test
            </button>
            <button onClick={handleSave} className="btn-primary px-6 py-2 rounded-xl text-sm">Save</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-ghost px-4 py-2 rounded-xl text-sm">Cancel</button>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult.success ? 'Compiled successfully' : testResult.error}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {filters.length === 0 && !loading && (
          <div className="text-center text-text-secondary py-12">No filters yet. Create one to start hooking into chat requests.</div>
        )}
        {filters.map((f) => (
          <div key={f.id} className="bg-bg-secondary border border-border rounded-xl p-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{f.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${f.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {f.isActive ? 'Active' : 'Disabled'}
                </span>
                {f.isGlobal && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">Global</span>}
                <span className="text-xs text-text-secondary">P{f.priority}</span>
              </div>
              {f.description && <p className="text-xs text-text-secondary mt-1">{f.description}</p>}
              <p className="text-xs text-text-secondary mt-1">by {f.author.username}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => handleToggleActive(f)} className="btn-ghost p-2" title={f.isActive ? 'Disable' : 'Enable'}>
                {f.isActive ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-gray-400" />}
              </button>
              <button onClick={() => handleEdit(f)} className="btn-ghost p-2 text-sm">Edit</button>
              <button onClick={() => handleDelete(f.id)} className="btn-ghost p-2 text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
