import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * One toolbar row for a list view: tabs, counted filter chips, search, and
 * trailing actions. Every slot is optional; tabs are the segmented control,
 * chips are rounded pills with counts.
 */
export function Toolbar({
  tabs, activeTab, onTab,
  chips, chipValue, onChip,
  search, onSearch, searchPlaceholder = 'Search…',
  actions, className,
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tabs && tabs.length > 0 && (
        <div className="inline-flex rounded-xl border border-white/10 bg-[#0A0D13] p-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => onTab(t.id)}
              className={cn(
                'rounded-[9px] px-3 py-1.5 text-xs font-semibold transition-all',
                activeTab === t.id
                  ? 'bg-[#F3C653]/12 text-akg-gold ring-1 ring-[#F3C653]/25'
                  : 'text-akg-muted hover:text-white',
              )}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1.5 font-data tabular-nums opacity-60">{t.count}</span>
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
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
            chipValue === c.id
              ? 'border-[#F3C653]/60 bg-[#F3C653]/10 text-akg-gold'
              : 'border-white/10 bg-white/[0.03] text-akg-muted hover:border-[#F3C653]/40 hover:text-akg-silver',
          )}
        >
          {c.label}
          {c.count !== undefined && c.count > 0 && (
            <span className={cn('rounded-full px-1.5 font-data text-[10px] tabular-nums', chipValue === c.id ? 'bg-[#F3C653]/20 text-akg-gold' : 'bg-white/[0.06] text-akg-muted')}>
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
              className="h-9 w-full rounded-full border border-white/10 bg-[#0A0D13] pl-8 pr-3.5 text-xs text-white placeholder:text-akg-muted/60 focus:border-[#F3C653]/50 focus:outline-none sm:w-56"
            />
          </label>
        )}
        {actions}
      </div>
    </div>
  );
}
