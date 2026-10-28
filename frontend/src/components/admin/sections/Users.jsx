import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot as BotIcon, Activity, Plus, Pencil, Receipt, Download, Gift, Copy, Check, Key, Users as UsersIcon } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { SectionHeader, EmptyState, StatusPill, labelCls, inputCls } from '../components/ui';
import { StatusDot } from '../components/StatusDot';
import { Toolbar } from '../components/Toolbar';
import DataTable from '../components/DataTable';
import Drawer from '../components/Drawer';
import { ActionSheet } from '../components/ActionSheet';
import { useUrlQuery, replaceParams } from '../lib/urlState';
import { cycleDaysLeft, fmtDateTime, fmtDate } from '../lib/format';
import { cn } from '../../../lib/utils';

const PLAN_LABELS = {
  PERFECT_SIGNAL_BOX: 'Perfect Box',
  SR_SIGNAL_BOX: 'SR Box',
  NONE: 'No plan',
};
const SIG_PLANS = Object.keys(PLAN_LABELS).filter((p) => p !== 'NONE');
const PAGE_SIZE = 15;
const TAB_DEFS = [
  { id: 'members', label: 'All Members', icon: UsersIcon },
  { id: 'signal', label: 'Signal Base', icon: Activity },
  { id: 'bot', label: 'Bot Base', icon: BotIcon },
];
const BOT_RE = /^BOT:\s*(.+?)\s*\(([^#)]+)#([^)]+)\)/i;

const keyOf = (email) => String(email || '').trim().toLowerCase();

export default function Users() {
  const { grantDays, saveUserAccess } = useAdmin();
  const query = useUrlQuery();

  const tab = TAB_DEFS.some((t) => t.id === query.tab) ? query.tab : 'members';
  const sub = query.sub || 'all';
  const search = query.q || '';
  const botFilter = query.f || '';
  const urlPage = Math.max(1, Number(query.page) || 1);
  const sortCol = query.sort || (tab === 'bot' ? 'name' : 'days');
  const sortDir = query.dir === 'desc' || query.dir === 'asc' ? query.dir : (sortCol === 'days' || sortCol === 'name' ? 'asc' : 'desc');

  const [cursor, setCursor] = useState(0);

  // Traders data is small (tens, not thousands): load whole tables once and
  // derive every base server-independently. Admin rules already gate this read.
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

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

  const statusWord = useCallback((u) => {
    const s = stateOf(u);
    if (s.active) return s.expiring ? 'expiring' : 'active';
    if (s.lapsed) return 'lapsed';
    return 'free';
  }, [stateOf]);

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

  // Sorting happens in the section (URL-backed); the table renders the slice.
  const sorted = useMemo(() => {
    const val = {
      name: (u) => (u.name || u.email || '').toLowerCase(),
      days: (u) => { const d = cycleDaysLeft(u); return d === null ? 99999 : d; },
      spend: (u) => (sigOf.get(keyOf(u.email))?.spend || 0) + (botsOf.get(keyOf(u.email))?.spend || 0),
      joined: (u) => new Date(String(u.created).replace(' ', 'T')).getTime() || 0,
      systems: (u) => botsOf.get(keyOf(u.email))?.licenses.length || 0,
    }[sortCol] || ((u) => 0);
    const arr = [...rows].sort((a, b) => {
      const x = val(a); const y = val(b);
      return x < y ? -1 : x > y ? 1 : 0;
    });
    return sortDir === 'desc' ? arr.reverse() : arr;
  }, [rows, sortCol, sortDir, sigOf, botsOf]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(urlPage, pageCount);
  const visible = useMemo(() => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [sorted, safePage]);
  useEffect(() => { setCursor((c) => Math.min(c, Math.max(0, visible.length - 1))); }, [visible.length]);

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

  /* ------------------------- keyboard: J/K + Enter ------------------------ */
  const onKeyDown = useCallback((e) => {
    const t = e.target;
    if (t?.closest?.('input,textarea,select') || t?.isContentEditable) return;
    if (document.querySelector('[role="dialog"],[role="alertdialog"]')) return;
    const k = e.key.toLowerCase();
    if (k !== 'j' && k !== 'k' && e.key !== 'Enter') return;
    const row = visible[cursor];
    if (!row) return;
    if (k === 'j') { e.preventDefault(); setCursor((c) => Math.min(visible.length - 1, c + 1)); }
    else if (k === 'k') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      replaceParams({ id: query.id === row.id ? '' : row.id });
    }
  }, [visible, cursor, query.id]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  /* ------------------------------- dossier -------------------------------- */
  const dossierUser = query.id ? users.find((u) => u.id === query.id) || null : null;

  /* ------------------------------- columns ------------------------------- */
  const columns = useMemo(() => {
    const cols = [
      {
        key: 'trader',
        label: 'Trader',
        sortKey: 'name',
        head: 'w-[230px]',
        cell: (u) => (
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-white">{u.name || (u.email || '').split('@')[0]}</div>
            <div className="truncate font-data text-[10px] text-akg-muted">{u.email}</div>
          </div>
        ),
      },
    ];
    if (tab === 'members' || tab === 'signal') {
      cols.push({
        key: 'plan',
        label: 'Plan',
        cell: (u) => {
          const sig = sigOf.get(keyOf(u.email));
          const buys = sig ? `SR ×${sig.SR_SIGNAL_BOX} · VIP ×${sig.PERFECT_SIGNAL_BOX}` : sigOf.has(keyOf(u.email)) ? '' : 'no purchases';
          return (
            <div className="min-w-0">
              <div className="whitespace-nowrap text-[11px] font-semibold text-akg-silver">{PLAN_LABELS[u.plan] || u.plan || 'None'}</div>
              {tab === 'signal' && buys && <div className="font-data text-[10px] text-akg-muted">{buys}</div>}
            </div>
          );
        },
      });
    }
    if (tab === 'bot') {
      cols.push({
        key: 'systems',
        label: 'Systems',
        sortKey: 'systems',
        cell: (u) => {
          const r = botsOf.get(keyOf(u.email));
          if (!r) return <span className="text-[11px] text-akg-muted">—</span>;
          return (
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              {r.licenses.slice(0, 2).map((l) => (
                <span key={l.id} className="rounded bg-white/[0.06] px-1.5 py-px font-data text-[9px] text-akg-silver">{l.name}</span>
              ))}
              {r.licenses.length > 2 && <span className="font-data text-[9px] text-akg-muted">+{r.licenses.length - 2}</span>}
              {!r.licenses.length && <span className="text-[10px] text-amber-300">awaiting desk</span>}
            </div>
          );
        },
      });
    }
    if (tab !== 'bot') {
      cols.push({
        key: 'days',
        label: 'Days left',
        sortKey: 'days',
        head: 'w-[110px]',
        cell: (u) => <ExpiryBadge days={cycleDaysLeft(u)} />,
      });
    }
    cols.push(
      {
        key: 'spend',
        label: 'Spend',
        sortKey: 'spend',
        align: 'right',
        head: 'w-[90px]',
        cell: (u) => {
          const total = (sigOf.get(keyOf(u.email))?.spend || 0) + (botsOf.get(keyOf(u.email))?.spend || 0);
          return <span className="whitespace-nowrap font-data text-xs font-bold tabular-nums text-white">{total ? `$${total}` : '—'}</span>;
        },
      },
      {
        key: 'joined',
        label: 'Joined',
        sortKey: 'joined',
        head: 'w-[110px]',
        cell: (u) => <span className="whitespace-nowrap font-data text-[10px] text-akg-muted">{fmtDate(u.created)}</span>,
      },
      {
        key: 'status',
        label: '',
        align: 'right',
        cell: (u) => <StatusDot status={statusWord(u)} pulse={false} />,
      },
    );
    return cols;
  }, [tab, sigOf, botsOf, statusWord]);

  const sortToggle = (col) => {
    if (sortCol === col) replaceParams({ dir: sortDir === 'desc' ? 'asc' : 'desc' });
    else replaceParams({ sort: col, dir: col === 'spend' || col === 'joined' ? 'desc' : 'asc', page: '' });
  };

  return (
    <div className="space-y-4 pb-10">
      <SectionHeader
        title="Traders & Access"
        sub={loading && !users.length ? 'Loading members…' : `${users.length} traders · ${users.filter((u) => stateOf(u).active).length} active · ${users.filter((u) => stateOf(u).expiring).length} expiring ≤3d`}
        actions={
          <button
            onClick={() => exportCsv({ tab, rows: sorted, sigOf, botsOf })}
            className="flex h-9 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold text-akg-silver transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
      />

      <Toolbar
        tabs={TAB_DEFS.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={tab}
        onTab={(id) => replaceParams({ tab: id === 'members' ? '' : id, sub: '', f: '', page: '', id: '', sort: '', dir: '' })}
        chips={SUBS}
        chipValue={sub}
        onChip={(v) => { replaceParams({ sub: v === 'all' ? '' : v, page: '', id: '' }); setCursor(0); }}
        search={search}
        onSearch={(v) => replaceParams({ q: v, page: '', id: '' })}
        searchPlaceholder="Email or name…"
        actions={tab === 'bot' && (
          <select
            id="akg-admin-bot-filter"
            name="botFilter"
            value={botFilter}
            onChange={(e) => { replaceParams({ f: e.target.value, page: '', id: '' }); setCursor(0); }}
            className="h-9 rounded-full border border-white/10 bg-[#0A0D13] px-3 text-xs font-semibold text-akg-silver focus:border-[#F3C653]/50 focus:outline-none"
          >
            <option value="">All systems</option>
            {botNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      />

      <DataTable
        name="traders"
        columns={columns}
        rows={visible}
        sort={[sortCol, sortDir]}
        onSort={sortToggle}
        cursor={cursor}
        onCursor={setCursor}
        onRowClick={(u) => replaceParams({ id: query.id === u.id ? '' : u.id })}
        page={safePage}
        onPage={(np) => { replaceParams({ page: np > 1 ? np : '' }); setCursor(0); }}
        pageSize={PAGE_SIZE}
        total={sorted.length}
        empty={(
          <EmptyState
            icon={tab === 'bot' ? BotIcon : tab === 'signal' ? Activity : UsersIcon}
            title="No traders match"
            hint="Adjust the filters or search."
          />
        )}
        mobileCard={(u) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">{u.name || (u.email || '').split('@')[0]}</div>
              <div className="mt-0.5 flex items-center gap-2 font-data text-[10px] text-akg-muted">
                <span className="text-akg-silver">{PLAN_LABELS[u.plan] || u.plan || 'No plan'}</span>
                {tab === 'bot' && botsOf.get(keyOf(u.email))
                  ? <span>· {botsOf.get(keyOf(u.email)).licenses.length} lic</span>
                  : sigOf.get(keyOf(u.email)) ? <span>· ${sigOf.get(keyOf(u.email)).spend}</span> : null}
              </div>
              <div className="truncate font-data text-[10px] text-akg-muted">{u.email}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {tab !== 'bot' && <ExpiryBadge days={cycleDaysLeft(u)} />}
              <StatusDot status={statusWord(u)} pulse={false} />
            </div>
          </div>
        )}
        className={cn(loading && users.length && 'opacity-70')}
      />

      {/* Dossier drawer (?id= deep-link) */}
      {dossierUser && (
        <Drawer
          open
          onClose={() => replaceParams({ id: '' })}
          title={dossierUser.name || (dossierUser.email || '').split('@')[0]}
          subtitle={dossierUser.email}
          footer={
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => { await grantDays(dossierUser, 30); load(); }}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(120deg,#E8BC4F,#F3C653,#DFAE3E)] text-sm font-bold text-[#1C1403] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" /> Grant 30 Days
              </button>
              <button
                onClick={async () => { await grantDays(dossierUser, 3); load(); }}
                className="flex h-10 items-center gap-1.5 rounded-full border border-akg-green/40 px-4 text-xs font-bold text-akg-green hover:bg-akg-green/10"
                title="Free 3-day win-back grant"
              >
                <Gift className="h-3.5 w-3.5" /> +3d
              </button>
              <button
                onClick={() => setEditing(dossierUser)}
                className="flex h-10 items-center gap-1.5 rounded-full border border-white/15 px-4 text-xs font-semibold text-akg-silver hover:bg-white/5"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Access
              </button>
            </div>
          }
        >
          <TraderDossier user={dossierUser} payments={payments} bots={bots} botsOf={botsOf} sigOf={sigOf} />
        </Drawer>
      )}

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

/* -------------------------------- dossier -------------------------------- */
function TraderDossier({ user, payments, bots, botsOf, sigOf }) {
  const email = keyOf(user.email);
  const history = payments.filter((p) => keyOf(p.user_email) === email);
  const botRec = botsOf.get(email);
  const sig = sigOf.get(email);
  const botMap = useMemo(() => Object.fromEntries(bots.map((b) => [b.name, b])), [bots]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0A0D13] px-4 py-3">
        <span className="text-xs text-akg-muted">Current access</span>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-white">
            {PLAN_LABELS[user.plan] || user.plan || 'None'}
            {sig ? <span className="ml-2 font-data text-[10px] font-normal text-akg-muted">${sig.spend} lifetime</span> : null}
          </span>
          <ExpiryBadge days={cycleDaysLeft(user)} />
        </div>
      </div>

      {botRec?.licenses.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-data text-[10px] uppercase tracking-wider text-akg-muted">
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
        <h3 className="mb-2 flex items-center gap-2 font-data text-[10px] uppercase tracking-wider text-akg-muted">
          <Receipt className="h-3.5 w-3.5" /> Payment history ({history.length})
        </h3>
        {history.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] bg-[#0A0D13] px-4 py-5 text-center text-xs text-akg-muted">
            No payments from this trader yet.
          </p>
        ) : (
          <div className="divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.07] bg-[#0A0D13]">
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-white">
                    {String(p.plan || '').startsWith('BOT:')
                      ? p.plan.replace('BOT:', 'EA:').trim()
                      : PLAN_LABELS[p.plan] || p.plan}
                  </div>
                  <div className="font-data text-[10px] text-akg-muted">
                    {fmtDateTime(p.created)} · {p.method === 'upi' ? 'UPI' : p.network}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-data text-xs font-bold text-white">${p.amount}</span>
                  <StatusDot status={p.status} pulse={false} />
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
          <label className={labelCls} htmlFor="akg-admin-edit-plan">Subscription plan</label>
          <select id="akg-admin-edit-plan" value={plan} onChange={(e) => setPlan(e.target.value)} className={inputCls}>
            <option value="NONE">No plan (free)</option>
            <option value="SR_SIGNAL_BOX">SR Signal Box ($10 / 30d)</option>
            <option value="PERFECT_SIGNAL_BOX">Perfect Signal Box ($20 / 30d)</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="akg-admin-edit-role">Account role</label>
          <select id="akg-admin-edit-role" value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
            <option value="user">User</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="akg-admin-edit-expiry">Cycle expiration</label>
          <input
            id="akg-admin-edit-expiry"
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
  const { rows, sigOf, botsOf } = ctx;
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
