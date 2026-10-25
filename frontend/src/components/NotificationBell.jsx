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
  payment_submitted: 'text-[#F3C653]',
  payment_approved: 'text-[#00D878]',
  payment_rejected: 'text-rose-400',
  license_issued: 'text-[#00D878]',
  plan_expiry: 'text-amber-400',
  connector_update: 'text-sky-400',
  admin_alert: 'text-[#F3C653]',
};

// Light-theme variant colors (admin portal)
const TYPE_COLORS_LIGHT = {
  payment_submitted: 'text-amber-600',
  payment_approved: 'text-emerald-600',
  payment_rejected: 'text-rose-600',
  license_issued: 'text-emerald-600',
  plan_expiry: 'text-amber-600',
  connector_update: 'text-sky-600',
  admin_alert: 'text-amber-600',
};

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr.replace(' ', 'T')).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell({ user, dark = true }) {
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

  const iconColors = dark ? TYPE_COLORS : TYPE_COLORS_LIGHT;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className={cn(
          'relative p-2 rounded-xl cursor-pointer transition-colors',
          dark
            ? 'border border-white/10 bg-[#10141B] text-[#A6ADB9] hover:text-white hover:bg-white/5'
            : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        )}
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
          <div
            className={cn(
              'absolute right-0 mt-2 w-[340px] max-w-[92vw] rounded-2xl shadow-2xl border z-[70] overflow-hidden',
              dark ? 'bg-[#10141B] border-white/10' : 'bg-white border-slate-200'
            )}
          >
            <div className={cn('flex items-center justify-between px-4 py-3 border-b', dark ? 'border-white/10' : 'border-slate-100')}>
              <div className={cn('text-xs font-bold flex items-center gap-1.5', dark ? 'text-white' : 'text-slate-900')}>
                <Bell className="h-3.5 w-3.5" />
                Notifications
                {unread.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">{unread.length} new</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread.length > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all read"
                    className={cn('p-1.5 rounded-lg cursor-pointer', dark ? 'text-[#A6ADB9] hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className={cn('p-1.5 rounded-lg cursor-pointer', dark ? 'text-[#A6ADB9] hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {items.length === 0 ? (
                <div className={cn('px-4 py-10 text-center text-xs', dark ? 'text-[#A6ADB9]' : 'text-slate-400')}>
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  Nothing yet. Payment approvals, license keys and membership reminders will appear here.
                </div>
              ) : (
                <div className={cn('divide-y', dark ? 'divide-white/5' : 'divide-slate-100')}>
                  {items.map((n) => {
                    const Icon = TYPE_ICONS[n.type] || Bell;
                    return (
                      <button
                        key={n.id}
                        onClick={() => markRead(n)}
                        className={cn(
                          'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer',
                          dark ? 'hover:bg-white/5' : 'hover:bg-slate-50',
                          !n.read && (dark ? 'bg-white/[0.04]' : 'bg-emerald-50/50')
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', iconColors[n.type] || (dark ? 'text-[#A6ADB9]' : 'text-slate-400'))} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-xs font-bold truncate', dark ? 'text-white' : 'text-slate-900')}>{n.title}</span>
                            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />}
                          </div>
                          {n.body && (
                            <p className={cn('text-[11px] leading-snug mt-0.5', dark ? 'text-[#A6ADB9]' : 'text-slate-500')}>{n.body}</p>
                          )}
                          <span className={cn('text-[10px] font-mono mt-1 block', dark ? 'text-white/30' : 'text-slate-400')}>
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
