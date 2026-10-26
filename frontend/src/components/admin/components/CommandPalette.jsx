import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { SECTIONS } from '../adminNav';
import { cn } from '../../../lib/utils';

const CACHE_TTL = 45_000;
let rosterCache = { at: 0, data: [] };
let depositsCache = { at: 0, data: [] };

async function loadRoster() {
  if (Date.now() - rosterCache.at < CACHE_TTL) return rosterCache.data;
  try {
    const res = await pb.send('/api/akg/traders', { method: 'GET' });
    rosterCache = { at: Date.now(), data: res.items || res };
  } catch { rosterCache = { at: Date.now(), data: rosterCache.data }; }
  return rosterCache.data;
}

async function loadDeposits() {
  if (Date.now() - depositsCache.at < CACHE_TTL) return depositsCache.data;
  try {
    depositsCache = { at: Date.now(), data: await pb.collection('payments').getFullList({ filter: 'status="pending"', sort: 'created' }) };
  } catch { depositsCache = { at: Date.now(), data: depositsCache.data }; }
  return depositsCache.data;
}

/**
 * Global ⌘K / Ctrl+K palette: jump to a section, a trader, or a deposit
 * awaiting review. Mounted once by the console shell; open state is owned by
 * the shell so the header button can open it too.
 */
export default function CommandPalette({ go, open, setOpen }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const [roster, setRoster] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return undefined;
    setQ('');
    setIdx(0);
    inputRef.current?.focus();
    loadRoster().then(setRoster);
    loadDeposits().then(setDeposits);
    return undefined;
  }, [open]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (text) => !needle || String(text).toLowerCase().includes(needle);
    const out = [];
    SECTIONS.forEach((s) => { if (match(s.label) || match(s.id)) out.push({ kind: 'section', id: `s-${s.id}`, label: s.label, icon: s.icon, hint: 'go', run: () => go(s.id) }); });
    roster.filter((u) => (u.role || 'user') !== 'admin').forEach((u) => {
      if (match(u.name) || match(u.email)) {
        out.push({ kind: 'trader', id: `u-${u.id}`, label: u.name || u.email, hint: u.email || '', sub: u.plan || 'no plan', run: () => go('users', { id: u.id }) });
      }
    });
    deposits.forEach((p) => {
      if (match(p.user_email) || match(p.txid) || match(p.plan)) {
        out.push({ kind: 'deposit', id: `p-${p.id}`, label: `${p.user_email} · $${p.amount} USDT`, hint: 'awaiting review', run: () => go('payments', { id: p.id }) });
      }
    });
    return out.slice(0, 40);
  }, [q, roster, deposits, go]);

  useEffect(() => { setIdx(0); }, [q]);

  if (!open) return null;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[idx];
      if (it) { setOpen(false); it.run(); }
    }
  };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <div className="absolute left-1/2 top-[12vh] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E14] shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4">
          <Search className="h-4 w-4 shrink-0 text-akg-muted" />
          <input
            ref={inputRef}
            name="paletteSearch"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to section, trader, or pending deposit…"
            className="h-12 w-full bg-transparent text-sm text-white placeholder:text-akg-muted/70 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-data text-[10px] text-akg-muted">esc</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto py-1.5">
          {items.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-akg-muted">No matches.</p>
          )}
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                onMouseEnter={() => setIdx(i)}
                onClick={() => { setOpen(false); it.run(); }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2 text-left text-xs',
                  i === idx ? 'bg-[#F3C653]/10 text-white' : 'text-akg-silver',
                )}
              >
                {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-akg-muted" /> : (
                  <span className={cn('h-3.5 w-3.5 shrink-0 rounded-full', it.kind === 'trader' ? 'bg-sky-400/70' : 'bg-amber-300/80')} />
                )}
                <span className="flex-1 truncate">{it.label}</span>
                {it.sub && <span className="font-data text-[10px] text-akg-muted">{it.sub}</span>}
                {it.hint && <span className="font-data text-[10px] text-akg-muted/70">{it.hint}</span>}
                {i === idx && <CornerDownLeft className="h-3 w-3 text-akg-gold" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2 font-data text-[10px] text-akg-muted">
          <span>↑↓ navigate · enter open</span>
          <span>{roster.length} traders · {deposits.length} pending deposits</span>
        </div>
      </div>
    </div>
  );
}
