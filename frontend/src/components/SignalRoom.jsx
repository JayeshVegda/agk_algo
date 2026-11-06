import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BellOff, ImagePlus, Lock, Paperclip, Pencil, Pin, PinOff, Reply, Send, Trash2, X } from 'lucide-react';
import { pb } from '../lib/pocketbase';
import {
  canReadAudience,
  deleteMessage,
  fetchContent,
  fetchMessages,
  fetchReactions,
  fileUrl,
  isStaff,
  postMessage,
  reactionCounts,
  setMessagePinned,
  subscribeRoom,
  subActive,
  toggleReaction,
} from '../lib/room';

const EMOJIS = ['🔥', '👍', '🎯', '💰', '🙏'];
const AUDIENCE_LABEL = { all: 'All', sr: 'SR', vip: 'VIP' };
const FAKE_LOCKED = [
  'XAUUSD level worked out exactly as planned: full execution analysis posted for members.',
  'Momentum flipped during the London session; next-leg plan already mapped for the desk.',
  'Risk capped and the invalidation level is clear. Coordination shared with the tier.',
];
const DAY_MS = 86400000;
const PAGE_SIZE = 60;

const cn = (...parts) => parts.filter(Boolean).join(' ');
const fmtTime = (iso) => {
  const d = new Date(String(iso || '').replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const dayKey = (iso) => String(iso || '').slice(0, 10);
const dayLabel = (key) => {
  if (!key) return '';
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
  if (key === today) return 'Today';
  if (key === yest) return 'Yesterday';
  return new Date(key + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

function fakeTextFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 9973;
  return FAKE_LOCKED[hash % FAKE_LOCKED.length];
}

function withUrls(content, fileToken) {
  if (!content) return content;
  const atts = Array.isArray(content.attachments) ? content.attachments : [];
  const urls = {};
  atts.forEach((f) => { urls[f] = fileUrl(content, f, fileToken); });
  return Object.assign({}, content, { __urls: urls });
}

function LockedBubble({ audience, user, onOpenPricing, onOpenAuth, hasImage }) {
  const activeButNotVip = !!user && subActive(user) && String(user.plan || '').toUpperCase().includes('SR');
  const label = activeButNotVip ? 'Upgrade to Perfect Box' : user ? 'Subscribe to unlock' : 'Subscribe to unlock';
  return (
    <div className="mt-0.5 w-full max-w-full sm:max-w-[340px] overflow-hidden rounded-xl border border-akg-hairline bg-akg-surface">
      <div className="pointer-events-none select-none px-3.5 sm:px-4 py-3 blur-[5px]" aria-hidden="true">
        <p className="font-sans text-[13px] leading-relaxed text-akg-text">{fakeTextFor(audience + 'x')}</p>
        {hasImage && <div className="mt-2 h-16 w-32 rounded-lg border border-akg-hairline bg-akg-surfaceElevated" />}
      </div>
      <button
        onClick={user ? onOpenPricing : onOpenAuth}
        className="flex w-full items-center justify-center gap-2 border-t border-akg-hairline px-4 py-2.5 transition-colors hover:bg-emerald-500/10 cursor-pointer"
      >
        <Lock className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">{label}</span>
      </button>
    </div>
  );
}

function ReplyQuote({ replyTo, contentMap, user }) {
  if (!replyTo) return null;
  const rid = typeof replyTo === 'string' ? replyTo : replyTo.id;
  const row = contentMap[rid];
  const readable = row && canReadAudience(user, replyTo?.audience || '');
  const snippet = readable ? String(row.body || '').slice(0, 64) : '';
  return (
    <div className="mb-1 rounded-md border-l-2 border-emerald-500/50 bg-akg-surfaceElevated px-2 py-1">
      <p className="font-mono text-[10px] text-akg-muted">{snippet || 'earlier broadcast'}</p>
    </div>
  );
}

function Reactions({ msgId, reactions, meId, onToggle }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const own = useMemo(() => {
    const mine = {};
    for (const r of reactions) {
      if (r.message === msgId && r.user === meId) mine[r.emoji] = r;
    }
    return mine;
  }, [reactions, msgId, meId]);
  const stats = useMemo(() => {
    const s = { total: 0 };
    for (const r of reactions) {
      if (r.message !== msgId) continue;
      s.total += 1;
      s[r.emoji] = (s[r.emoji] || 0) + 1;
    }
    return s;
  }, [reactions, msgId]);

  if (!stats.total && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 h-6 w-6 rounded-md text-[11px] text-akg-muted opacity-0 transition-opacity hover:bg-akg-surface hover:opacity-100 focus:opacity-100 group-hover:opacity-100 cursor-pointer"
      >
        +
      </button>
    );
  }

  return (
    <div className="relative mt-1 flex flex-wrap items-center gap-1.5" ref={boxRef}>
      {EMOJIS.filter((e) => stats[e]).map((emoji) => {
        const mine = own[emoji];
        return (
          <button
            key={emoji}
            onClick={() => onToggle(msgId, emoji, mine)}
            className={cn(
              'flex h-6 items-center gap-1 rounded-md border px-2 font-mono text-[11px] transition-colors cursor-pointer',
              mine 
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium' 
                : 'border-akg-hairline bg-akg-surface text-akg-text hover:border-emerald-500/20',
            )}
          >
            <span>{emoji}</span>
            <span className="font-medium">{stats[emoji]}</span>
          </button>
        );
      })}
      {open && (
        <div className="absolute bottom-8 left-0 z-20 flex gap-1 rounded-lg border border-akg-hairline bg-akg-card p-1 shadow-lg" onMouseLeave={() => setOpen(false)}>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { setOpen(false); onToggle(msgId, emoji, own[emoji]); }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md text-base transition-colors hover:bg-akg-surfaceElevated cursor-pointer',
                own[emoji] && 'bg-emerald-500/10',
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageRow({ msg, content, audience, user, meId, reactions, onToggle, onReply, onPin, onEdit, onDelete, onZoom, onOpenPricing, onOpenAuth, contentMap }) {
  const readable = canReadAudience(user, audience);
  const staff = isStaff(user);
  const mine = !!msg.author && (msg.author === meId);
  const right = mine || (staff && !msg.author);
  const [mobileMenu, setMobileMenu] = useState(false);
  const body = readable ? String(content?.body || '') : '';
  const files = readable && Array.isArray(content?.attachments) ? content.attachments : [];

  return (
    <div className={'group relative flex w-full gap-2 px-2.5 sm:px-3 py-0.5 ' + (right ? 'flex-row-reverse justify-start' : 'flex-row justify-start')}>
      <div className={cn('flex flex-col', right ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'max-w-[min(420px,90%)] sm:max-w-[min(420px,88%)] rounded-xl border px-3.5 sm:px-4 py-2.5 ' + (right ? 'rounded-br-sm' : 'rounded-bl-sm'),
            msg.pinned 
              ? 'border-emerald-500/30 bg-emerald-500/5' 
              : right 
                ? 'border-akg-hairline bg-emerald-500/5 dark:bg-emerald-500/10' 
                : 'border-akg-hairline bg-akg-surface',
          )}
        >
          <ReplyQuote replyTo={msg.reply_to} contentMap={contentMap} user={user} />
          {!readable && (
            <LockedBubble audience={audience} user={user} onOpenPricing={onOpenPricing} onOpenAuth={onOpenAuth} hasImage={msg.has_image} />
          )}
          {readable && !!body && (
            <pre className="max-w-full whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-akg-text">{body}</pre>
          )}
          {readable && files.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {files.map((f, i) => (
                <img
                  key={f + i}
                  src={(content.__urls && content.__urls[f]) || pb.files.getURL(content, f)}
                  alt=""
                  onClick={() => onZoom(content, f)}
                  className="max-h-72 cursor-zoom-in rounded-lg border border-akg-hairline object-cover"
                />
              ))}
            </div>
          )}
          {readable && !files.length && msg.has_image && (
            <div className="mt-2 flex h-20 w-40 items-center justify-center rounded-lg border border-akg-hairline bg-akg-surfaceElevated">
              <Lock className="h-4 w-4 text-akg-muted" />
            </div>
          )}
        </div>
        {readable && (
          <Reactions msgId={msg.id} reactions={reactions} meId={meId} onToggle={onToggle} />
        )}
        {staff && <MobileStaffMenu open={mobileMenu} setOpen={setMobileMenu} msg={msg} onReply={onReply} onPin={onPin} onEdit={onEdit} onDelete={onDelete} right={right} />}
      </div>

      <div className={cn('flex flex-col', right ? 'items-end' : 'items-start', 'pt-1')}>
        {msg.audience !== 'all' && (
          <span
            className={cn(
              'mb-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wide',
              msg.audience === 'vip' 
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                : 'bg-akg-surfaceElevated text-akg-muted border border-akg-hairline',
            )}
          >
            {msg.audience === 'vip' ? 'VIP' : 'SR'}
          </span>
        )}
        <span className="font-mono text-[9.5px] text-akg-muted">{fmtTime(msg.created)}</span>
      </div>

      {staff && (
        <div
          className="absolute top-1 z-20 hidden gap-0.5 rounded-lg border border-akg-hairline bg-akg-card p-1 opacity-0 shadow-lg transition-opacity sm:flex sm:group-hover:opacity-100"
          style={{ [right ? 'left' : 'right']: '6px' }}>
          <IconBtn title="Reply" onClick={() => onReply(msg)}><Reply className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title={msg.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(msg)}>
            {msg.pinned ? <PinOff className="h-3.5 w-3.5 text-akg-green" /> : <Pin className="h-3.5 w-3.5" />}
          </IconBtn>
          <IconBtn title="Edit" onClick={() => onEdit(msg)}><Pencil className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Delete" onClick={() => onDelete(msg)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></IconBtn>
        </div>
      )}
    </div>
  );
}

function IconBtn({ title, onClick, children }) {
  return (
    <button title={title} onClick={onClick} className="flex h-7 w-7 items-center justify-center rounded-md text-akg-muted transition-colors hover:bg-akg-surfaceElevated hover:text-akg-text cursor-pointer">
      {children}
    </button>
  );
}

function MobileStaffMenu({ open, setOpen, msg, onReply, onPin, onEdit, onDelete, right }) {
  return (
    <div className={cn("flex flex-col gap-0.5 sm:hidden", right ? "items-end" : "items-start")}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Message actions"
        className="mt-0.5 flex h-6 items-center rounded-md border border-akg-hairline bg-akg-surface px-2 font-mono text-[11px] tracking-widest text-akg-muted"
      >
        {open ? '×' : '···'}
      </button>
      {open && (
        <div className="flex gap-0.5 rounded-lg border border-akg-hairline bg-akg-card p-1 shadow-md">
          <IconBtn title="Reply" onClick={() => { setOpen(false); onReply(msg); }}><Reply className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title={msg.pinned ? 'Unpin' : 'Pin'} onClick={() => { setOpen(false); onPin(msg); }}>
            {msg.pinned ? <PinOff className="h-3.5 w-3.5 text-akg-green" /> : <Pin className="h-3.5 w-3.5" />}
          </IconBtn>
          <IconBtn title="Edit" onClick={() => { setOpen(false); onEdit(msg); }}><Pencil className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Delete" onClick={() => { setOpen(false); onDelete(msg); }}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></IconBtn>
        </div>
      )}
    </div>
  );
}

export function SignalRoom({ user, onOpenPricing, onOpenAuth }) {
  const meId = user && user.id;
  const staff = isStaff(user);
  const [msgs, setMsgs] = useState([]);
  const [contentById, setContentById] = useState({});
  const [reactions, setReactions] = useState([]);
  const [pending, setPending] = useState([]);
  const [audience, setAudience] = useState(() => localStorage.getItem('akg_room_audience') || 'vip');
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [alertsOn, setAlertsOn] = useState(() => localStorage.getItem('akg_room_alerts') === '1');
  const [zoom, setZoom] = useState(null);
  const [fileToken, setFileToken] = useState('');
  const [hasOlder, setHasOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const tailRef = useRef(null);
  const atBottomRef = useRef(true);
  const alertsRef = useRef(false);

  alertsRef.current = alertsOn;
  const fileTokenInit = useRef('');
  fileTokenInit.current = fileToken;

  const count24h = useMemo(() => {
    const cutoff = Date.now() - DAY_MS;
    return msgs.filter((m) => {
      const t = new Date(String(m.created || '').replace(' ', 'T')).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    }).length;
  }, [msgs]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasOlder || msgs.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = msgs[0];
      const page = await fetchMessages({ beforeCreated: oldest.created });
      const fresh = page.filter((p) => !msgs.some((m) => m.id === p.id));
      if (fresh.length === 0) {
        setHasOlder(false);
        return;
      }
      setMsgs((prev) => [...fresh.filter((p) => !prev.some((m) => m.id === p.id)), ...prev]);
      const missing = page.filter((m) => canReadAudience(user, m.audience)).map((m) => m.id);
      if (missing.length > 0) {
        const rows = await fetchContent(missing);
        const safeRows = Array.isArray(rows) ? rows : Object.values(rows || {});
        const next = {};
        safeRows.forEach((r) => { if (r && r.message) next[r.message] = withUrls(r, fileTokenInit.current); });
        setContentById((prev) => Object.assign({}, prev, next));
      }
    } catch (err) {
      console.warn('load older signals failed', err);
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasOlder, msgs, user]);

  useEffect(() => {
    let unsubs = [];
    async function boot() {
      try {
        if (pb.authStore.isValid) {
          try {
            const token = await pb.files.getToken();
            setFileToken(token);
            fileTokenInit.current = token;
          } catch {}
        }
        const initial = await fetchMessages({ limit: PAGE_SIZE });
        setMsgs(initial);
        const readIds = initial.filter((m) => canReadAudience(user, m.audience)).map((m) => m.id);
        const [contentRows, rxns] = await Promise.all([
          readIds.length ? fetchContent(readIds) : Promise.resolve([]),
          fetchReactions(),
        ]);
        const cMap = {};
        const safeContent = Array.isArray(contentRows) ? contentRows : Object.values(contentRows || {});
        safeContent.forEach((r) => { if (r && r.message) cMap[r.message] = withUrls(r, fileTokenInit.current); });
        setContentById(cMap);
        setReactions(rxns);

        unsubs = await subscribeRoom({
          onMessage: (action, record) => {
            if (action === 'delete') {
              setMsgs((prev) => prev.filter((m) => m.id !== record.id));
              setContentById((prev) => {
                const next = Object.assign({}, prev);
                delete next[record.id];
                return next;
              });
              setReactions((prev) => prev.filter((r) => r.message !== record.id));
              return;
            }
            if (action === 'update') {
              setMsgs((prev) => prev.map((m) => (m.id === record.id ? Object.assign({}, m, record) : m)));
              return;
            }
            setMsgs((prev) => {
              if (prev.some((m) => m.id === record.id)) return prev;
              return [...prev, record];
            });
            if (canReadAudience(user, record.audience)) {
              fetchContent([record.id]).then(([row]) => {
                if (row) {
                  setContentById((prev) => Object.assign({}, prev, { [record.id]: withUrls(row, fileTokenInit.current) }));
                  if (alertsRef.current && Notification?.permission === 'granted') {
                    try {
                      new Notification('Desk Broadcast (' + record.audience.toUpperCase() + ')', {
                        body: String(row.body || '').slice(0, 100),
                        icon: '/assets/icons/favicon-32.png',
                      });
                    } catch {}
                  }
                }
              }).catch(() => {});
            }
            if (!atBottomRef.current) {
              setNewCount((c) => c + 1);
            }
          },
          onContent: (action, record) => {
            if (action === 'delete') {
              setContentById((prev) => {
                const next = Object.assign({}, prev);
                delete next[record.message];
                return next;
              });
              return;
            }
            setContentById((prev) => Object.assign({}, prev, { [record.message]: withUrls(record, fileTokenInit.current) }));
          },
          onReaction: (action, record) => {
            if (action === 'delete') {
              setReactions((prev) => prev.filter((r) => r.id !== record.id && !(r.message === record.message && r.user === record.user && r.emoji === record.emoji)));
              return;
            }
            const same = (cand) => cand.message === record.message && cand.user === record.user && cand.emoji === record.emoji;
            setReactions((prev) => {
              const cleaned = prev.filter((r) => r.id === record.id || !(same(r) && r.id.startsWith('temp_')));
              if (cleaned.some((r) => r.id === record.id)) {
                return cleaned.map((r) => (r.id === record.id ? record : r));
              }
              if (cleaned.some(same)) return cleaned;
              return [...cleaned, record];
            });
          },
        });
      } catch (err) {
        console.warn('signal room boot error', err);
      }
    }
    boot();
    return () => {
      unsubs.forEach((u) => { try { u(); } catch {} });
    };
  }, [user]);

  useEffect(() => {
    if (atBottomRef.current && tailRef.current) {
      tailRef.current.scrollIntoView({ block: 'end' });
    }
  }, [msgs]);

  const onToggle = useCallback(async (msgId, emoji, mine) => {
    if (!user) {
      onOpenAuth && onOpenAuth();
      return;
    }
    const row = msgs.find((m) => m.id === msgId);
    if (row && !canReadAudience(user, row.audience)) {
      const activeButNotVip = subActive(user) && String(user.plan || '').toUpperCase().includes('SR');
      alert(activeButNotVip ? 'Upgrade to Perfect Box to react to VIP broadcasts.' : 'Subscribe to react to locked broadcasts.');
      return;
    }
    const existing = mine || reactions.find((r) => r.message === msgId && r.user === meId && r.emoji === emoji);
    const prevReactions = reactions;
    let tempId = null;
    if (existing) {
      setReactions((p) => p.filter((r) => r.id !== existing.id));
    } else {
      tempId = 'temp_' + Date.now();
      const optimistic = { id: tempId, message: msgId, user: meId, emoji };
      setReactions((p) => [...p, optimistic]);
    }
    try {
      const created = await toggleReaction({ messageId: msgId, emoji, existingId: existing?.id });
      if (created && tempId) {
        setReactions((p) => {
          const cleaned = p.filter((r) => r.id !== tempId);
          return cleaned.some((r) => r.id === created.id) ? cleaned : [...cleaned, created];
        });
      }
    } catch (err) {
      setReactions(prevReactions);
    }
  }, [user, meId, reactions, msgs, onOpenAuth]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text && files.length === 0) return;
    if (sending) return;
    const toSendFiles = files.slice();
    const tempId = 'pend_' + Date.now();
    const pendingItem = { id: tempId, body: text, audience, failed: false };
    setPending((p) => [...p, pendingItem]);
    setDraft('');
    setFiles([]);
    setSending(true);
    try {
      await postMessage({
        audience,
        body: text,
        files: toSendFiles,
        replyTo: replyTo?.id || null,
      });
      setPending((p) => p.filter((x) => x.id !== tempId));
      setReplyTo(null);
    } catch (err) {
      console.warn('send failed', err);
      setPending((p) => p.map((x) => (x.id === tempId ? Object.assign({}, x, { failed: true }) : x)));
      setDraft(text);
      setFiles(toSendFiles);
    } finally {
      setSending(false);
    }
  }, [draft, files, audience, replyTo, sending]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onPaste = (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items || [];
    const pasted = [];
    for (const it of items) {
      if (it.kind === 'file' && it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) pasted.push(f);
      }
    }
    if (pasted.length > 0) {
      e.preventDefault();
      setFiles((p) => [...p, ...pasted].slice(0, 4));
    }
  };

  const onPin = async (msg) => {
    try {
      await setMessagePinned(msg.id, !msg.pinned);
    } catch (err) {
      console.warn('pin toggle failed', err);
    }
  };

  const toggleAlerts = async () => {
    if (!alertsOn) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setAlertsOn(true);
          localStorage.setItem('akg_room_alerts', '1');
        }
      }
    } else {
      setAlertsOn(false);
      localStorage.setItem('akg_room_alerts', '0');
    }
  };

  const pinned = useMemo(() => msgs.find((m) => m.pinned), [msgs]);
  const visible = useMemo(() => {
    if (filter === 'all') return msgs;
    return msgs.filter((m) => m.audience === filter);
  }, [msgs, filter]);

  const grouped = useMemo(() => {
    const out = [];
    let lastKey = '';
    visible.forEach((m) => {
      const key = dayKey(m.created);
      if (key && key !== lastKey) {
        out.push({ sep: dayLabel(key), key: 'sep-' + key });
        lastKey = key;
      }
      out.push(m);
    });
    return out;
  }, [visible]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-akg-hairline bg-akg-card shadow-sm transition-[background-color,border-color] duration-150">
      <div className="flex flex-col">
        <header className="flex select-none items-center justify-between gap-2 border-b border-akg-hairline bg-akg-surface px-4 py-2.5">
          <div className="flex select-text flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="live-dot" />
            <h2 className="font-display text-[14px] font-medium text-akg-text">Signal Room</h2>
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
              Live feed
            </span>
            {user && (
              <span className="hidden rounded-md border border-akg-hairline px-2 py-0.5 font-mono text-[9px] text-akg-muted sm:inline">
                {count24h} updates (24h)
              </span>
            )}
            <span className="hidden rounded-md border border-akg-hairline px-2 py-0.5 font-mono text-[9px] text-akg-muted md:inline">
              {staff ? 'Lead Desk' : !user ? 'Guest' : subActive(user) ? (String(user.plan || '').toUpperCase().includes('PERFECT') ? 'VIP Perfect' : 'SR Box') : 'Preview'}
            </span>
          </div>
          <div className="flex select-none items-center gap-1.5">
            {staff && ['all', 'sr', 'vip'].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  'rounded-md px-2.5 py-1 font-mono text-[10px] font-medium transition-colors cursor-pointer',
                  filter === k 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'text-akg-muted hover:text-akg-text',
                )}
              >
                {k === 'all' ? 'All' : k.toUpperCase()}
              </button>
            ))}
            <button
              onClick={toggleAlerts}
              title={alertsOn ? 'Alerts on' : 'Alerts off'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md border transition-colors cursor-pointer',
                alertsOn 
                  ? 'border-emerald-500/30 text-akg-green bg-emerald-500/10' 
                  : 'border-akg-hairline text-akg-muted hover:text-akg-text',
              )}
            >
              {alertsOn ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            </button>
          </div>
        </header>

        {pinned && (
          <div className="flex select-text items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
            <Pin className="h-3 w-3 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span className="truncate font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
              {String((contentById[pinned.id] || {}).body || '').slice(0, 96) || 'Pinned broadcast'}
            </span>
          </div>
        )}

        <div ref={scrollRef} onScroll={(e) => { if (e.currentTarget.scrollTop < 140) loadOlder(); }} className="relative h-[65vh] sm:h-[62vh] min-h-[360px] overflow-y-auto overscroll-contain">
          {hasOlder && msgs.length >= PAGE_SIZE && (
            <div className="flex justify-center py-2">
              {loadingOlder ? (
                <span className="font-mono text-[10px] text-akg-muted">Loading earlier broadcasts…</span>
              ) : (
                <button onClick={loadOlder} className="rounded-md border border-akg-hairline px-3 py-1 font-mono text-[10px] text-akg-muted hover:text-akg-text cursor-pointer">
                  Load earlier
                </button>
              )}
            </div>
          )}

          {grouped.map((row) =>
            row.sep ? (
              <div key={row.key} className="my-2 flex select-none items-center gap-3 px-4">
                <span className="h-px flex-1 bg-akg-hairline" />
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-akg-muted">{row.sep}</span>
                <span className="h-px flex-1 bg-akg-hairline" />
              </div>
            ) : (
              <MessageRow
                key={row.id}
                msg={row}
                content={contentById[row.id]}
                audience={row.audience}
                user={user}
                meId={meId}
                reactions={reactions}
                onToggle={onToggle}
                onReply={(m) => setReplyTo(m)}
                onPin={onPin}
                onEdit={(m) => setEditing(Object.assign({}, m, { __body: String((contentById[m.id] || {}).body || '') }))}
                onDelete={(m) => { if (window.confirm('Delete this broadcast?')) deleteMessage(m.id); }}
                onZoom={(c, f) => setZoom({ c, f })}
                contentMap={contentById}
                onOpenPricing={onOpenPricing}
                onOpenAuth={onOpenAuth}
              />
            ),
          )}

          {msgs.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center select-none">
              <Lock className="h-5 w-5 text-akg-muted" />
              <p className="font-mono text-xs text-akg-muted">The desk broadcasts here. Nothing posted yet.</p>
            </div>
          )}

          {pending.map((p, i) => (
            <div key={'pd' + i} className="flex w-full flex-row-reverse justify-start gap-2 px-3 py-0.5">
              <div className={cn(
                'max-w-[min(420px,88%)] rounded-xl rounded-br-sm border px-4 py-2.5',
                p.failed ? 'border-rose-500/50 bg-rose-500/5' : 'border-akg-hairline bg-akg-surface ' + (p.failed ? '' : 'opacity-60'),
              )}>
                {p.failed && <p className="mb-1 font-mono text-[10px] font-medium text-rose-500">Failed to send: draft restored. Press send again.</p>}
                <pre className="max-w-[400px] whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-akg-text">{p.body}</pre>
              </div>
            </div>
          ))}

          <div ref={tailRef} className="h-2" />

          {newCount > 0 && (
            <button
              onClick={() => { tailRef.current.scrollIntoView({ block: 'end' }); setNewCount(0); }}
              className="sticky bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 px-3.5 py-1.5 font-mono text-[10px] font-semibold shadow-md cursor-pointer transition-colors"
            >
              {newCount} new
            </button>
          )}
        </div>

        {staff ? (
          <div className="select-text border-t border-akg-hairline bg-akg-surface">
            {replyTo && (
              <div className="flex items-center justify-between gap-2 border-b border-akg-hairline px-4 py-1.5">
                <span className="truncate font-mono text-[10px] text-akg-muted">
                  {AUDIENCE_LABEL[replyTo.audience] || replyTo.audience} · {String((contentById[replyTo.id] || {}).body || '').slice(0, 48) || (replyTo.id && 'earlier broadcast')}
                </span>
                <button onClick={() => setReplyTo(null)} className="cursor-pointer"><X className="h-3.5 w-3.5 text-akg-muted hover:text-akg-text" /></button>
              </div>
            )}
            {editing && (
              <div className="flex items-end gap-2 border-b border-akg-hairline px-4 py-2">
                <textarea
                  value={editing.__body}
                  onChange={(e) => setEditing((ed) => Object.assign({}, ed, { __body: e.target.value }))}
                  rows={2}
                  className="min-h-[36px] flex-1 resize-none bg-transparent font-sans text-[12px] text-akg-text outline-none"
                />
                <div className="flex items-center gap-1.5 pb-0.5">
                  <button
                    onClick={() => {
                      updateMessageBody(contentById[editing.id] && contentById[editing.id].id, editing.__body).then(() => setEditing(null)).catch(() => {});
                    }}
                    className="rounded-md bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 px-3 py-1 font-mono text-[10px] font-semibold cursor-pointer transition-colors"
                  >
                    Save edit
                  </button>
                  <button onClick={() => setEditing(null)} className="font-mono text-[10px] text-akg-muted hover:text-akg-text cursor-pointer">Cancel</button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-akg-hairline px-3.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-akg-muted">Audience:</span>
                {['vip', 'sr', 'all'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { setAudience(k); localStorage.setItem('akg_room_audience', k); }}
                    className={cn(
                      'rounded-md px-2.5 py-0.5 font-mono text-[10px] font-semibold transition-colors cursor-pointer',
                      audience === k 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400' 
                        : 'border border-akg-hairline text-akg-muted hover:text-akg-text',
                    )}
                  >
                    {k.toUpperCase()}
                  </button>
                ))}
              </div>
              <span className="hidden font-mono text-[9.5px] text-akg-muted sm:inline">
                Enter to send · Shift+Enter for newline
              </span>
            </div>
            <div className="flex items-end gap-2 px-3 py-2.5">
              <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-akg-hairline text-akg-muted transition-colors hover:border-emerald-500/40 hover:text-akg-green" title="Attach images">
                <ImagePlus className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => { setFiles((p) => [...p, ...Array.from(e.target.files || [])].slice(0, 4)); e.target.value = ''; }}
                />
              </label>
              <textarea
                value={draft}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={'Broadcast to ' + (AUDIENCE_LABEL[audience] || 'members') + '…'}
                rows={1}
                className="max-h-32 min-h-[38px] flex-1 resize-none rounded-lg border border-akg-hairline bg-akg-card px-3.5 py-2 font-sans text-[13px] text-akg-text outline-none transition-colors placeholder:text-akg-muted focus:border-emerald-500/40"
              />
              <button
                onClick={send}
                disabled={sending || (!draft.trim() && files.length === 0)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 transition-opacity disabled:opacity-40 cursor-pointer"
                title="Send broadcast"
              >
                {files.length > 0 ? <Paperclip className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            {files.length > 0 && (
              <div className="flex select-none flex-wrap items-center gap-2 px-4 pb-2">
                {files.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 rounded-md border border-akg-hairline bg-akg-card px-2 py-0.5 font-mono text-[10px] text-akg-text">
                    <ImagePlus className="h-3 w-3" />
                    {f.name || 'pasted'} #{i + 1}
                    <button onClick={() => setFiles((p) => p.filter((_, x) => x !== i))} className="cursor-pointer"><X className="h-3 w-3 text-akg-muted hover:text-akg-text" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex select-none flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-akg-hairline px-4 py-3 sm:py-2.5 bg-akg-surface">
            {!user ? (
              <span className="text-[11px] text-akg-muted">Sign in to follow the desk in real time.</span>
            ) : subActive(user) ? (
              <span className="text-[11px] text-akg-muted">
                You are on the {String(user.plan || '').toUpperCase().includes('PERFECT') ? 'Perfect Box' : 'Signal Box'} feed. Broadcasts land here live.
              </span>
            ) : (
              <span className="text-[11px] text-akg-muted">Members read the desk live.</span>
            )}
            <button
              onClick={user ? onOpenPricing : onOpenAuth}
              className="w-full sm:w-auto text-center shrink-0 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 px-3.5 py-1.5 font-mono text-[10px] font-semibold cursor-pointer shadow-xs transition-colors"
            >
              {!user ? 'Sign in' : String(user.plan || '').toUpperCase().includes('SR') && subActive(user) ? 'Upgrade to Perfect Box' : 'Subscribe'}
            </button>
          </div>
        )}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6" onClick={() => setZoom(null)}>
          <img
            src={(zoom.c.__urls && zoom.c.__urls[zoom.f]) || pb.files.getURL(zoom.c, zoom.f)}
            alt=""
            className="max-h-[88vh] max-w-full rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default SignalRoom;
