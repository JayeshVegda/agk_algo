import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Adaptive dialog: slides up from the bottom edge on phones (thumb zone),
 * centers as a normal dialog from sm: up. Escape and backdrop close it.
 */
export function ActionSheet({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === 'lg' ? 'sm:max-w-2xl' : size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-akg-surface shadow-2xl sm:rounded-2xl',
          maxW
        )}
      >
        {/* grab handle (mobile affordance) */}
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" />

        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-3 sm:pt-5">
          <div className="min-w-0">
            {title && <h2 className="font-display text-base font-bold text-white sm:text-lg">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-akg-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/10 p-2 text-akg-muted transition-colors hover:border-white/25 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-white/[0.07] bg-[#0A0D13]/80 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Styled confirmation replacing window.confirm. */
export function ConfirmSheet({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <ActionSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={message}
      size="sm"
      footer={
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-full border border-white/15 text-sm font-semibold text-akg-silver transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={async () => { onClose(); await onConfirm(); }}
            className={`h-11 flex-1 rounded-full text-sm font-bold transition-all active:scale-[0.98] ${
              danger
                ? 'bg-rose-500 text-white hover:bg-rose-400'
                : 'bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-[#1C1403]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    />
  );
}
