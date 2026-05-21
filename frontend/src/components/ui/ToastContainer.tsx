import { useUIStore } from '../../stores/uiStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const toasts = useUIStore((s: any) => s.toasts);
  const removeToast = useUIStore((s: any) => s.removeToast);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 flex-shrink-0" />;
      case 'error': return <AlertCircle className="w-4 h-4 flex-shrink-0" />;
      default: return <Info className="w-4 h-4 flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast: any) => (
        <div
          key={toast.id}
          className={`p-4 rounded-xl shadow-lg text-sm text-white flex items-center gap-3 animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-success'
              : toast.type === 'error'
              ? 'bg-danger'
              : 'bg-accent'
          }`}
        >
          {getIcon(toast.type)}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
