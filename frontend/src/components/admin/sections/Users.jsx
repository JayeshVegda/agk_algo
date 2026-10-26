import React, { useMemo, useState } from 'react';
import { Users as UsersIcon, Plus, Pencil, Receipt, ChevronRight, ShieldCheck, Download, Gift } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { usePagedList, useStats } from '../lib/pagedList';
import { SectionHeader, FilterChips, SearchInput, EmptyState, StatusPill, labelCls, inputCls } from '../components/ui';
import { ActionSheet } from '../components/ActionSheet';
import { cycleDaysLeft, fmtDateTime } from '../lib/format';
import { cn } from '../../../lib/utils';

const PLAN_LABELS = {
  PERFECT_SIGNAL_BOX: 'Perfect Signal Box',
  SR_SIGNAL_BOX: 'SR Signal Box',
  NONE: 'No plan',
};

export default function Users() {
  const { grantDays, saveUserAccess } = useAdmin();
  const { stats } = useStats();
  const [filter, setFilter] = useState('all');
  const [dossier, setDossier] = useState(null);
  const [editing, setEditing] = useState(null);
  const [userPayments, setUserPayments] = useState([]);

  // Server-computed member counts (stats endpoint).
  const counts = {
    all: stats?.users.total,
    active: stats?.users.active,
    expiring: stats?.expiring.length,
  };

  // Cycle-state filters translate into server-side date windows.
  const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 23) + 'Z';
  const in3dIso = new Date(Date.now() + 3 * 86400000).toISOString().replace('T', ' ').slice(0, 23) + 'Z';
  const filters = {
    all: "role != 'admin'",
    active: `role != 'admin' && cycle_expires_at >= {:in3d}`,
    expiring: `role != 'admin' && plan != 'NONE' && cycle_expires_at >= {:n} && cycle_expires_at < {:in3d}`,
    // lapsed: paid members whose cycle ended within the last 60 days (win-back targets)
    lapsed: `role != 'admin' && plan != 'NONE' && cycle_expires_at < {:n} && cycle_expires_at >= {:n60}`,
  };
  const n60Iso = new Date(Date.now() - 60 * 86400000).toISOString().replace('T', ' ').slice(0, 23) + 'Z';
  const params = useMemo(() => ({ n: nowIso, in3d: in3dIso, n60: n60Iso }), [nowIso, in3dIso, n60Iso]);
  const page = usePagedList('users', {
    filter: filters[filter] || filters.all,
    params,
    sort: '-created',
    searchKeys: ['email', 'name'],
    perPage: 15,
  });

  const openDossier = async (u) => {
    setDossier(u);
    setUserPayments([]);
    try {
      const recs = await pb.collection('payments').getFullList({
        filter: `user_email = "${u.email}"`, sort: '-created',
      });
      setUserPayments(recs);
    } catch { setUserPayments([]); }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Traders & Access"
        actions={
          <button
            onClick={() => exportUsersCsv(page, filter)}
            className="flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold text-akg-silver transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
        sub="Search members, extend cycles, and manage plans. Tap a trader for their full dossier."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          value={filter}
          onChange={(v) => { setFilter(v); page.setPage(1); }}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'active', label: 'Active', count: counts.active },
            { id: 'expiring', label: 'Expiring ≤3d', count: counts.expiring },
            { id: 'lapsed', label: 'Lapsed (win-back)' },
            { id: 'expired', label: 'Expired', count: counts.expired },
            { id: 'free', label: 'Free', count: counts.free },
          ]}
        />
        <SearchInput value={page.search} onChange={page.setSearch} placeholder="Email or name..." />
      </div>

      {page.items.length === 0 && !page.loading ? (
        <EmptyState icon={UsersIcon} title="No traders match" hint="Adjust the filters or search." />
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {page.items.map((u) => {
            const days = cycleDaysLeft(u);
            return (
              <button
                key={u.id}
                onClick={() => openDossier(u)}
                className="group rounded-2xl border border-white/10 bg-akg-surface p-4 text-left transition-all hover:border-[#F3C653]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{u.name || u.email.split('@')[0]}</div>
                    <div className="truncate font-data text-[11px] text-akg-muted">{u.email}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-akg-muted transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-akg-silver">
                    {PLAN_LABELS[u.plan] || u.plan || 'No plan'}
                  </span>
                  <ExpiryBadge days={days} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Dossier */}
      <ActionSheet
        open={!!dossier}
        onClose={() => setDossier(null)}
        size="lg"
        title={dossier?.name || dossier?.email?.split('@')[0]}
        subtitle={dossier?.email}
        footer={
          <div className="flex gap-2.5">
            <button
              onClick={() => dossier && grantDays(dossier, 30)}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Grant 30 Days
            </button>
            <button
              onClick={() => dossier && grantDays(dossier, 3)}
              className="flex h-11 items-center gap-1.5 rounded-full border border-akg-green/40 px-5 text-sm font-bold text-akg-green hover:bg-akg-green/10"
              title="Free 3-day win-back grant"
            >
              <Gift className="h-3.5 w-3.5" /> Win-back +3d
            </button>
            <button
              onClick={() => dossier && setEditing(dossier)}
              className="flex h-11 items-center gap-1.5 rounded-full border border-white/15 px-5 text-sm font-semibold text-akg-silver hover:bg-white/5"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Access
            </button>
          </div>
        }
      >
        {dossier && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0A0D13] px-4 py-3">
              <span className="text-xs text-akg-muted">Current plan</span>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-white">{PLAN_LABELS[dossier.plan] || dossier.plan || 'None'}</span>
                <ExpiryBadge days={cycleDaysLeft(dossier)} />
              </div>
            </div>

            <div>
              <h3 className="mb-2.5 flex items-center gap-2 font-data text-[10px] uppercase tracking-wider text-akg-muted">
                <Receipt className="h-3.5 w-3.5" /> Payment history ({userPayments.length})
              </h3>
              {userPayments.length === 0 ? (
                <p className="rounded-xl border border-white/[0.07] bg-[#0A0D13] px-4 py-5 text-center text-xs text-akg-muted">
                  No payments from this trader yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {userPayments.map((p) => (
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
        )}
      </ActionSheet>

      {/* Edit access */}
      <EditAccessSheet
        user={editing}
        onClose={() => setEditing(null)}
        onSave={async (payload) => {
          const u = editing;
          setEditing(null);
          if (u) await saveUserAccess(u, payload);
        }}
      />
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
        // datetime-local value format
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


/* ---- CSV export of the current trader view ---- */
function exportUsersCsv(page, filter) {
  const cols = ['created', 'email', 'name', 'role', 'plan', 'cycle_expires_at'];
  const rows = [cols.join(',')].concat(
    page.items.map((u) => cols.map((c) => {
      const v = String(u[c] ?? '').replace(/"/g, '""');
      return /[",\n]/.test(v) ? `"${v}"` : v;
    }).join(','))
  );
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `akg_traders_${filter}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
