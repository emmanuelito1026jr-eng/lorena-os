import { useEffect, useRef, useId } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Shared form styling constants used by all dashboard modals
export const inputClass = 'w-full px-3 py-2.5 border border-dashboard-border rounded-lg font-lato text-sm text-dashboard-body placeholder:text-dashboard-secondary focus:outline-none focus:border-dashboard-gold/50 focus:ring-1 focus:ring-dashboard-gold/20 min-h-[44px]';
export const errorInputClass = 'w-full px-3 py-2.5 border border-red-400 rounded-lg font-lato text-sm text-dashboard-body placeholder:text-dashboard-secondary focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 min-h-[44px]';
export const labelClass = 'font-lato text-xs font-medium text-dashboard-secondary mb-1 block';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const first = dialogRef.current.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div ref={dialogRef} className={`bg-white rounded-xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="flex items-center justify-between p-5 border-b border-dashboard-border sticky top-0 bg-white rounded-t-xl z-10">
          <h2 id={titleId} className="font-playfair text-lg font-bold text-dashboard-black">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-dashboard-secondary hover:text-dashboard-body hover:bg-dashboard-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
