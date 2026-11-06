import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function Toolbar({
  tabs, activeTab, onTab,
  chips, chipValue, onChip,
  search, onSearch, searchPlaceholder = 'Search…',
  actions, className,
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tabs && tabs.length > 0 && (
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-akg-hairline bg-slate-100 dark:bg-akg-raised p-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => onTab(t.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                activeTab === t.id
                  ? 'bg-akg-cta text-akg-cta-text shadow-sm'
                  : 'text-slate-600 dark:text-akg-muted hover:text-slate-900 dark:hover:text-akg-text',
              )}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1.5 font-mono tabular-nums opacity-75">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {chips && chips.length > 0 && chips.map((c) => (
        <button
          key={c.id}
          onClick={() => onChip(c.id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
            chipValue === c.id
              ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-akg-accent shadow-xs'
              : 'border-slate-200 dark:border-akg-hairline bg-slate-100 dark:bg-akg-raised text-slate-700 dark:text-akg-muted hover:text-slate-900 dark:hover:text-akg-text',
          )}
        >
          {c.label}
          {c.count !== undefined && c.count > 0 && (
            <span className={cn('rounded px-1.5 font-mono text-[10px] tabular-nums', chipValue === c.id ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-akg-accent' : 'bg-white dark:bg-akg-card text-slate-700 dark:text-akg-muted border border-slate-200 dark:border-akg-hairline')}>
              {c.count}
            </span>
          )}
          {c.danger && c.count > 0 && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
          )}
        </button>
      ))}

      <div className="ml-auto flex items-center gap-2">
        {search !== undefined && (
          <label className="relative block">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-akg-muted/70" />
            <input
              type="text"
              name="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-slate-300 dark:border-akg-hairline bg-white dark:bg-akg-raised pl-8 pr-3.5 text-xs text-slate-900 dark:text-akg-text placeholder:text-slate-400 dark:placeholder:text-akg-muted/60 focus:border-emerald-500 focus:outline-none sm:w-56"
            />
          </label>
        )}
        {actions}
      </div>
    </div>
  );
}
