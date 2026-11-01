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
  'XAUUSD level worked out exactly as planned — full execution analysis posted for members.',
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
    <div className="mt-0.5 w-full max-w-full sm:max-w-[340px] overflow-hidden rounded-2xl rounded-bl-md border border-white/[0.06] bg-akg-surface">
      <div className="pointer-events-none select-none px-3.5 sm:px-4 py-3 blur-[5px]" aria-hidden="true">
        <p className="font-sans text-[13px] leading-relaxed text-akg-silver">{fakeTextFor(audience + 'x')}</p>
        {hasImage && <div className="mt-2 h-16 w-32 rounded-lg border border-white/10 bg-white/[0.02]" />}
      </div>
      <button
        onClick={user ? onOpenPricing : onOpenAuth}
        className="flex w-full items-center justify-center gap-2 border-t border-white/[0.06] px-4 py-2.5 transition-colors hover:bg-[#F3C653]/[0.08]"
      >
        <Lock className="h-3.5 w-3.5 text-akg-gold" />
        <span className="text-[11px] font-semibold text-akg-gold">{label}</span>
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
    <div className="mb-1 rounded-lg border-l-2 border-[#F3C653]/60 bg-white/[0.02] px-2 py-1">
      <p className="font-data text-[10px] text-akg-muted">{snippet || 'earlier broadcast'}</p>
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
        className="mt-1 h-6 w-6 rounded-full text-[11px] text-akg-muted opacity-0 transition-opacity hover:bg-white/5 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
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
              'flex h-6 items-center gap-1 rounded-full border px-2 font-data text-[11px] transition-colors',
              mine ? 'border-[#F3C653]/60 bg-[#F3C653]/15 text-akg-gold' : 'border-white/10 bg-white/[0.04] text-akg-silver hover:border-white/20',
            )}
          >
            <span>{emoji}</span>
            <span className="font-semibold">{stats[emoji]}</span>
          </button>
        );
      })}
      {open && (
        <div className="absolute bottom-8 left-0 z-20 flex gap-1 rounded-xl border border-white/10 bg-[#10131A] p-1 shadow-xl shadow-black/50" onMouseLeave={() => setOpen(false)}>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { setOpen(false); onToggle(msgId, emoji, own[emoji]); }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-base transition-transform hover:scale-110 hover:bg-white/5',
                own[emoji] && 'bg-[#F3C653]/15',
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
  const mine = !!msg.author && (msg.author === meId || msg.author === meId);
  const right = mine || (staff && !msg.author);
  const body = readable ? String(content?.body || '') : '';
  const files = readable && Array.isArray(content?.attachments) ? content.attachments : [];
  const attCount = msg.has_image ? (files.length || (msg.has_image ? 1 : 0)) : 0;

  return (
    <div className={'group relative flex w-full gap-2 px-2.5 sm:px-3 py-0.5 ' + (right ? 'flex-row-reverse justify-start' : 'flex-row justify-start')}>
      <div className={cn('flex flex-col', right ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'max-w-[min(420px,90%)] sm:max-w-[min(420px,88%)] rounded-2xl border px-3.5 sm:px-4 py-2.5 ' + (right ? 'rounded-br-md' : 'rounded-bl-md'),
            msg.pinned ? 'border-[#F3C653]/40 bg-[#F3C653]/[0.06]' : right ? 'border-white/[0.07] bg-white/[0.03]' : 'border-white/[0.06] bg-akg-surface',
          )}
        >
          <ReplyQuote replyTo={msg.reply_to} contentMap={contentMap} user={user} />
          {!readable && (
            <LockedBubble audience={audience} user={user} onOpenPricing={onOpenPricing} onOpenAuth={onOpenAuth} hasImage={msg.has_image} />
          )}
          {readable && !!body && (
            <pre className="max-w-full whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-akg-silver">{body}</pre>
          )}
          {readable && files.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {files.map((f, i) => (
                <img
                  key={f + i}
                  src={(content.__urls && content.__urls[f]) || pb.files.getURL(content, f)}
                  alt=""
                  onClick={() => onZoom(content, f)}
                  className="max-h-72 cursor-zoom-in rounded-xl border border-white/10 object-cover"
                />
              ))}
            </div>
          )}
          {readable && !files.length && msg.has_image && (
            <div className="mt-2 flex h-20 w-40 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <Lock className="h-4 w-4 text-akg-muted" />
            </div>
          )}
        </div>
        {readable && (
          <Reactions msgId={msg.id} reactions={reactions} meId={meId} onToggle={onToggle} />
        )}
      </div>

      <div className={cn('flex flex-col', right ? 'items-end' : 'items-start', 'pt-1')}>
        {msg.audience !== 'all' && (
          <span
            className={cn(
              'mb-1 rounded px-1.5 py-0.5 font-data text-[9px] font-bold tracking-wide',
              msg.audience === 'vip' ? 'bg-[#F3C653]/15 text-akg-gold' : 'bg-akg-green/[0.14] text-akg-green',
            )}
          >
            {msg.audience === 'vip' ? 'VIP' : 'SR'}
          </span>
        )}
        <span className="font-data text-[9.5px] text-akg-muted">{fmtTime(msg.created)}</span>
      </div>

      {staff && (
        <div className="absolute top-1 z-20 flex gap-0.5 rounded-xl border border-white/10 bg-[#10131A] p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow-xl shadow-black/50 transition-opacity"
          style={{ [right ? 'left' : 'right']: '6px' }}>
          <IconBtn title="Reply" onClick={() => onReply(msg)}><Reply className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title={msg.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(msg)}>
            {msg.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </IconBtn>
          <IconBtn title="Edit" onClick={() => onEdit(msg)}><Pencil className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Delete" onClick={() => onDelete(msg)}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
        </div>
      )}
    </div>
  );
}

function IconBtn({ title, onClick, children }) {
  return (
    <button title={title} onClick={onClick} className="flex h-7 w-7 items-center justify-center rounded-lg text-akg-silver transition-colors hover:bg-white/5 hover:text-white">
      {children}
    </button>
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

  const mergeMessages = useCallback((incoming) => {
    setMsgs((prev) => {
      const map = {};
      prev.forEach((m) => { map[m.id] = m; });
      let added = 0;
      incoming.forEach((m) => {
        if (!map[m.id]) added += 1;
        map[m.id] = m;
      });
      if (added > 0 && !atBottomRef.current) setNewCount((n) => n + added);
      return Object.values(map).sort((a, b) => String(a.created || '').localeCompare(String(b.created || '')));
    });
  }, []);

  useEffect(() => {
    let alive = true;
    fetchMessages().then(async (rows) => {
      if (!alive) return;
      mergeMessages(rows.slice().reverse());
      setHasOlder(rows.length >= PAGE_SIZE);
      const fetched = await fetchContent(rows.map((r) => r.id)).catch(() => ({}));
      if (!alive) return;
      setContentById((prev) => {
        const merged = Object.assign({}, prev);
        Object.keys(fetched).forEach((mid) => { merged[mid] = withUrls(fetched[mid], fileTokenInit.current); });
        return merged;
      });
    }).catch(() => {});
    fetchReactions().then((rows) => alive && setReactions(rows)).catch(() => {});
    if (user) pb.files.getToken().then((t) => alive && setFileToken(t)).catch(() => {});
    let unsubFn = null;
    subscribeRoom({
      onMessages: (e) => {
        if (e.action === 'create') {
          mergeMessages([e.record]);
          if (!atBottomRef.current && alertsRef.current) notifyFor(e.record, user);
        } else if (e.action === 'update') {
          mergeMessages([e.record]);
        } else if (e.action === 'delete') {
          setMsgs((prev) => prev.filter((m) => m.id !== e.record.id));
          setContentById((prev) => {
            const cp = Object.assign({}, prev);
            delete cp[e.record.id];
            return cp;
          });
        }
      },
      onContent: (e) => {
        setContentById((prev) => Object.assign({}, prev, { [e.record.message]: withUrls(e.record, fileToken) }));
      },
      onReactions: (e) => {
        setReactions((prev) => {
          if (e.action === 'create') return [...prev, e.record];
          if (e.action === 'update') return prev.map((r) => (r.id === e.record.id ? e.record : r));
          return prev.filter((r) => r.id !== e.record.id);
        });
      },
    }).then((unsub) => { unsubFn = unsub; });
    return () => {
      alive = false;
      if (unsubFn) unsubFn();
    };
  }, [mergeMessages, meId, user, fileToken]);

  useEffect(() => {
    if (!fileToken) return;
    setContentById((prev) => {
      const out = {};
      Object.keys(prev).forEach((k) => { out[k] = withUrls(prev[k], fileToken); });
      return out;
    });
  }, [fileToken]);

  useEffect(() => {
    tailRef.current && tailRef.current.scrollIntoView({ block: 'end' });
  }, [msgs.length, pending.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const onScroll = () => {
      atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
      if (atBottomRef.current) setNewCount(0);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  async function loadOlder() {
    if (loadingOlder || !hasOlder || !msgs.length) return;
    setLoadingOlder(true);
    const el = scrollRef.current;
    const before = msgs[0].created;
    const older = await fetchMessages({ before });
    if (older.length < PAGE_SIZE) setHasOlder(false);
    const el2 = scrollRef.current;
    const diff = el2 ? el2.scrollHeight : 0;
    mergeMessages(older.reverse());
    requestAnimationFrame(() => {
      if (el2 && el) el2.scrollTop = el2.scrollHeight - diff;
    });
    setLoadingOlder(false);
  }

  function notifyFor(m, usr) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const readable = canReadAudience(usr, m.audience);
    const t = new Notification('AKG Signal Room', {
      body: readable
        ? 'New broadcast posted in the room.'
        : 'New ' + (AUDIENCE_LABEL[m.audience] || '').toUpperCase() + ' broadcast. Subscription required.',
      tag: 'akg-room',
    });
    t.onclick = () => window.focus();
  }

  async function send() {
    const body = draft.trim();
    if (!body && !files.length) return;
    setSending(true);
    const temp = { __pending: true, body, audience, failed: false };
    setPending((p) => [...p, temp]);
    setDraft('');
    const sentFiles = files;
    setFiles([]);
    const usedReply = replyTo;
    setReplyTo(null);
    const usedAudience = audience;
    try {
      await postMessage({ audience: usedAudience, body, replyTo: usedReply ? (usedReply.id || usedReply) : '', files: sentFiles });
      setPending((p) => p.filter((x) => x !== temp));
      atBottomRef.current = true;
    } catch {
      setPending((p) => p.map((x) => (x === temp ? Object.assign({}, x, { failed: true }) : x)));
      setDraft(body);
      setReplyTo(usedReply);
      setFiles(sentFiles);
    } finally {
      setSending(false);
    }
  }

  async function onPin(msg) {
    await setMessagePinned(msg).catch(() => {});
  }

  function onToggle(msgId, emoji, existing) {
    toggleReaction(msgId, emoji, existing).catch(() => {});
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!e.nativeEvent.isComposing) send();
    }
  }

  function onPaste(e) {
    const img = Array.from(e.clipboardData.files || []).filter((f) => f.type.startsWith('image/'))[0];
    if (!img) return;
    e.preventDefault();
    setFiles((p) => [...p, img].slice(0, 4));
  }

  function toggleAlerts() {
    if (!alertsOn) {
      if (typeof Notification === 'undefined') return;
      Notification.requestPermission().then((p) => {
        if (p === 'granted') {
          localStorage.setItem('akg_room_alerts', '1');
          setAlertsOn(true);
        }
      });
    } else {
      localStorage.setItem('akg_room_alerts', '0');
      setAlertsOn(false);
    }
  }

  const visible = useMemo(() => msgs.filter((m) => (filter === 'all' ? true : m.audience === filter)), [msgs, filter]);
  const pinned = useMemo(() => visible.find((m) => m.pinned) || msgs.find((m) => m.pinned), [visible, msgs]);
  const count24h = useMemo(() => {
    const since = Date.now() - 24 * 3600 * 1000;
    return msgs.filter((m) => {
      const t = new Date(String(m.created || '').replace(' ', 'T')).getTime();
      return !Number.isNaN(t) && t > since;
    }).length;
  }, [msgs]);

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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0A0D13]">
      <div className="flex flex-col">
        <header className="flex select-none items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex select-text flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-akg-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-akg-green" />
            </span>
            <h2 className="font-display text-[15px] font-bold text-white">Signal Room</h2>
            <span className="rounded-full border border-akg-green/30 bg-akg-green/10 px-2 py-0.5 font-data text-[9px] font-semibold uppercase tracking-wider text-akg-green">
              Live Feed
            </span>
            <span className="hidden rounded-full border border-white/10 px-2 py-0.5 font-data text-[9px] uppercase tracking-wide text-akg-muted sm:inline">
              {count24h} updates (24h)
            </span>
            <span className="hidden rounded-full border border-white/10 px-2 py-0.5 font-data text-[9px] uppercase tracking-wide text-akg-silver md:inline">
              {staff ? 'Lead Desk' : !user ? 'Guest' : subActive(user) ? (String(user.plan || '').toUpperCase().includes('PERFECT') ? 'VIP Perfect' : 'SR Box') : 'Preview'}
            </span>
          </div>
          <div className="flex select-none items-center gap-1.5">
            {staff && ['all', 'sr', 'vip'].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  'rounded-full px-2.5 py-1 font-data text-[10px] font-bold transition-colors',
                  filter === k ? 'bg-[#F3C653]/15 text-akg-gold' : 'text-akg-muted hover:text-white',
                )}
              >
                {k === 'all' ? 'All' : k.toUpperCase()}
              </button>
            ))}
            <button
              onClick={toggleAlerts}
              title={alertsOn ? 'Alerts on' : 'Alerts off'}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                alertsOn ? 'border-akg-green/40 text-akg-green' : 'border-white/10 text-akg-muted hover:text-white',
              )}
            >
              {alertsOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {pinned && (
          <div className="flex select-text items-center gap-2 border-b border-[#F3C653]/20 bg-[#F3C653]/[0.05] px-4 py-2">
            <Pin className="h-3 w-3 shrink-0 text-akg-gold" />
            <span className="truncate font-data text-[11px] text-akg-gold">
              {String((contentById[pinned.id] || {}).body || '').slice(0, 96) || 'Pinned broadcast'}
            </span>
          </div>
        )}

        <div ref={scrollRef} onScroll={(e) => { if (e.currentTarget.scrollTop < 140) loadOlder(); }} className="relative h-[65vh] sm:h-[62vh] min-h-[360px] overflow-y-auto overscroll-contain">
          {hasOlder && msgs.length >= PAGE_SIZE && (
            <div className="flex justify-center py-2">
              {loadingOlder ? (
                <span className="font-data text-[10px] text-akg-muted">Loading earlier broadcasts…</span>
              ) : (
                <button onClick={loadOlder} className="rounded-full border border-white/10 px-3 py-1 font-data text-[10px] text-akg-muted hover:text-white">
                  Load earlier
                </button>
              )}
            </div>
          )}

          {grouped.map((row) =>
            row.sep ? (
              <div key={row.key} className="my-2 flex select-none items-center gap-3 px-4">
                <span className="h-px flex-1 bg-white/[0.05]" />
                <span className="font-data text-[9px] uppercase tracking-[0.2em] text-akg-muted">{row.sep}</span>
                <span className="h-px flex-1 bg-white/[0.05]" />
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
              <p className="font-data text-xs text-akg-muted">The desk broadcasts here. Nothing posted yet.</p>
            </div>
          )}

          {pending.map((p, i) => (
            <div key={'pd' + i} className="flex w-full flex-row-reverse justify-start gap-2 px-3 py-0.5">
              <div className={cn(
                'max-w-[min(420px,88%)] rounded-2xl rounded-br-md border px-4 py-2.5',
                p.failed ? 'border-rose-500/50 bg-rose-500/[0.06]' : 'border-white/[0.07] bg-white/[0.03] ' + (p.failed ? '' : 'opacity-60'),
              )}>
                {p.failed && <p className="mb-1 font-data text-[10px] font-bold text-rose-400">Failed to send — draft restored. Press send again.</p>}
                <pre className="max-w-[400px] whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-akg-silver">{p.body}</pre>
              </div>
            </div>
          ))}

          <div ref={tailRef} className="h-2" />

          {newCount > 0 && (
            <button
              onClick={() => { tailRef.current.scrollIntoView({ block: 'end' }); setNewCount(0); }}
              className="sticky bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#F3C653] px-3.5 py-1.5 font-data text-[10px] font-bold text-[#1C1403] shadow-lg shadow-black/40"
            >
              {newCount} new
            </button>
          )}
        </div>

        {staff ? (
          <div className="select-text border-t border-white/[0.06] bg-white/[0.015]">
            {replyTo && (
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.05] px-4 py-1.5">
                <span className="truncate font-data text-[10px] text-akg-muted">
                  {AUDIENCE_LABEL[replyTo.audience] || replyTo.audience} · {String((contentById[replyTo.id] || {}).body || '').slice(0, 48) || (replyTo.id && 'earlier broadcast')}
                </span>
                <button onClick={() => setReplyTo(null)}><X className="h-3.5 w-3.5 text-akg-muted hover:text-white" /></button>
              </div>
            )}
            {editing && (
              <div className="flex items-end gap-2 border-b border-white/[0.05] px-4 py-2">
                <textarea
                  value={editing.__body}
                  onChange={(e) => setEditing((ed) => Object.assign({}, ed, { __body: e.target.value }))}
                  rows={2}
                  className="min-h-[36px] flex-1 resize-none bg-transparent font-sans text-[12px] text-akg-silver outline-none"
                />
                <div className="flex items-center gap-1.5 pb-0.5">
                  <button
                    onClick={() => {
                      updateMessageBody(contentById[editing.id] && contentById[editing.id].id, editing.__body).then(() => setEditing(null)).catch(() => {});
                    }}
                    className="rounded-full bg-[#F3C653] px-3 py-1 font-data text-[10px] font-bold text-[#1C1403]"
                  >
                    Save edit
                  </button>
                  <button onClick={() => setEditing(null)} className="font-data text-[10px] text-akg-muted hover:text-white">Cancel</button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.04] px-3.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-data text-[10px] uppercase tracking-wider text-akg-muted">Audience:</span>
                {['vip', 'sr', 'all'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { setAudience(k); localStorage.setItem('akg_room_audience', k); }}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 font-data text-[10px] font-bold transition-colors',
                      audience === k ? 'bg-[#F3C653] text-[#1C1403]' : 'border border-white/10 text-akg-muted hover:text-white',
                    )}
                  >
                    {k.toUpperCase()}
                  </button>
                ))}
              </div>
              <span className="hidden font-data text-[9.5px] text-akg-muted sm:inline">
                Enter to send · Shift+Enter for newline
              </span>
            </div>
            <div className="flex items-end gap-2 px-3 py-2.5">
              <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 text-akg-muted transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold" title="Attach images">
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
                className="max-h-32 min-h-[38px] flex-1 resize-none rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 font-sans text-[13px] text-white outline-none transition-colors placeholder:text-akg-muted focus:border-[#F3C653]/40"
              />
              <button
                onClick={send}
                disabled={sending || (!draft.trim() && files.length === 0)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(120deg,#E8BC4F,#F3C653,#DFAE3E)] text-[#1C1403] transition-opacity disabled:opacity-40"
                title="Send broadcast"
              >
                {files.length > 0 ? <Paperclip className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            {files.length > 0 && (
              <div className="flex select-none flex-wrap items-center gap-2 px-4 pb-2">
                {files.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 font-data text-[10px] text-akg-silver">
                    <ImagePlus className="h-3 w-3" />
                    {f.name || 'pasted'} #{i + 1}
                    <button onClick={() => setFiles((p) => p.filter((_, x) => x !== i))}><X className="h-3 w-3 text-akg-muted hover:text-white" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex select-none flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-white/[0.06] px-4 py-3 sm:py-2.5">
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
              className="w-full sm:w-auto text-center shrink-0 rounded-full bg-[linear-gradient(120deg,#E8BC4F,#F3C653,#DFAE3E)] px-3.5 py-1.5 font-data text-[10px] font-bold text-[#1C1403]"
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
