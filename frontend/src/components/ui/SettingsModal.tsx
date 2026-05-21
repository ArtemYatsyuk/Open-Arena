import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Settings, Palette, Database, Sun, Moon, Trash2, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const addToast = useUIStore((s) => s.addToast);
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#6C4FF6');
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize') || '16'));
  const [compactMode, setCompactMode] = useState(localStorage.getItem('compactMode') === 'true');
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'data'>('general');

  useEffect(() => {
    if (isOpen) {
      setAvatarColor(user?.avatarColor || '#6C4FF6');
      setFontSize(parseInt(localStorage.getItem('fontSize') || '16'));
      setCompactMode(localStorage.getItem('compactMode') === 'true');
      setActiveTab('general');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const colorOptions = [
    { name: 'Purple', value: '#6C4FF6' },
    { name: 'Green', value: '#10A37F' },
    { name: 'Orange', value: '#D97757' },
    { name: 'Red', value: '#E24B4A' },
    { name: 'Blue', value: '#2563EB' },
    { name: 'Pink', value: '#DB2777' },
    { name: 'Teal', value: '#0D9488' },
    { name: 'Yellow', value: '#D97706' },
  ];

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
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div
        className="bg-bg-primary border border-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
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
                <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-xl">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-semibold shadow-lg"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{user?.username}</p>
                    <p className="text-sm text-text-secondary">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full font-medium">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar Color */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                  Avatar Color
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAvatarColor(color.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-150 ${
                        avatarColor === color.value
                          ? 'bg-accent/10 ring-2 ring-accent'
                          : 'hover:bg-bg-secondary'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full shadow-md"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs text-text-secondary">{color.name}</span>
                    </button>
                  ))}
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

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
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
                      <span className="text-sm">{shortcut.action}</span>
                      <kbd className="px-2 py-1 bg-bg-primary border border-border rounded text-xs font-mono">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium bg-bg-secondary border border-border rounded-xl hover:border-accent/50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent-hover transition shadow-lg shadow-accent/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
