import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function showToast(message: string, type: ToastType = 'success') {
  const toast = { id: ++toastId, message, type };
  listeners.forEach(fn => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (!toasts.length) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[60] space-y-2" aria-live="polite" role="status">
      {toasts.map(toast => (
        <div key={toast.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg font-lato text-sm animate-slide-up ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.message}
          <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} aria-label="Dismiss notification" className="ml-2 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
