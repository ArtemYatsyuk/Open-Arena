import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Settings, Palette, Database, BookOpen, MessageCircle, Sun, Moon, Trash2, X, Globe, Brain } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const addToast = useUIStore((s) => s.addToast);
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize') || '16'));
  const [compactMode, setCompactMode] = useState(localStorage.getItem('compactMode') === 'true');
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'data' | 'docs'>('general');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFontSize(parseInt(localStorage.getItem('fontSize') || '16'));
      setCompactMode(localStorage.getItem('compactMode') === 'true');
      setActiveTab('general');
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    setVoices(window.speechSynthesis.getVoices());
    const handler = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handler);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('fontSize', String(fontSize));
    localStorage.setItem('compactMode', String(compactMode));
    document.documentElement.style.fontSize = `${fontSize}px`;
    addToast('Settings saved successfully', 'success');
    onClose();
  };

  const handleClearData = () => {
    if (confirm('Are you sure? This will clear all local data including preferences.')) {
      localStorage.clear();
      addToast('Local data cleared', 'info');
      onClose();
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> },
    { id: 'docs', label: 'Docs', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div
        className={`bg-bg-primary border border-border rounded-2xl w-full max-h-[90vh] flex flex-col shadow-2xl ${activeTab === 'docs' ? 'max-w-2xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Settings</h2>
              <p className="text-xs text-text-secondary">Customize your experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-secondary rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition ${
                activeTab === tab.id
                  ? 'text-accent border-b-2 border-accent bg-accent/5'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Profile */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Profile
                </h3>
                <div className="flex flex-col gap-1 p-4 bg-bg-secondary rounded-xl">
                  <p className="font-semibold">{user?.username}</p>
                  <p className="text-sm text-text-secondary">{user?.email}</p>
                  <span className="self-start mt-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full font-medium">
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Community */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Community
                </h3>
                <a
                  href="https://discord.gg/cDvKQkYQxu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-bg-secondary rounded-xl hover:bg-accent/5 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#5865F2]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium group-hover:text-accent transition">Join our Discord</p>
                    <p className="text-xs text-text-secondary">Get help, share feedback, and stay updated</p>
                  </div>
                  <span className="text-xs text-text-secondary/50 group-hover:text-accent transition">&rarr;</span>
                </a>
            </div>

              {/* TTS Voice */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Text-to-Speech Voice
                </h3>
                <div className="p-4 bg-bg-secondary rounded-xl">
                  <select
                    value={localStorage.getItem('ttsVoice') || ''}
                    onChange={(e) => {
                      localStorage.setItem('ttsVoice', e.target.value);
                      window.speechSynthesis.cancel();
                    }}
                    className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">System default</option>
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-text-secondary/70 mt-2">
                    Choose the voice used for reading responses aloud.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Theme
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'light'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white to-gray-100 border border-border mx-auto mb-2 flex items-center justify-center">
                      <Sun className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-sm font-medium">Light</p>
                    <p className="text-xs text-text-secondary">Clean & bright</p>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 border border-border mx-auto mb-2 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-sm font-medium">Dark</p>
                    <p className="text-xs text-text-secondary">Easy on eyes</p>
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Font Size
                </h3>
                <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-xl">
                  <button
                    onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-bg-primary border border-border rounded-xl hover:border-accent/50 transition text-lg font-medium"
                  >
                    A-
                  </button>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                    <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-200"
                        style={{ width: `${((fontSize - 12) / 8) * 100}%` }}
                      />
                    </div>
                    <p className="text-center text-sm font-medium mt-1">{fontSize}px</p>
                  </div>
                  <button
                    onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                    className="w-10 h-10 flex items-center justify-center bg-bg-primary border border-border rounded-xl hover:border-accent/50 transition text-lg font-medium"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Compact Mode */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Display
                </h3>
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl">
                  <div>
                    <p className="text-sm font-medium">Compact Mode</p>
                    <p className="text-xs text-text-secondary">Reduce spacing for more content</p>
                  </div>
                  <button
                    onClick={() => setCompactMode(!compactMode)}
                    className={`w-12 h-7 rounded-full transition-all duration-200 relative ${
                      compactMode ? 'bg-accent' : 'bg-border'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-md ${
                        compactMode ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="flex gap-0 flex-1 min-h-0">
              {/* Chapter sidebar */}
              <nav className="w-44 flex-shrink-0 border-r border-border overflow-y-auto p-3 space-y-0.5 text-sm">
                {[
                  { id: 'docs-getting-started', label: 'Getting Started' },
                  { id: 'docs-chat-basics', label: 'Chat Basics' },
                  { id: 'docs-web-search', label: 'Web Search & Citations' },
                  { id: 'docs-custom-models', label: 'Creating Custom Models' },
                  { id: 'docs-filters', label: 'Filter System' },
                  { id: 'docs-reasoning', label: 'Reasoning & Thinking' },
                  { id: 'docs-admin', label: 'Admin Panel' },
                  { id: 'docs-shortcuts', label: 'Keyboard Shortcuts' },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => document.getElementById(ch.id)?.scrollIntoView({ behavior: 'smooth' })}
                    className="block w-full text-left px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition"
                  >
                    {ch.label}
                  </button>
                ))}
              </nav>
              {/* Chapter content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-8 text-sm leading-relaxed">
                <section id="docs-getting-started">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Getting Started
                  </h3>
                  <p className="text-text-secondary mb-2">
                    Open Arena is a multi-model AI chat platform. You can switch between AI models, toggle web search for real-time information, browse conversation history, and manage everything from a clean interface.
                  </p>
                  <p className="text-text-secondary mb-2">
                    To get started, <strong>log in</strong> or <strong>register</strong> an account. Once logged in, you'll see the chat interface with a sidebar for conversation management and a main area for chatting.
                  </p>
                  <p className="text-text-secondary">
                    The sidebar shows your conversations grouped by date. Click any conversation to open it, or click <strong>+ New conversation</strong> to start fresh.
                  </p>
                </section>

                <section id="docs-chat-basics">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Chat Basics
                  </h3>
                  <ul className="space-y-1.5 text-text-secondary list-disc list-inside">
                    <li><strong>Send a message</strong> &mdash; type in the input box and press Enter</li>
                    <li><strong>New line</strong> &mdash; press Shift + Enter</li>
                    <li><strong>New conversation</strong> &mdash; click the + button in the sidebar or press Ctrl + K</li>
                    <li><strong>Switch models</strong> &mdash; use the dropdown above the chat input</li>
                    <li><strong>Regenerate</strong> &mdash; click the ↻ icon below any AI response to re-generate it. Multiple versions are preserved &mdash; use the <code>‹ 1/2 ›</code> arrows to navigate between them.</li>
                    <li><strong>Toggle sidebar</strong> &mdash; press Ctrl + / or click the hamburger menu</li>
                    <li><strong>Copy response</strong> &mdash; hover over a message and click the Copy button</li>
                  </ul>
                </section>

                <section id="docs-web-search">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Web Search & Citations
                  </h3>
                  <p className="text-text-secondary mb-2">
                    Open Arena can search the web in real-time before the AI responds. Toggle the <Globe className="w-3.5 h-3.5 inline" /> icon next to the input to enable web search for your next message. The feature uses a SearXNG instance (configurable in <code>config.json</code>).
                  </p>
                  <p className="text-text-secondary mb-2">
                    When web search is active:
                  </p>
                  <ul className="space-y-1.5 text-text-secondary list-disc list-inside mb-2">
                    <li>The AI receives live search results as context</li>
                    <li>Search results appear in a collapsible blue panel above the response</li>
                    <li>Each source gets a numbered badge with clickable title and snippet</li>
                    <li>The AI can reference sources using <code>[1]</code>, <code>[2]</code> notation, which become clickable links</li>
                  </ul>
                  <p className="text-text-secondary">
                    If the search service is unreachable, a fallback message with today's date is injected so the model still has current context.
                  </p>
                </section>

                <section id="docs-custom-models">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Creating Custom Models
                  </h3>
                  <p className="text-text-secondary mb-2">
                    Models are defined in <code>config.json</code> at the project root. Each model entry specifies the API endpoint, authentication, and capabilities. You can add models from OpenAI, OpenRouter, or any OpenAI-compatible API.
                  </p>
                  <pre className="bg-bg-secondary border border-border rounded-xl p-4 overflow-x-auto text-xs font-mono mb-2">
{`{
  "id": "my-model",
  "name": "My Custom Model",
  "baseUrl": "https://api.openai.com/v1",
  "endpoint": "/chat/completions",
  "modelId": "gpt-4o",
  "apiKeyEnv": "OPENAI_API_KEY",
  "streaming": true,
  "contextWindow": 8192,
  "description": "My custom model"
}`}
                  </pre>
                  <p className="text-text-secondary mb-2">
                    To add a model:
                  </p>
                  <ol className="space-y-1.5 text-text-secondary list-decimal list-inside mb-2">
                    <li>Go to <strong>Admin Panel → Config</strong></li>
                    <li>Add the model entry in the JSON editor or use the <strong>Add Model</strong> form</li>
                    <li>Set the <code>apiKeyEnv</code> to the environment variable name that holds the API key</li>
                    <li>Click <strong>Save Configuration</strong> and the model will appear in the dropdown</li>
                  </ol>
                  <p className="text-text-secondary">
                    The <code>baseUrl</code> and <code>endpoint</code> are joined to form the full API URL. For OpenAI-compatible APIs, use <code>/chat/completions</code> as the endpoint.
                  </p>
                </section>

                <section id="docs-filters">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Filter System (Functions)
                  </h3>
                  <p className="text-text-secondary mb-2">
                    Filters are JavaScript modules that run in a sandboxed Node.js VM on every chat request. Each filter can export an <code>inlet</code> function (runs <em>before</em> the AI responds) and an <code>outlet</code> function (runs <em>after</em>). Use them for rate limiting, content moderation, logging, analytics, or transforming requests/responses.
                  </p>

                  <h4 className="font-semibold mt-3 mb-1">Structure</h4>
                  <pre className="bg-bg-secondary border border-border rounded-xl p-4 overflow-x-auto text-xs font-mono">
{`module.exports = {
  title: "My Filter",

  // Optional valves — configurable values shown in the admin UI
  valves: {
    maxTokens: { type: "number", default: 4096, description: "Max tokens" },
  },

  // Called before the AI request. Return modified body or throw to block.
  inlet: (body, user) => {
    // body — { messages: [...], modelId: string, webSearch: boolean, reasoning: boolean }
    // user — { id: string, role: string }
    return body;
  },

  // Called after the AI responds. Return modified body or throw to reject.
  outlet: (body, user) => {
    // body — { messages: [...] }
    return body;
  }
};`}
                  </pre>

                  <h4 className="font-semibold mt-3 mb-1">Example — Rate Limiter</h4>
                  <p className="text-text-secondary mb-1">Blocks a user after 1 message (uses <code>globalThis</code> for persistent state):</p>
                  <pre className="bg-bg-secondary border border-border rounded-xl p-4 overflow-x-auto text-xs font-mono">
{`module.exports = {
  title: "One Message Limiter",
  inlet: (body, user) => {
    if (!globalThis._counts) globalThis._counts = {};
    globalThis._counts[user.id] = (globalThis._counts[user.id] || 0) + 1;
    if (globalThis._counts[user.id] > 1) {
      throw new Error("Rate limit exceeded");
    }
    return body;
  },
  outlet: (body, user) => body,
};`}
                  </pre>

                  <h4 className="font-semibold mt-3 mb-1">How to Create a Filter</h4>
                  <ol className="space-y-1.5 text-text-secondary list-decimal list-inside">
                    <li>Go to <strong>Admin Panel → Filters</strong></li>
                    <li>Click <strong>New Filter</strong></li>
                    <li>Give it a name, priority (lower runs first), and paste your JavaScript code</li>
                    <li>Click <strong>Test</strong> to validate the code compiles, then <strong>Save</strong></li>
                    <li>Toggle the filter <strong>Active</strong> to enable it for all chat requests</li>
                  </ol>
                  <p className="text-text-secondary mt-2">
                    If the <code>inlet</code> function throws an error, the chat request is rejected and the user sees the error message. Use this for blocking unwanted requests.
                  </p>
                </section>

                <section id="docs-reasoning">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Reasoning & Thinking
                  </h3>
                  <p className="text-text-secondary mb-2">
                    Some AI models support <strong>reasoning</strong> (also called thinking or chain-of-thought). This is an internal monologue where the model works through a problem before producing its final answer.
                  </p>
                  <p className="text-text-secondary mb-2">
                    Reasoning is displayed in a collapsible amber <strong>Thinking Process</strong> section above the response. During generation, it updates in real-time. After completion, it collapses by default.
                  </p>
                  <p className="text-text-secondary mb-2">
                    To control this feature, use the <Brain className="w-3.5 h-3.5 inline" /> toggle next to the chat input. When enabled (default), the AI will include reasoning in its responses if the model supports it. When disabled, reasoning is not requested and only the final answer is shown.
                  </p>
                  <p className="text-text-secondary">
                    Not all models support reasoning. Models from providers like NVIDIA NIM, DeepSeek, and some OpenAI models expose a <code>reasoning_content</code> field in their streaming responses.
                  </p>
                </section>

                <section id="docs-admin">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Admin Panel
                  </h3>
                  <p className="text-text-secondary mb-2">
                    Users with the <strong>ADMIN</strong> role can access the admin panel via the <code>Layers</code> icon in the sidebar footer. The panel includes:
                  </p>
                  <ul className="space-y-1.5 text-text-secondary list-disc list-inside">
                    <li><strong>Dashboard</strong> &mdash; usage stats: total users, active today, conversation count, messages per day chart</li>
                    <li><strong>Users</strong> &mdash; manage accounts, assign USER/ADMIN roles, ban/unban with reason, view conversation counts</li>
                    <li><strong>Conversations</strong> &mdash; browse all user conversations with search, pagination, and an inline message viewer using ReactMarkdown</li>
                    <li><strong>Config</strong> &mdash; edit the server <code>config.json</code> in a JSON editor, add/remove models via a form, create timestamped backups</li>
                    <li><strong>Filters</strong> &mdash; create, edit, test, and manage JavaScript filters that hook into every chat request</li>
                  </ul>
                </section>

                <section id="docs-shortcuts">
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Keyboard Shortcuts
                  </h3>
                  <div className="space-y-2">
                    {[
                      { keys: 'Ctrl + K', action: 'New conversation' },
                      { keys: 'Ctrl + /', action: 'Toggle sidebar' },
                      { keys: 'Enter', action: 'Send message' },
                      { keys: 'Shift + Enter', action: 'New line' },
                      { keys: 'Escape', action: 'Close panels' },
                    ].map((shortcut) => (
                      <div key={shortcut.keys} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                        <span>{shortcut.action}</span>
                        <kbd className="px-2 py-1 bg-bg-primary border border-border rounded text-xs font-mono">{shortcut.keys}</kbd>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-danger rounded-full" />
                  Local Data
                </h3>
                <div className="p-4 bg-bg-secondary rounded-xl">
                  <p className="text-sm text-text-secondary mb-3">
                    Clear all locally stored preferences and cached data. This won't affect your conversations or account.
                  </p>
                  <button
                    onClick={handleClearData}
                    className="w-full py-3 text-sm font-medium text-danger bg-danger/10 rounded-xl hover:bg-danger/20 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Local Data
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex gap-3">
          {activeTab === 'docs' ? (
            <button onClick={onClose} className="flex-1 py-3 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent-hover transition shadow-lg shadow-accent/20">Close</button>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 py-3 text-sm font-medium bg-bg-secondary border border-border rounded-xl hover:border-accent/50 transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-3 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent-hover transition shadow-lg shadow-accent/20">Save Changes</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
