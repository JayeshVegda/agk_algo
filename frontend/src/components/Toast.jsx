import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Copy, X } from 'lucide-react';

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success' || toast.type === 'copy';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 transform translate-y-0 flex items-start gap-3 text-xs font-mono bg-akg-card text-akg-text ${
              isSuccess
                ? 'border-emerald-500/40'
                : isError
                ? 'border-rose-500/40'
                : isWarning
                ? 'border-amber-500/40'
                : 'border-akg-hairline'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'copy' ? (
                <Copy className="h-4 w-4 text-akg-green" />
              ) : isSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-akg-green" />
              ) : isError ? (
                <XCircle className="h-4 w-4 text-rose-500" />
              ) : isWarning ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <Info className="h-4 w-4 text-akg-accent" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="font-bold text-akg-text text-[11px] mb-0.5">{toast.title}</div>
              )}
              <div className="text-[11px] leading-relaxed text-akg-muted break-words font-sans">{toast.message}</div>
            </div>

            {toast.action && (
              <button
                onClick={() => { toast.action.onClick?.(); onDismiss(toast.id); }}
                className="shrink-0 rounded-md border border-akg-hairline bg-akg-raised px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wide transition-opacity hover:opacity-80 cursor-pointer"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-akg-muted hover:text-akg-text p-0.5 rounded cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
