import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Pin, Clock, Trash2, Radio, ChevronDown } from 'lucide-react';

const chipBase = 'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all duration-200';
const chipActive = 'border-transparent bg-akg-cta text-akg-cta-text shadow-sm';
const chipIdle = 'border-akg-hairline bg-akg-raised text-akg-muted hover:text-akg-text';

function relativeTime(dateStr) {
  const t = new Date(String(dateStr || '').replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(t).toLocaleDateString();
}

const PAGE = 5;

export function BroadcastsTab({ user, notify }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [visible, setVisible] = useState(PAGE);
  const [expanded, setExpanded] = useState(null);

  const loadBroadcasts = () => {
    pb.collection('broadcasts').getFullList({ sort: '-pinned,-created' })
      .then(setBroadcasts)
      .catch((err) => console.error('Failed to load broadcasts:', err));
  };

  useEffect(() => {
    loadBroadcasts();
    const unsubPromise = pb.collection('broadcasts').subscribe('*', (e) => {
      if (e.action === 'create') {
        setBroadcasts((prev) => [e.record, ...prev]);
        notify?.({ type: 'warning', title: 'New Desk Announcement', message: e.record.title });
      } else if (e.action === 'update') {
        setBroadcasts((prev) => prev.map((b) => (b.id === e.record.id ? e.record : b)));
      } else if (e.action === 'delete') {
        setBroadcasts((prev) => prev.filter((b) => b.id !== e.record.id));
      }
    });
    return () => { unsubPromise.then((unsub) => unsub()); };
  }, [notify]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await pb.collection('broadcasts').delete(id);
      notify?.({ type: 'info', title: 'Broadcast Removed', message: 'Announcement deleted' });
      loadBroadcasts();
    } catch (err) {
      notify?.({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const pinned = broadcasts.filter((b) => b.pinned);
  const regular = broadcasts.filter((b) => !b.pinned);
  const showPinnedOnly = filter === 'pinned';
  const chronicle = showPinnedOnly ? pinned : regular;
  const shown = chronicle.slice(0, visible);

  return (
    <div className="mx-auto max-w-2xl font-sans text-akg-text">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-3xl">Desk Briefings</h1>
          <p className="mt-1.5 text-sm text-akg-muted">Directives and desk analysis, pushed live.</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-akg-text">
            <span className="live-dot" /> live
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => { setFilter('all'); setVisible(PAGE); }} className={`${chipBase} ${filter === 'all' ? chipActive : chipIdle}`}>
              All <span className="font-mono">({broadcasts.length})</span>
            </button>
            <button onClick={() => { setFilter('pinned'); setVisible(PAGE); }} className={`${chipBase} ${filter === 'pinned' ? chipActive : chipIdle}`}>
              <Pin className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Pinned directives */}
      {!showPinnedOnly && pinned.length > 0 && (
        <section className="mt-7 space-y-2.5">
          {pinned.slice(0, 2).map((b) => (
            <article key={b.id} className="rounded-xl border border-akg-accent/40 bg-akg-card p-4 ring-1 ring-akg-accent/20">
              <div className="flex items-center gap-2">
                <Pin className="h-3 w-3 shrink-0 text-akg-accent" />
                <h3 className="min-w-0 flex-1 truncate font-display text-sm font-bold text-akg-text">{b.title}</h3>
                <span className="shrink-0 font-mono text-[10px] text-akg-muted">{relativeTime(b.created)}</span>
              </div>
              <p className={`mt-1.5 text-xs leading-relaxed text-akg-muted ${expanded === b.id ? '' : 'line-clamp-2'}`}>{b.body}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[10px] text-akg-muted">{b.author || 'Desk'}</span>
                <button onClick={() => setExpanded(expanded === b.id ? null : b.id)} className="text-[10px] font-semibold text-akg-accent cursor-pointer hover:underline">
                  {expanded === b.id ? 'show less' : 'read more'}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Chronicle */}
      <section className="mt-7">
        <h2 className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-akg-muted">Chronicle</h2>
        {broadcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-akg-hairline bg-akg-card px-6 py-12 text-center">
            <Radio className="h-5 w-5 text-akg-muted" />
            <h3 className="mt-3 font-display text-sm font-bold text-akg-text">The desk is quiet</h3>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-akg-hairline bg-akg-card">
              {shown.map((b, i) => (
                <article key={b.id} className={`p-4 transition-colors hover:bg-akg-raised cursor-pointer ${i > 0 ? 'border-t border-akg-hairline' : ''}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="min-w-0 font-display text-[13px] font-bold leading-snug text-akg-text">{b.title}</h3>
                    <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-akg-muted">
                      <Clock className="h-3 w-3" />{relativeTime(b.created)}
                    </span>
                  </div>
                  <p className={`mt-1.5 text-xs leading-relaxed text-akg-muted ${expanded === b.id ? '' : 'line-clamp-2'}`}>{b.body}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] text-akg-muted">{b.author || 'Desk'}</span>
                      <button onClick={() => setExpanded(expanded === b.id ? null : b.id)} className="text-[10px] font-semibold text-akg-accent hover:underline cursor-pointer">
                        {expanded === b.id ? 'less' : 'more'}
                      </button>
                    </div>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(b.id)} className="rounded p-1 text-akg-muted hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer" title="Delete">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {visible < chronicle.length && (
              <button
                onClick={() => setVisible((v) => v + PAGE)}
                className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-akg-hairline bg-akg-card text-xs font-semibold text-akg-muted transition-colors hover:border-akg-accent/40 hover:text-akg-accent cursor-pointer"
              >
                Show {Math.min(PAGE, chronicle.length - visible)} more <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
