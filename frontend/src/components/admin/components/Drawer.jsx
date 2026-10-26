import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Right-side drawer for record dossiers. The open record lives in the URL
 * (?id=…), synced by the owning section; Close just fires onClose.
 */
export default function Drawer({
  open, onClose,
  title, subtitle, actions,
  width = 'md', // 'md' | 'lg'
  children, footer,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); } };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Details'}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col border-l border-white/10 bg-[#0B0E14] shadow-2xl',
          'animate-[drawer-in_.18s_ease-out]',
          width === 'lg' ? 'max-w-2xl' : 'max-w-xl',
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-bold text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate font-data text-[11px] text-akg-muted">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {actions}
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 p-1.5 text-akg-muted transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="border-t border-white/[0.07] px-5 py-3">{footer}</footer>
        )}
      </div>
    </div>
  );
}
