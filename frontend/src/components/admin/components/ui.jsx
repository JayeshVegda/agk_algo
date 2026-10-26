import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Inbox } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { explorerUrl } from '../lib/format';

const STATUS_STYLES = {
  pending: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  pending_review: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  confirmed: 'bg-akg-green/15 text-akg-green border-akg-green/30',
  approved: 'bg-akg-green/15 text-akg-green border-akg-green/30',
  active: 'bg-akg-green/15 text-akg-green border-akg-green/30',
  connected: 'bg-akg-green/15 text-akg-green border-akg-green/30',
  closed: 'bg-white/[0.06] text-akg-muted border-white/10',
  settled: 'bg-white/[0.06] text-akg-muted border-white/10',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  in_progress: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
};

export function StatusPill({ status, className }) {
  const s = String(status || '').toLowerCase();
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-data text-[10px] font-bold uppercase tracking-wider',
      STATUS_STYLES[s] || 'bg-white/[0.06] text-akg-muted border-white/10',
      className
    )}>
      {s === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-akg-green animate-pulse-soft" />}
      {s === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse-soft" />}
      {String(status || '').replace(/_/g, ' ')}
    </span>
  );
}

export function TxidCell({ network, txid, full = false }) {
  const [copied, setCopied] = useState(false);
  if (!txid) return <span className="font-data text-xs text-akg-muted">-</span>;
  const url = explorerUrl(network, txid);
  const short = `${txid.slice(0, 8)}…${txid.slice(-6)}`;
  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={txid}
        className="font-data text-xs text-akg-gold underline-offset-2 hover:underline"
      >
        {full ? txid : short}
      </a>
      <button
        onClick={() => {
          navigator.clipboard.writeText(txid);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="rounded p-0.5 text-akg-muted transition-colors hover:text-white"
        title="Copy TXID"
      >
        {copied ? <Check className="h-3 w-3 text-akg-green" /> : <Copy className="h-3 w-3" />}
      </button>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-akg-muted hover:text-white" title="Open in explorer">
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
        'flex w-full flex-col rounded-2xl border p-4 text-left transition-all',
        onClick && 'cursor-pointer hover:border-[#F3C653]/40 hover:shadow-gold',
        !onClick && 'cursor-default',
        tone === 'gold' ? 'border-[#F3C653]/30 bg-gradient-to-b from-[#171208] to-akg-surface' : 'border-white/10 bg-akg-surface'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-akg-muted">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-akg-gold" />}
      </div>
      <span className="mt-1.5 font-data text-2xl font-bold text-white tabular-nums">{value}</span>
      {sub && <span className="mt-0.5 text-[11px] text-akg-muted">{sub}</span>}
    </button>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-akg-surface px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
        <Icon className="h-5 w-5 text-akg-muted" />
      </div>
      <h3 className="mt-4 font-display text-base font-bold text-white">{title}</h3>
      {hint && <p className="mt-1 max-w-xs text-xs leading-relaxed text-akg-muted">{hint}</p>}
    </div>
  );
}

export function SectionHeader({ title, sub, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">{title}</h1>
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
            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
            value === o.id
              ? 'border-[#F3C653] bg-[#F3C653] text-[#1C1403] shadow-md shadow-[#F3C653]/20'
              : 'border-white/10 bg-white/[0.03] text-akg-muted hover:border-[#F3C653]/40 hover:text-akg-silver'
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1 font-data opacity-70">({o.count})</span>}
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
      className="h-10 w-full rounded-full border border-white/10 bg-[#0A0D13] px-4 text-sm text-white placeholder:text-akg-muted/70 focus:border-[#F3C653]/50 focus:outline-none sm:w-64"
    />
  );
}

export const labelCls = 'mb-1.5 block text-xs font-semibold text-akg-silver';
export const inputCls =
  'w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3.5 py-2.5 text-sm text-white placeholder:text-akg-muted/60 focus:border-[#F3C653]/50 focus:outline-none';
export const textareaCls = cn(inputCls, 'min-h-[90px] leading-relaxed');
