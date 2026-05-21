import { useUIStore } from '../../stores/uiStore';

export default function ToastContainer() {
  const toasts = useUIStore((s: any) => s.toasts);
  const removeToast = useUIStore((s: any) => s.removeToast);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast: any) => (
        <div
          key={toast.id}
          className={`p-3 rounded-card shadow-lg text-sm text-white flex items-center justify-between ${
            toast.type === 'success'
              ? 'bg-success'
              : toast.type === 'error'
              ? 'bg-danger'
              : 'bg-accent'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-3 hover:opacity-70"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
