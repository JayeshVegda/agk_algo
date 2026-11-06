import React, { useState, useEffect, useCallback } from 'react';
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

  const load = useCallback(async () => {
    if (!user?.id) { setItems([]); return; }
    try {
      const records = await pb.collection('notifications').getFullList({ sort: '-created' });
      setItems(records);
    } catch {
      setItems([]);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
    if (!user?.id) return;
    const unsub = pb.collection('notifications').subscribe('*', () => load()).catch(() => {});
    return () => { unsub?.then?.((u) => u && u()); };
  }, [user?.id, load]);

  const unread = items.filter((n) => !n.read);

  const markRead = async (n) => {
    if (n.read) return;
    try {
      await pb.collection('notifications').update(n.id, { read: true });
    } catch {}
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    await Promise.all(unread.map((n) => pb.collection('notifications').update(n.id, { read: true }).catch(() => {})));
  };

  if (!user?.id) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative p-2 rounded-lg cursor-pointer transition-colors border border-akg-hairline bg-akg-card text-akg-muted hover:text-akg-text hover:bg-akg-raised"
      >
        <Bell className="h-4 w-4" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[340px] max-w-[92vw] rounded-xl shadow-2xl border border-akg-hairline bg-akg-card z-[70] overflow-hidden text-akg-text">
            <div className="flex items-center justify-between px-4 py-3 border-b border-akg-hairline">
              <div className="text-xs font-bold flex items-center gap-1.5 text-akg-text">
                <Bell className="h-3.5 w-3.5" />
                Notifications
                {unread.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-500 text-[9px] font-bold">{unread.length} new</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread.length > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all read"
                    className="p-1.5 rounded-md cursor-pointer text-akg-muted hover:text-akg-text hover:bg-akg-raised transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-md cursor-pointer text-akg-muted hover:text-akg-text hover:bg-akg-raised transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {items.length === 0 ? (
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
                        onClick={() => markRead(n)}
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
          </div>
        </>
      )}
    </div>
  );
}
