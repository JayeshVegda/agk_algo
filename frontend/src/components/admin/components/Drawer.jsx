import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function Drawer({
  open, onClose,
  title, subtitle, actions,
  width = 'md',
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
          'absolute inset-y-0 right-0 flex w-full flex-col border-l border-akg-hairline bg-akg-card text-akg-text shadow-2xl',
          'animate-[drawer-in_.18s_ease-out]',
          width === 'lg' ? 'max-w-2xl' : 'max-w-xl',
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-akg-hairline px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-bold text-akg-text">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate font-mono text-[11px] text-akg-muted">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {actions}
            <button
              onClick={onClose}
              className="rounded-md border border-akg-hairline p-1.5 text-akg-muted transition-colors hover:border-akg-accent/40 hover:text-akg-accent cursor-pointer"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="border-t border-akg-hairline px-5 py-3">{footer}</footer>
        )}
      </div>
    </div>
  );
}
