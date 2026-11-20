import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Bell, Check, CheckCheck, X, Zap, KeyRound, AlertCircle, CreditCard, Radio } from 'lucide-react';
import { cn } from '../lib/utils';

const TYPE_ICONS = {
  payment_submitted: CreditCard,
  payment_approved: Zap,
  payment_rejected: AlertCircle,
  license_issued: KeyRound,
  plan_expiry: AlertCircle,
  connector_update: Radio,
  admin_alert: Bell,
};

const TYPE_COLORS = {
  payment_submitted: 'text-akg-accent',
  payment_approved: 'text-akg-green',
  payment_rejected: 'text-rose-500',
  license_issued: 'text-akg-accent',
  plan_expiry: 'text-amber-500',
  connector_update: 'text-sky-400',
  admin_alert: 'text-akg-accent',
};

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr.replace(' ', 'T')).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell({ user }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [marking, setMarking] = useState(false);
  const [writeError, setWriteError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    let requestId = 0;
    let timer;
    const filter = pb.filter('user = {:user}', { user: user.id });
    const collection = pb.collection('notifications');
    const load = async () => {
      const id = ++requestId;
      try {
        const [unread, result] = await Promise.all([
          collection.getList(1, 1, { filter: filter + ' && read = false', fields: 'id' }),
          open ? collection.getList(page, 20, { filter, sort: '-created,-id' }) : Promise.resolve(null),
        ]);
        if (!alive || id !== requestId) return;
        setUnreadCount(unread.totalItems);
        if (result) {
          if (!result.items.length && page > 1) {
            setPage(Math.max(1, result.totalPages));
            return;
          }
          setItems(result.items);
          setHasNext(result.page < result.totalPages);
        }
        setStatus('ready');
      } catch {
        if (alive && id === requestId) setStatus('error');
      }
    };
    load();
    const subscription = collection.subscribe('*', () => {
      if (!alive) return;
      clearTimeout(timer);
      timer = setTimeout(load, 250);
    }, { filter }).catch(() => null);
    return () => {
      alive = false;
      clearTimeout(timer);
      subscription.then((unsubscribe) => unsubscribe?.());
    };
  }, [user?.id, open, page, attempt]);

  const unread = items.filter((n) => !n.read);

  async function markRead(records) {
    if (!records.length || marking) return;
    setMarking(true);
    setWriteError(false);
    const results = await Promise.allSettled(records.map((n) => pb.collection('notifications').update(n.id, { read: true })));
    setWriteError(results.some((result) => result.status === 'rejected'));
    setMarking(false);
    setAttempt((value) => value + 1);
  }

  function goToPage(number) {
    setStatus('loading');
    setPage(number);
  }

  if (!user?.id) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!open) {
            setPage(1);
            setStatus('loading');
            setWriteError(false);
          }
          setOpen(!open);
        }}
        aria-expanded={open}
        aria-label="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-akg-hairline bg-akg-card text-akg-muted transition-colors hover:bg-akg-raised hover:text-akg-text"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="fixed left-3 right-3 top-[4.5rem] z-[70] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-xl border border-akg-hairline bg-akg-card text-akg-text shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[340px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-akg-hairline">
              <div className="text-xs font-bold flex items-center gap-1.5 text-akg-text">
                <Bell className="h-3.5 w-3.5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-500 text-[9px] font-bold">{unreadCount} new</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {status === 'ready' && unread.length > 0 && (
                  <button
                    onClick={() => markRead(unread)}
                    disabled={marking}
                    aria-label="Mark this page as read"
                    title="Mark this page as read"
                    className="p-1.5 rounded-md cursor-pointer text-akg-muted hover:text-akg-text hover:bg-akg-raised transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="p-1.5 rounded-md cursor-pointer text-akg-muted hover:text-akg-text hover:bg-akg-raised transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {status === 'loading' ? (
                <p role="status" className="p-4 text-xs text-akg-muted">Loading notifications…</p>
              ) : status === 'error' ? (
                <div className="space-y-2 p-4 text-xs">
                  <p role="alert">Couldn’t load notifications.</p>
                  <button className="underline" onClick={() => { setStatus('loading'); setAttempt((value) => value + 1); }}>Try again</button>
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs text-akg-muted">
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  Nothing yet. Payment approvals, license keys and membership reminders will appear here.
                </div>
              ) : (
                <div className="divide-y divide-akg-hairline">
                  {items.map((n) => {
                    const Icon = TYPE_ICONS[n.type] || Bell;
                    return (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.read ? [] : [n])}
                        className={cn(
                          'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer',
                          'hover:bg-akg-raised',
                          !n.read && 'bg-akg-raised/60'
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', TYPE_COLORS[n.type] || 'text-akg-muted')} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold truncate text-akg-text">{n.title}</span>
                            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />}
                          </div>
                          {n.body && (
                            <p className="text-[11px] leading-snug mt-0.5 text-akg-muted">{n.body}</p>
                          )}
                          <span className="text-[10px] font-mono mt-1 block text-akg-muted/70">
                            {timeAgo(n.created)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {writeError && <p role="alert" className="p-3 text-xs text-rose-600">Some notifications couldn’t be marked as read. Try again.</p>}
            {status === 'ready' && (page > 1 || hasNext) && (
              <div className="flex items-center justify-between border-t border-akg-hairline px-4 text-xs">
                <button className="min-h-11 disabled:opacity-40" disabled={page === 1 || marking} onClick={() => goToPage(page - 1)}>Newer</button>
                <button className="min-h-11 disabled:opacity-40" disabled={!hasNext || marking} onClick={() => goToPage(page + 1)}>Older</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
