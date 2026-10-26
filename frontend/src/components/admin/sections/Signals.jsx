import React, { useMemo, useState } from 'react';
import { Zap, Pencil, Trash2, LayoutGrid, Table2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { usePagedList, useStats } from '../lib/pagedList';
import { SectionHeader, FilterChips, SearchInput, EmptyState, StatusPill } from '../components/ui';
import { ActionSheet, ConfirmSheet } from '../components/ActionSheet';
import SignalComposer from '../components/SignalComposer';
import { fmtRelative } from '../lib/format';
import { cn } from '../../../lib/utils';

const OUTCOME_PRESETS = ['+20 pips', '+50 pips', '+100 pips', 'BE (0 pips)', '-30 pips'];

export default function Signals() {
  const { closeSignal, deleteSignal } = useAdmin();
  const { stats } = useStats();
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [closing, setClosing] = useState(null);
  const [outcome, setOutcome] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('cards');

  const counts = {
    all: stats?.signals.total,
    active: stats?.signals.active,
    closed: stats ? stats.signals.total - stats.signals.active : undefined,
  };

  const page = usePagedList('signals', {
    filter: statusFilter === 'all' ? '' : `status = '${statusFilter}'`,
    sort: '-created',
    searchKeys: ['symbol', 'notes', 'direction', 'plan_tier'],
    perPage: 12,
  });
  const perPage = 12;
  const pageItems = page.items;
  const safePage = page.page;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Signals Desk"
        sub={counts.active !== undefined ? `${counts.active} live · ${counts.closed || 0} settled. Broadcast from a Telegram paste or the structured form.` : 'Loading desk totals…'}
        actions={
          <>
            <div className="hidden rounded-full border border-white/10 bg-[#0A0D13] p-1 sm:flex">
              {[
                { id: 'cards', icon: LayoutGrid },
                { id: 'table', icon: Table2 },
              ].map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    className={cn('rounded-full p-2 transition-colors', view === v.id ? 'bg-white/10 text-white' : 'text-akg-muted hover:text-white')}
                    title={v.id === 'cards' ? 'Card view' : 'Table view'}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setEditing(null); setComposerOpen(true); }}
              className="flex h-10 items-center gap-2 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] px-4 text-sm font-bold text-[#1C1403] active:scale-[0.98]"
            >
              <Zap className="h-4 w-4" /> New Signal
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); page.setPage(1); }}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'active', label: 'Live', count: counts.active },
            { id: 'closed', label: 'Settled', count: counts.closed },
          ]}
        />
        <SearchInput value={page.search} onChange={page.setSearch} placeholder="Symbol, notes..." />
      </div>

      {page.items.length === 0 && !page.loading ? (
        <EmptyState icon={Zap} title="No signals match" hint="Broadcast the first one with the button above." />
      ) : view === 'cards' ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((s) => (
            <SignalCard
              key={s.id}
              s={s}
              onEdit={() => { setEditing(s); setComposerOpen(true); }}
              onClose={() => { setClosing(s); setOutcome(s.pnl || '+50 pips'); }}
              onDelete={() => setDeleting(s)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-akg-surface">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.07] font-data text-[10px] uppercase tracking-wider text-akg-muted">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ticker / Side</th>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">SL</th>
                <th className="px-4 py-3">TP1 / TP2</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Dispatched</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((s) => (
                <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.015]">
                  <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                  <td className="px-4 py-3">
                    <span className="font-data font-bold text-white">{s.symbol}</span>
                    <span className={cn('ml-2 rounded px-1.5 py-0.5 font-data text-[10px] font-bold', s.direction === 'BUY' ? 'bg-akg-green/15 text-akg-green' : 'bg-rose-500/15 text-rose-300')}>{s.direction}</span>
                  </td>
                  <td className="px-4 py-3 font-data text-akg-silver">{s.entry}</td>
                  <td className="px-4 py-3 font-data text-rose-300/90">{s.stop_loss}</td>
                  <td className="px-4 py-3 font-data text-akg-green/90">{s.take_profit_1}{s.take_profit_2 ? ` / ${s.take_profit_2}` : ''}</td>
                  <td className="px-4 py-3 text-akg-muted">{s.plan_tier === 'PERFECT_SIGNAL_BOX' ? 'VIP' : 'SR'}</td>
                  <td className="px-4 py-3 font-data">{s.pnl || (s.status === 'active' ? 'running' : '-')}</td>
                  <td className="px-4 py-3 font-data text-akg-muted">{fmtRelative(s.created)}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      s={s}
                      onEdit={() => { setEditing(s); setComposerOpen(true); }}
                      onClose={() => { setClosing(s); setOutcome(s.pnl || '+50 pips'); }}
                      onDelete={() => setDeleting(s)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* pagination */}
      {page.total > perPage && (
        <div className="flex items-center justify-between font-data text-xs text-akg-muted">
          <span>
            Showing {Math.min((safePage - 1) * perPage + 1, page.total)}–{Math.min(safePage * perPage, page.total)} of {page.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => page.setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-white/10 p-1.5 disabled:opacity-30 hover:bg-white/5"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-white">{safePage}/{page.totalPages}</span>
            <button
              onClick={() => page.setPage((p) => Math.min(page.totalPages, p + 1))}
              disabled={safePage >= page.totalPages}
              className="rounded-lg border border-white/10 p-1.5 disabled:opacity-30 hover:bg-white/5"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <SignalComposer open={composerOpen} onClose={() => { setComposerOpen(false); setEditing(null); }} editing={editing} />

      {/* Close with outcome */}
      <ActionSheet
        open={!!closing}
        onClose={() => setClosing(null)}
        title="Settle signal"
        subtitle={closing ? `${closing.symbol} ${closing.direction} · entry ${closing.entry}` : ''}
        size="sm"
        footer={
          <button
            onClick={async () => {
              const s = closing;
              setClosing(null);
              if (s && outcome.trim()) await closeSignal(s, outcome.trim());
            }}
            disabled={!outcome.trim()}
            className="h-11 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] disabled:opacity-40"
          >
            Close with outcome
          </button>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {OUTCOME_PRESETS.map((o) => (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                className={cn(
                  'rounded-full border px-3.5 py-2 font-data text-xs font-bold transition-all',
                  outcome === o
                    ? 'border-[#F3C653] bg-[#F3C653] text-[#1C1403]'
                    : 'border-white/10 text-akg-muted hover:border-[#F3C653]/40'
                )}
              >
                {o}
              </button>
            ))}
          </div>
          <input
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="or type a custom outcome..."
            className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3.5 font-data text-sm text-white placeholder:text-akg-muted/60 focus:border-[#F3C653]/50 focus:outline-none"
          />
        </div>
      </ActionSheet>

      <ConfirmSheet
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => { if (deleting) await deleteSignal(deleting); }}
        title="Delete signal?"
        message={deleting ? `${deleting.symbol} ${deleting.direction} will be removed from the member feed permanently.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function RowActions({ s, onEdit, onClose, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {s.status === 'active' && (
        <button onClick={onClose} className="rounded-lg border border-[#F3C653]/30 px-2.5 py-1 text-[10px] font-bold text-akg-gold hover:bg-[#F3C653]/10">
          Settle
        </button>
      )}
      <button onClick={onEdit} className="rounded-lg p-1.5 text-akg-muted hover:bg-white/5 hover:text-white" title="Edit">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button onClick={onDelete} className="rounded-lg p-1.5 text-akg-muted hover:bg-rose-500/10 hover:text-rose-300" title="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SignalCard({ s, onEdit, onClose, onDelete }) {
  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-akg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-data text-sm font-bold text-white">{s.symbol}</span>
          <span className={cn('rounded px-1.5 py-0.5 font-data text-[10px] font-bold', s.direction === 'BUY' ? 'bg-akg-green/15 text-akg-green' : 'bg-rose-500/15 text-rose-300')}>
            {s.direction}
          </span>
        </div>
        <StatusPill status={s.status} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 font-data text-[11px]">
        <div className="rounded-lg bg-white/[0.04] px-2.5 py-1.5">
          <div className="text-[9px] uppercase text-akg-muted">Entry</div>
          <div className="font-semibold text-white">{s.entry}</div>
        </div>
        <div className="rounded-lg bg-rose-500/[0.07] px-2.5 py-1.5">
          <div className="text-[9px] uppercase text-rose-300/80">Stop</div>
          <div className="font-semibold text-rose-300">{s.stop_loss}</div>
        </div>
        <div className="rounded-lg bg-akg-green/[0.07] px-2.5 py-1.5">
          <div className="text-[9px] uppercase text-akg-green/80">TP1</div>
          <div className="font-semibold text-akg-green">{s.take_profit_1}</div>
        </div>
        <div className="rounded-lg bg-akg-green/[0.07] px-2.5 py-1.5">
          <div className="text-[9px] uppercase text-akg-green/80">TP2</div>
          <div className="font-semibold text-akg-green">{s.take_profit_2 || 'runner'}</div>
        </div>
      </div>

      {s.pnl && (
        <div className={cn('mt-2.5 rounded-lg px-3 py-1.5 text-center font-data text-xs font-bold', String(s.pnl).startsWith('-') ? 'bg-rose-500/10 text-rose-300' : 'bg-akg-green/10 text-akg-green')}>
          {s.pnl}
        </div>
      )}
      {s.notes && <p className="mt-2.5 line-clamp-2 text-[11px] leading-relaxed text-akg-muted">{s.notes}</p>}

      <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <span className="font-data text-[10px] text-akg-muted">
          {s.plan_tier === 'PERFECT_SIGNAL_BOX' ? 'VIP' : 'SR'} · {fmtRelative(s.created)}
        </span>
        <RowActions s={s} onEdit={onEdit} onClose={onClose} onDelete={onDelete} />
      </div>
    </article>
  );
}
