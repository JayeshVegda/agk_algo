import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users as UsersIcon, Bot as BotIcon, Activity, Plus, Pencil, Receipt, ChevronRight, ShieldCheck, Download, Gift, Copy, Check, Key } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { SectionHeader, FilterChips, SearchInput, EmptyState, StatusPill, labelCls, inputCls } from '../components/ui';
import { ActionSheet } from '../components/ActionSheet';
import { cycleDaysLeft, fmtDateTime, fmtDate } from '../lib/format';
import { cn } from '../../../lib/utils';

const PLAN_LABELS = {
  PERFECT_SIGNAL_BOX: 'Perfect Signal Box',
  SR_SIGNAL_BOX: 'SR Signal Box',
  NONE: 'No plan',
};
const SIG_PLANS = Object.keys(PLAN_LABELS).filter((p) => p !== 'NONE');
const PAGE_SIZE = 12;
const BOT_RE = /^BOT:\s*(.+?)\s*\(([^#)]+)#([^)]+)\)/i;

const keyOf = (email) => String(email || '').trim().toLowerCase();

export default function Users() {
  const { grantDays, saveUserAccess } = useAdmin();
  const [tab, setTab] = useState('members'); // members | signal | bot
  const [sub, setSub] = useState('all');
  const [search, setSearch] = useState('');
  const [botFilter, setBotFilter] = useState('');
  const [pg, setPg] = useState(1);
  const [dossier, setDossier] = useState(null);
  const [editing, setEditing] = useState(null);

  // Traders data is small (tens, not thousands): load whole tables once and
  // derive every base server-independently. Admin rules already gate this read.
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Roster route returns trader records with emails (PB hides user emails
      // from other users, even console admins — see hook /api/akg/traders).
      const [us, ps, bs] = await Promise.all([
        pb.send('/api/akg/traders'),
        pb.collection('payments').getFullList({ sort: '-created' }),
        pb.collection('bots').getFullList({ sort: 'name' }),
      ]);
      setUsers(us.filter((u) => u.role !== 'admin'));
      setPayments(ps);
      setBots(bs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsubs = ['users', 'payments'].map((c) => pb.collection(c).subscribe('*', () => load()).catch(() => null));
    return () => unsubs.forEach((u) => u?.then?.((fn) => fn && fn()));
  }, [load]);

  /* ---------------------------- derived indexes --------------------------- */
  const confirmed = useMemo(() => payments.filter((p) => p.status === 'confirmed'), [payments]);

  const paymentsByEmail = useMemo(() => {
    const idx = new Map();
    for (const p of confirmed) {
      const k = keyOf(p.user_email);
      if (!idx.has(k)) idx.set(k, []);
      idx.get(k).push(p);
    }
    return idx;
  }, [confirmed]);

  const sigOf = useMemo(() => {
    const idx = new Map(); // email -> { SR_SIGNAL_BOX: n, PERFECT_SIGNAL_BOX: n, last: ts, spend }
    for (const p of confirmed) {
      if (!SIG_PLANS.includes(p.plan)) continue;
      const k = keyOf(p.user_email);
      const rec = idx.get(k) || { SR_SIGNAL_BOX: 0, PERFECT_SIGNAL_BOX: 0, last: 0, spend: 0 };
      rec[p.plan] += 1;
      rec.spend += Number(p.amount) || 0;
      rec.last = Math.max(rec.last, new Date(String(p.created).replace(' ', 'T')).getTime() || 0);
      idx.set(k, rec);
    }
    return idx;
  }, [confirmed]);

  const botsOf = useMemo(() => {
    const idx = new Map(); // email -> { licenses: [{name, platform, acct, key, ts}], pending: n, spend }
    for (const p of payments) {
      if (!String(p.plan).startsWith('BOT:')) continue;
      const k = keyOf(p.user_email);
      const rec = idx.get(k) || { licenses: [], pending: 0, spend: 0 };
      idx.set(k, rec);
      if (p.status === 'confirmed') {
        const m = BOT_RE.exec(String(p.plan));
        rec.licenses.push({
          id: p.id,
          name: (m?.[1] || '').trim(),
          platform: (m?.[2] || '').trim(),
          acct: (m?.[3] || '').trim(),
          key: p.license_key || '',
          ts: new Date(String(p.created).replace(' ', 'T')).getTime() || 0,
        });
        rec.spend += Number(p.amount) || 0;
      } else if (p.status === 'pending') {
        rec.pending += 1;
      }
    }
    return idx;
  }, [payments]);

  const botNames = useMemo(() => [...new Set([...bots.map((b) => b.name), ...[...botsOf.values()].flatMap((r) => r.licenses.map((l) => l.name))])].sort(), [bots, botsOf]);

  /* ------------------------------ selectors ------------------------------- */
  const stateOf = useCallback((u) => {
    const days = cycleDaysLeft(u);
    const expiryTs = String(u.cycle_expires_at || '').trim() ? new Date(String(u.cycle_expires_at).replace(' ', 'T')).getTime() : 0;
    const sig = SIG_PLANS.includes(u.plan);
    const active = sig && days !== null && days >= 0;
    const expiring = active && days <= 3;
    const lapsed = sig && days === -1 && expiryTs >= Date.now() - 60 * 86400000;
    return { days, active, expiring, lapsed, free: (!u.plan || u.plan === 'NONE') && !sigOf.has(keyOf(u.email)) && !botsOf.has(keyOf(u.email)) };
  }, [sigOf, botsOf]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const hit = (u) => !q || (u.email || '').toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q);

    if (tab === 'signal') {
      const hasSig = (u) => SIG_PLANS.includes(u.plan) || sigOf.has(keyOf(u.email));
      return users.filter(hasSig).filter((u) => {
        const s = stateOf(u);
        const r = sigOf.get(keyOf(u.email)) || {};
        switch (sub) {
          case 'sr': return u.plan === 'SR_SIGNAL_BOX' || r.SR_SIGNAL_BOX;
          case 'vip': return u.plan === 'PERFECT_SIGNAL_BOX' || r.PERFECT_SIGNAL_BOX;
          case 'active': return s.active;
          case 'expiring': return s.expiring;
          case 'lapsed': return s.lapsed;
          default: return true;
        }
      }).filter(hit);
    }
    if (tab === 'bot') {
      return users.filter((u) => {
        const r = botsOf.get(keyOf(u.email));
        if (!r) return false;
        if (sub === 'licensed' && !r.licenses.length) return false;
        if (sub === 'pending' && !r.pending) return false;
        if (botFilter && !r.licenses.some((l) => l.name === botFilter)) return false;
        return true;
      }).filter(hit);
    }
    // members
    return users.filter((u) => {
      const s = stateOf(u);
      if (sub === 'active') return s.active;
      if (sub === 'expiring') return s.expiring;
      if (sub === 'lapsed') return s.lapsed;
      if (sub === 'free') return s.free;
      return true;
    }).filter(hit);
  }, [users, tab, sub, search, sigOf, botsOf, stateOf, botFilter]);

  const paged = useMemo(() => rows.slice((pg - 1) * PAGE_SIZE, pg * PAGE_SIZE), [rows, pg]);
  useEffect(() => setPg(1), [tab, sub, search, botFilter]);

  const openDossier = (u) => setDossier(u);

  const SUBS = useMemo(() => {
    if (tab === 'members') {
      return [
        { id: 'all', label: 'All', count: users.length },
        { id: 'active', label: 'Active', count: users.filter((u) => stateOf(u).active).length },
        { id: 'expiring', label: 'Expiring ≤3d', count: users.filter((u) => stateOf(u).expiring).length },
        { id: 'lapsed', label: 'Lapsed', count: users.filter((u) => stateOf(u).lapsed).length },
        { id: 'free', label: 'Free', count: users.filter((u) => stateOf(u).free).length },
      ];
    }
    if (tab === 'signal') {
      const siders = users.filter((u) => SIG_PLANS.includes(u.plan) || sigOf.has(keyOf(u.email)));
      return [
        { id: 'all', label: 'All signal members', count: siders.length },
        { id: 'sr', label: 'SR Box', count: siders.filter((u) => u.plan === 'SR_SIGNAL_BOX' || sigOf.get(keyOf(u.email))?.SR_SIGNAL_BOX).length },
        { id: 'vip', label: 'Perfect Box', count: siders.filter((u) => u.plan === 'PERFECT_SIGNAL_BOX' || sigOf.get(keyOf(u.email))?.PERFECT_SIGNAL_BOX).length },
        { id: 'active', label: 'Active', count: siders.filter((u) => stateOf(u).active).length },
        { id: 'expiring', label: 'Expiring ≤3d', count: siders.filter((u) => stateOf(u).expiring).length },
        { id: 'lapsed', label: 'Lapsed', count: siders.filter((u) => stateOf(u).lapsed).length },
      ];
    }
    const buyers = users.filter((u) => botsOf.has(keyOf(u.email)));
    return [
      { id: 'all', label: 'All bot buyers', count: buyers.length },
      { id: 'licensed', label: 'Licensed', count: buyers.filter((u) => botsOf.get(keyOf(u.email)).licenses.length).length },
      { id: 'pending', label: 'Awaiting desk', count: buyers.filter((u) => botsOf.get(keyOf(u.email)).pending > 0).length },
    ];
  }, [tab, users, sigOf, botsOf, stateOf]);

  if (loading && !users.length) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Traders & Access" sub="Loading members…" />
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Traders & Access"
        actions={
          <button
            onClick={() => exportCsv({ tab, rows, sigOf, botsOf, stateOf })}
            className="flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold text-akg-silver transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
      />

      {/* Base switcher */}
      <div className="flex w-fit max-w-full flex-wrap gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {[
          ['members', 'All Members', UsersIcon],
          ['signal', 'Signal Base', Activity],
          ['bot', 'Bot Base', BotIcon],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setSub('all'); setBotFilter(''); }}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all',
              tab === id
                ? 'bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-[#1C1403] shadow-md shadow-[#F3C653]/20'
                : 'text-akg-muted hover:text-akg-silver'
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      <p className="-mt-2 text-xs text-akg-muted">
        {tab === 'members' && 'Search members, extend cycles, and manage plans. Tap a trader for their full dossier.'}
        {tab === 'signal' && 'Everyone who paid a signal package (or has one granted). Extend cycles from the card or the dossier.'}
        {tab === 'bot' && 'Everyone who bought an EA license, with accounts, keys, and desk-verification status. Filter by system.'}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips value={sub} onChange={setSub} options={SUBS} />
          {tab === 'bot' && (
            <select
              id="akg-admin-bot-filter"
              name="botFilter"
              value={botFilter}
              onChange={(e) => setBotFilter(e.target.value)}
              className="h-8 rounded-full border border-white/10 bg-[#0A0D13] px-3 text-xs font-semibold text-akg-silver focus:border-[#F3C653]/50 focus:outline-none"
            >
              <option value="">All systems</option>
              {botNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Email or name..." />
      </div>

      {rows.length === 0 && !loading ? (
        <EmptyState icon={tab === 'bot' ? BotIcon : tab === 'signal' ? Activity : UsersIcon} title="No traders match" hint="Adjust the filters or search." />
      ) : (
        <>
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {paged.map((u) => {
              const email = keyOf(u.email);
              const sig = sigOf.get(email);
              const botRec = botsOf.get(email);
              return (
                <MemberCard
                  key={u.id}
                  u={u}
                  tab={tab}
                  sig={sig}
                  botRec={botRec}
                  onOpen={() => openDossier(u)}
                />
              );
            })}
          </div>
          <Pager pg={pg} setPg={setPg} total={rows.length} />
        </>
      )}

      {/* Dossier */}
      <ActionSheet
        open={!!dossier}
        onClose={() => setDossier(null)}
        size="lg"
        title={dossier?.name || dossier?.email?.split('@')[0]}
        subtitle={dossier?.email}
        footer={
          dossier ? (
            <div className="flex gap-2.5">
              <button
                onClick={() => dossierGrant(grantDays, dossier, () => load())}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" /> Grant 30 Days
              </button>
              <button
                onClick={() => dossierGrant(grantDays, dossier, () => load(), 3)}
                className="flex h-11 items-center gap-1.5 rounded-full border border-akg-green/40 px-5 text-sm font-bold text-akg-green hover:bg-akg-green/10"
                title="Free 3-day win-back grant"
              >
                <Gift className="h-3.5 w-3.5" /> Win-back +3d
              </button>
              <button
                onClick={() => setEditing(dossier)}
                className="flex h-11 items-center gap-1.5 rounded-full border border-white/15 px-5 text-sm font-semibold text-akg-silver hover:bg-white/5"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Access
              </button>
            </div>
          ) : null
        }
      >
        {dossier && <DossierBody dossier={dossier} onClose={() => setDossier(null)} setEditing={setEditing} usersStore={{ payments, bots, botsOf, sigOf }} />}
      </ActionSheet>

      {/* Edit access */}
      <EditAccessSheet
        user={editing}
        onClose={() => setEditing(null)}
        onSave={async (payload) => {
          const u = editing;
          setEditing(null);
          if (u) { await saveUserAccess(u, payload); load(); }
        }}
      />
    </div>
  );
}

async function dossierGrant(grantDays, u, reload, days = 30) {
  await grantDays(u, days);
  reload?.();
}

/* ------------------------------- member card ------------------------------ */
function MemberCard({ u, tab, sig, botRec, onOpen }) {
  const days = cycleDaysLeft(u);
  return (
    <button
      onClick={onOpen}
      className="group rounded-2xl border border-white/10 bg-akg-surface p-4 text-left transition-all hover:border-[#F3C653]/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">{u.name || u.email.split('@')[0]}</div>
          <div className="truncate font-data text-[11px] text-akg-muted">{u.email}</div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-akg-muted transition-transform group-hover:translate-x-0.5" />
      </div>

      {tab === 'signal' && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-akg-silver">{PLAN_LABELS[u.plan] || 'Granted manually'}</span>
            <ExpiryBadge days={days} />
          </div>
          <div className="flex items-center justify-between font-data text-[10px] text-akg-muted">
            <span>
              {sig ? `SR ×${sig.SR_SIGNAL_BOX} · VIP ×${sig.PERFECT_SIGNAL_BOX}` : 'no purchases on file'}
            </span>
            {sig ? <span className="text-white">${sig.spend} total</span> : null}
          </div>
        </div>
      )}

      {tab === 'bot' && (
        <div className="mt-3 space-y-2">
          {botRec?.licenses.length ? (
            <div className="flex flex-wrap gap-1.5">
              {botRec.licenses.slice(0, 2).map((l) => (
                <span key={l.id} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-data text-[10px] text-akg-silver">
                  {l.name} · {l.platform} #{l.acct}
                </span>
              ))}
              {botRec.licenses.length > 2 && (
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-data text-[10px] text-akg-muted">+{botRec.licenses.length - 2} more</span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-amber-300">awaiting desk verification</span>
          )}
          <div className="flex items-center justify-between font-data text-[10px] text-akg-muted">
            <span>{botRec.licenses.length} license{botRec.licenses.length === 1 ? '' : 's'}{botRec.pending ? ` · ${botRec.pending} pending` : ''}</span>
            {botRec.spend ? <span className="text-white">${botRec.spend} total</span> : null}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-akg-silver">{PLAN_LABELS[u.plan] || u.plan || 'No plan'}</span>
          <ExpiryBadge days={days} />
        </div>
      )}
    </button>
  );
}

function Pager({ pg, setPg, total }) {
  if (total <= PAGE_SIZE) return null;
  const pages = Math.ceil(total / PAGE_SIZE);
  return (
    <div className="flex items-center justify-center gap-3 pt-1 text-xs text-akg-muted">
      <button
        disabled={pg <= 1}
        onClick={() => setPg(pg - 1)}
        className="rounded-full border border-white/10 px-3 py-1.5 font-semibold text-akg-silver disabled:opacity-30"
      >Prev</button>
      <span className="font-data">{pg}/{pages} · {total} traders</span>
      <button
        disabled={pg >= pages}
        onClick={() => setPg(pg + 1)}
        className="rounded-full border border-white/10 px-3 py-1.5 font-semibold text-akg-silver disabled:opacity-30"
      >Next</button>
    </div>
  );
}

/* -------------------------------- dossier -------------------------------- */
function DossierBody({ dossier, setEditing, usersStore }) {
  const { payments, bots, botsOf, sigOf } = usersStore;
  const email = keyOf(dossier.email);
  const history = payments.filter((p) => keyOf(p.user_email) === email);
  const botRec = botsOf.get(email);
  const botMap = useMemo(() => Object.fromEntries(bots.map((b) => [b.name, b])), [bots]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0A0D13] px-4 py-3">
        <span className="text-xs text-akg-muted">Current plan</span>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-white">{PLAN_LABELS[dossier.plan] || dossier.plan || 'None'}</span>
          <ExpiryBadge days={cycleDaysLeft(dossier)} />
        </div>
      </div>

      {botRec?.licenses.length > 0 && (
        <div>
          <h3 className="mb-2.5 flex items-center gap-2 font-data text-[10px] uppercase tracking-wider text-akg-muted">
            <Key className="h-3.5 w-3.5" /> EA licenses ({botRec.licenses.length})
          </h3>
          <div className="space-y-2">
            {botRec.licenses.map((l) => (
              <LicenseRow key={l.id} lic={l} bot={botMap[l.name]} />
            ))}
          </div>
        </div>
      )}

      {botRec?.pending > 0 && (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-200">
          {botRec.pending} bot payment{botRec.pending > 1 ? 's' : ''} awaiting desk verification — approve from the Money Queue to issue the license key.
        </p>
      )}

      <div>
        <h3 className="mb-2.5 flex items-center gap-2 font-data text-[10px] uppercase tracking-wider text-akg-muted">
          <Receipt className="h-3.5 w-3.5" /> Payment history ({history.length})
        </h3>
        {history.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] bg-[#0A0D13] px-4 py-5 text-center text-xs text-akg-muted">
            No payments from this trader yet.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#0A0D13] px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-white">
                    {String(p.plan || '').startsWith('BOT:')
                      ? p.plan.replace('BOT:', 'EA:').trim()
                      : PLAN_LABELS[p.plan] || p.plan}
                  </div>
                  <div className="font-data text-[10px] text-akg-muted">
                    {fmtDateTime(p.created)} · {p.network}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-data text-xs font-bold text-white">${p.amount}</span>
                  <StatusPill status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LicenseRow({ lic, bot }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0A0D13] px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-bold text-white">{lic.name || 'EA'}</span>
        <span className="shrink-0 font-data text-[10px] text-akg-muted">{lic.platform} · #{lic.acct}</span>
      </div>
      <div className="mt-1 font-data text-[10px] text-akg-muted">
        issued {fmtDate(new Date(lic.ts).toISOString())}
        {bot ? ` · ${bot.version || ''}` : ''}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
        <span className="truncate font-data text-[11px] font-bold tracking-wide text-akg-gold">{lic.key || 'pending'}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(lic.key);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="shrink-0 rounded p-1 text-akg-muted transition-colors hover:text-white"
          title="Copy license key"
        >
          {copied ? <Check className="h-3 w-3 text-akg-green" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      {bot?.download_url && (
        <a
          href={bot.download_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-[10px] font-semibold text-sky-300 hover:underline"
        >
          Drive package ↗
        </a>
      )}
    </div>
  );
}

function ExpiryBadge({ days }) {
  if (days === null) return <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-data text-[10px] text-akg-muted">no cycle</span>;
  if (days === -1) return <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-data text-[10px] font-bold text-rose-300">expired</span>;
  if (days <= 3) return <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-data text-[10px] font-bold text-amber-300">{days}d left</span>;
  return <span className="rounded-full bg-akg-green/15 px-2 py-0.5 font-data text-[10px] font-bold text-akg-green">{days}d left</span>;
}

function EditAccessSheet({ user, onClose, onSave }) {
  const [plan, setPlan] = useState('NONE');
  const [role, setRole] = useState('user');
  const [expiryLocal, setExpiryLocal] = useState('');

  React.useEffect(() => {
    if (!user) return;
    setPlan(user.plan || 'NONE');
    setRole(user.role || 'user');
    const raw = user.cycle_expires_at;
    if (raw) {
      const d = new Date(String(raw).replace(' ', 'T'));
      if (!Number.isNaN(d.getTime()) && d.getTime() > 0) {
        const pad = (n) => String(n).padStart(2, '0');
        setExpiryLocal(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      }
    } else {
      setExpiryLocal('');
    }
  }, [user]);

  if (!user) return null;

  return (
    <ActionSheet
      open={!!user}
      onClose={onClose}
      title="Edit access"
      subtitle={user.email}
      footer={
        <button
          onClick={() => {
            const iso = expiryLocal
              ? new Date(expiryLocal).toISOString()
              : '0001-01-01 00:00:00.000Z';
            onSave({ plan, role, cycle_expires_at: iso });
          }}
          className="h-11 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] active:scale-[0.98]"
        >
          Save Access
        </button>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Subscription plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputCls}>
            <option value="NONE">No plan (free)</option>
            <option value="SR_SIGNAL_BOX">SR Signal Box ($10 / 30d)</option>
            <option value="PERFECT_SIGNAL_BOX">Perfect Signal Box ($20 / 30d)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Account role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
            <option value="user">User</option>
            <option value="admin">Administrator</option>
          </select>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-akg-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-akg-gold" />
            Admins can approve payments and manage everything.
          </p>
        </div>
        <div>
          <label className={labelCls}>Cycle expiration</label>
          <input
            type="datetime-local"
            value={expiryLocal}
            onChange={(e) => setExpiryLocal(e.target.value)}
            className={cn(inputCls, 'font-data')}
          />
          <p className="mt-1.5 text-[11px] text-akg-muted">
            Leave in the past (or clear) to expire; future date keeps access active until then.
          </p>
        </div>
      </div>
    </ActionSheet>
  );
}

/* ------------------------------ CSV exports ------------------------------- */
function exportCsv(ctx) {
  const { rows, sigOf, botsOf, stateOf } = ctx;
  let cols, out;
  if (ctx.tab === 'signal') {
    cols = ['email', 'name', 'plan', 'cycle_expires_at', 'sr_buys', 'vip_buys', 'spend'];
    out = rows.map((u) => {
      const s = sigOf.get(keyOf(u.email)) || {};
      return [u.email, u.name || '', u.plan || '', u.cycle_expires_at || '', s.SR_SIGNAL_BOX || 0, s.PERFECT_SIGNAL_BOX || 0, s.spend || 0];
    });
  } else if (ctx.tab === 'bot') {
    cols = ['email', 'name', 'licenses', 'accounts', 'spend', 'pending'];
    out = rows.map((u) => {
      const r = botsOf.get(keyOf(u.email)) || { licenses: [], spend: 0, pending: 0 };
      return [
        u.email, u.name || '',
        r.licenses.length,
        r.licenses.map((l) => `${l.name} ${l.platform}#${l.acct}`).join(' | '),
        r.spend, r.pending,
      ];
    });
  } else {
    cols = ['created', 'email', 'name', 'plan', 'cycle_expires_at'];
    out = rows.map((u) => [u.created, u.email, u.name || '', u.plan || '', u.cycle_expires_at || '']);
  }
  const csv = [cols.join(',')].concat(
    out.map((row) => cols.map((_, i) => {
      const v = String(row[i] ?? '').replace(/"/g, '""');
      return /[",\n]/.test(v) ? `"${v}"` : v;
    }).join(','))
  );
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `akg_${ctx.tab}_base_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
