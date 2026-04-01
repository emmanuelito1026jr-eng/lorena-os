import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmState {
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
}

let listener: ((state: ConfirmState | null) => void) | null = null;

export function confirmAction(message: string, onConfirm: () => void, confirmLabel?: string) {
  listener?.({ message, onConfirm, confirmLabel });
}

export function ConfirmDialogContainer() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    listener = setState;
    return () => { listener = null; };
  }, []);

  useEffect(() => {
    if (!state) return;
    // Auto-focus Cancel (safe default for destructive actions)
    cancelRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setState(null); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [state]);

  if (!state) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) setState(null); }}
    >
      <div ref={dialogRef} className="bg-white rounded-xl shadow-xl w-full max-w-sm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 id="confirm-title" className="font-playfair text-lg font-bold text-dashboard-black mb-2">Confirm Action</h3>
          <p id="confirm-desc" className="font-lato text-sm text-dashboard-secondary">{state.message}</p>
        </div>
        <div className="flex gap-3 p-4 pt-0 justify-center">
          <button
            ref={cancelRef}
            onClick={() => setState(null)}
            className="px-4 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-secondary hover:text-dashboard-body transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={() => { state.onConfirm(); setState(null); }}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {state.confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
