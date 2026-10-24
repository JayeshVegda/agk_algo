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
            className={`pointer-events-auto p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 flex items-start gap-3 text-xs font-mono ${
              isSuccess
                ? 'border-emerald-500/30 bg-[#07130F]/95 text-emerald-300'
                : isError
                ? 'border-rose-500/30 bg-[#16080B]/95 text-rose-300'
                : isWarning
                ? 'border-amber-500/30 bg-[#170E04]/95 text-amber-300'
                : 'border-blue-500/30 bg-[#070E1A]/95 text-blue-300'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'copy' ? (
                <Copy className="h-4 w-4 text-emerald-400" />
              ) : isSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : isError ? (
                <XCircle className="h-4 w-4 text-rose-400" />
              ) : isWarning ? (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              ) : (
                <Info className="h-4 w-4 text-blue-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="font-bold text-white text-[11px] mb-0.5">{toast.title}</div>
              )}
              <div className="text-[11px] leading-relaxed text-slate-300 break-words">{toast.message}</div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
