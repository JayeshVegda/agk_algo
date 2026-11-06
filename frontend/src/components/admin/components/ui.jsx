import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Inbox } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { explorerUrl } from '../lib/format';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
  pending_review: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  connected: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  closed: 'bg-slate-100 dark:bg-akg-raised text-slate-700 dark:text-akg-muted border-slate-200 dark:border-akg-hairline',
  settled: 'bg-slate-100 dark:bg-akg-raised text-slate-700 dark:text-akg-muted border-slate-200 dark:border-akg-hairline',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
  in_progress: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30',
};

export function StatusPill({ status, className }) {
  const s = String(status || '').toLowerCase();
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
      STATUS_STYLES[s] || 'bg-akg-raised text-akg-muted border-akg-hairline',
      className
    )}>
      {s === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-akg-green" />}
      {s === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
      {String(status || '').replace(/_/g, ' ')}
    </span>
  );
}

export function TxidCell({ network, txid, full = false }) {
  const [copied, setCopied] = useState(false);
  if (!txid) return <span className="font-mono text-xs text-akg-muted">-</span>;
  const url = explorerUrl(network, txid);
  const short = `${txid.slice(0, 8)}…${txid.slice(-6)}`;
  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={txid}
        className="font-mono text-xs text-akg-accent underline-offset-2 hover:underline"
      >
        {full ? txid : short}
      </a>
      <button
        onClick={() => {
          navigator.clipboard.writeText(txid);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="rounded p-0.5 text-akg-muted transition-colors hover:text-akg-text cursor-pointer"
        title="Copy TXID"
      >
        {copied ? <Check className="h-3 w-3 text-akg-green" /> : <Copy className="h-3 w-3" />}
      </button>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-akg-muted hover:text-akg-text" title="Open in explorer">
        <ExternalLink className="h-3 w-3" />
      </a>
    </span>
  );
}

export function StatCard({ label, value, sub, tone = 'default', onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex w-full flex-col rounded-xl border p-4 text-left transition-all bg-akg-card',
        onClick && 'cursor-pointer hover:border-akg-accent/40 hover:-translate-y-0.5 shadow-sm',
        !onClick && 'cursor-default',
        tone === 'gold' || tone === 'emerald'
          ? 'border-akg-accent/30 ring-1 ring-akg-accent/20'
          : 'border-akg-hairline'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-akg-muted">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-akg-accent" />}
      </div>
      <span className="mt-1.5 font-mono text-2xl font-bold text-akg-text tabular-nums">{value}</span>
      {sub && <span className="mt-0.5 text-[11px] text-akg-muted">{sub}</span>}
    </button>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-akg-hairline bg-akg-card px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-akg-hairline bg-akg-raised">
        <Icon className="h-5 w-5 text-akg-muted" />
      </div>
      <h3 className="mt-4 font-display text-base font-bold text-akg-text">{title}</h3>
      {hint && <p className="mt-1 max-w-xs text-xs leading-relaxed text-akg-muted">{hint}</p>}
    </div>
  );
}

export function SectionHeader({ title, sub, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-extrabold tracking-tight text-akg-text sm:text-2xl">{title}</h1>
        {sub && <p className="mt-1 text-xs leading-relaxed text-akg-muted sm:text-sm">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FilterChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-md border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
            value === o.id
              ? 'border-transparent bg-akg-cta text-akg-cta-text shadow-sm'
              : 'border-akg-hairline bg-akg-raised text-akg-muted hover:text-akg-text'
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1 font-mono opacity-80">({o.count})</span>}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...', id = 'akg-admin-search' }) {
  return (
    <input
      type="text"
      id={id}
      name="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-akg-hairline bg-akg-raised px-4 text-sm text-akg-text placeholder:text-akg-muted/70 focus:border-akg-accent focus:outline-none sm:w-64"
    />
  );
}

export const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-900 dark:text-akg-text';
export const inputCls =
  'w-full rounded-xl border border-slate-300 dark:border-akg-hairline bg-slate-50 dark:bg-akg-raised px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-akg-text placeholder:text-slate-400 dark:placeholder:text-akg-muted/60 focus:bg-white dark:focus:bg-akg-raised focus:border-emerald-500 focus:outline-none';
export const textareaCls = cn(inputCls, 'min-h-[90px] leading-relaxed');
