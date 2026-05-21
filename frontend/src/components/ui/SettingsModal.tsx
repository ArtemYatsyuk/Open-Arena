import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useChatStore } from '../../stores/chatStore';

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
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize') || '15'));
  const [compactMode, setCompactMode] = useState(localStorage.getItem('compactMode') === 'true');

  const colorOptions = ['#6C4FF6', '#10A37F', '#D97757', '#E24B4A', '#3B6D11', '#2563EB', '#7C3AED', '#DB2777'];

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('fontSize', String(fontSize));
    localStorage.setItem('compactMode', String(compactMode));
    document.documentElement.style.fontSize = `${fontSize}px`;
    addToast('Settings saved', 'success');
    onClose();
  };

  const handleClearData = () => {
    if (confirm('Are you sure? This will clear all local data.')) {
      localStorage.clear();
      addToast('Local data cleared', 'info');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-primary border border-border rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-bg-secondary rounded-lg transition">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Profile */}
          <div>
            <h3 className="text-sm font-medium mb-3">Profile</h3>
            <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: avatarColor }}
              >
                {user?.username?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user?.username}</p>
                <p className="text-sm text-text-secondary">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Avatar Color */}
          <div>
            <h3 className="text-sm font-medium mb-3">Avatar Color</h3>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setAvatarColor(color)}
                  className={`w-8 h-8 rounded-full transition-all duration-150 ${
                    avatarColor === color ? 'ring-2 ring-offset-2 ring-accent scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h3 className="text-sm font-medium mb-3">Appearance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-xl">
                <span className="text-sm">Theme</span>
                <div className="flex gap-1 bg-bg-primary rounded-lg p-1">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1.5 text-xs rounded-md transition ${
                      theme === 'light' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1.5 text-xs rounded-md transition ${
                      theme === 'dark' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-xl">
                <span className="text-sm">Font Size</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                    className="w-7 h-7 flex items-center justify-center bg-bg-primary border border-border rounded-lg hover:border-accent/50 transition"
                  >
                    −
                  </button>
                  <span className="text-sm w-8 text-center">{fontSize}px</span>
                  <button
                    onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                    className="w-7 h-7 flex items-center justify-center bg-bg-primary border border-border rounded-lg hover:border-accent/50 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-xl">
                <span className="text-sm">Compact Mode</span>
                <button
                  onClick={() => setCompactMode(!compactMode)}
                  className={`w-11 h-6 rounded-full transition-all duration-200 relative ${
                    compactMode ? 'bg-accent' : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-200 shadow-sm ${
                      compactMode ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data */}
          <div>
            <h3 className="text-sm font-medium mb-3">Data</h3>
            <button
              onClick={handleClearData}
              className="w-full py-2.5 text-sm text-danger bg-danger/10 rounded-xl hover:bg-danger/20 transition"
            >
              Clear Local Data
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm bg-bg-secondary border border-border rounded-xl hover:border-accent/50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 text-sm bg-accent text-white rounded-xl hover:bg-accent-hover transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
