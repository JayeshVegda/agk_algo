import React, { useMemo, useState } from 'react';
import { Bell, Pin, Pencil, Trash2, Send } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { SectionHeader, EmptyState, labelCls, inputCls, textareaCls } from '../components/ui';
import { ActionSheet, ConfirmSheet } from '../components/ActionSheet';
import { fmtRelative } from '../lib/format';
import { cn } from '../../../lib/utils';

const AUTHORS = [
  'Infrastructure Desk', 'Chief Risk Officer', 'Institutional Lead',
  'Core Dev Operations', 'Chief Analyst', 'System Admin',
];

export default function Briefings() {
  const { broadcasts, saveBroadcast, togglePinBroadcast, deleteBroadcast, currentUser } = useAdmin();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('Institutional Lead');
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const sorted = useMemo(() =>
    [...broadcasts].sort((a, b) => (b.pinned - a.pinned) || b.created.localeCompare(a.created)),
  [broadcasts]);

  const pinnedCount = broadcasts.filter((b) => b.pinned).length;
  const canSend = title.trim() || body.trim();

  const dispatch = async () => {
    if (!canSend || busy) return;
    setBusy(true);
    const ok = await saveBroadcast({
      title: title.trim() || body.trim().slice(0, 70),
      body: body.trim() || title.trim(),
      author: author || currentUser?.name || 'Desk Admin',
      pinned: Boolean(pinned),
    });
    if (ok) { setTitle(''); setBody(''); setPinned(false); }
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Desk Briefings"
        sub={`${broadcasts.length} dispatched (${pinnedCount} pinned). New briefings reach every member instantly.`}
      />

      {/* Fast dispatch */}
      <div className="rounded-2xl border border-white/10 bg-akg-surface p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 font-data text-[10px] uppercase tracking-wider text-akg-gold">
          <Send className="h-3.5 w-3.5" /> Quick dispatch
        </h2>
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline (e.g. US Core PCE risk protocol)"
            className={inputCls}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message to members..."
            className={cn(textareaCls, 'min-h-[100px]')}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <select value={author} onChange={(e) => setAuthor(e.target.value)} className={cn(inputCls, 'h-10 w-auto py-0 text-xs')}>
                {AUTHORS.map((a) => <option key={a}>{a}</option>)}
              </select>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-akg-silver">
                <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 accent-[#F3C653]" />
                Pin to member dashboards
              </label>
            </div>
            <button
              onClick={dispatch}
              disabled={!canSend || busy}
              className="flex h-10 items-center gap-2 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] px-5 text-sm font-bold text-[#1C1403] active:scale-[0.98] disabled:opacity-40"
            >
              <Send className="h-4 w-4" /> {busy ? 'Dispatching...' : 'Dispatch'}
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      {sorted.length === 0 ? (
        <EmptyState icon={Bell} title="No briefings yet" hint="Dispatch the first one above." />
      ) : (
        <div className="space-y-2.5">
          {sorted.map((b) => (
            <article
              key={b.id}
              className={cn(
                'rounded-2xl border p-4 transition-colors',
                b.pinned
                  ? 'border-[#F3C653]/35 bg-gradient-to-b from-[#171208]/70 to-akg-surface'
                  : 'border-white/10 bg-akg-surface'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {b.pinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F3C653]/15 px-2 py-0.5 font-data text-[9px] font-bold uppercase tracking-wider text-akg-gold">
                        <Pin className="h-2.5 w-2.5" /> Pinned
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-white">{b.title}</h3>
                  </div>
                  <div className="mt-0.5 font-data text-[10px] text-akg-muted">
                    {b.author || 'Desk'} · {fmtRelative(b.created)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => togglePinBroadcast(b)}
                    className={cn('rounded-lg p-1.5 transition-colors', b.pinned ? 'text-akg-gold hover:bg-[#F3C653]/10' : 'text-akg-muted hover:bg-white/5 hover:text-white')}
                    title={b.pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditing(b)} className="rounded-lg p-1.5 text-akg-muted hover:bg-white/5 hover:text-white" title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleting(b)} className="rounded-lg p-1.5 text-akg-muted hover:bg-rose-500/10 hover:text-rose-300" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-akg-silver/90">{b.body}</p>
            </article>
          ))}
        </div>
      )}

      {/* Edit sheet */}
      {editing && (
        <EditBriefing
          briefing={editing}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            const b = editing;
            setEditing(null);
            if (b) await saveBroadcast(payload, b.id);
          }}
        />
      )}

      <ConfirmSheet
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => { if (deleting) await deleteBroadcast(deleting); }}
        title="Delete briefing?"
        message={deleting ? `"${deleting.title}" will be removed from every member dashboard.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function EditBriefing({ briefing, onClose, onSave }) {
  const [title, setTitle] = useState(briefing.title);
  const [body, setBody] = useState(briefing.body);
  const [pinned, setPinned] = useState(Boolean(briefing.pinned));

  return (
    <ActionSheet
      open
      onClose={onClose}
      title="Edit briefing"
      footer={
        <button
          onClick={() => onSave({ title, body, pinned: Boolean(pinned) })}
          disabled={!title.trim() || !body.trim()}
          className="h-11 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] disabled:opacity-40"
        >
          Save Changes
        </button>
      }
    >
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Body</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className={textareaCls} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-akg-silver">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 accent-[#F3C653]" />
          Pinned directive
        </label>
      </div>
    </ActionSheet>
  );
}
