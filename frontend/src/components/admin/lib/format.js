/** Shared formatting helpers for the admin console. */

export function fmtRelative(dateStr) {
  const t = new Date(String(dateStr || '').replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(t).toLocaleDateString();
}

export function fmtWaiting(dateStr) {
  const t = new Date(String(dateStr || '').replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return '';
  const hrs = (Date.now() - t) / 3600000;
  if (hrs < 1) return `${Math.max(1, Math.round(hrs * 60))}m waiting`;
  if (hrs < 24) return `${Math.round(hrs)}h waiting`;
  return `${Math.round(hrs / 24)}d waiting`;
}

export function fmtDate(dateStr) {
  const d = new Date(String(dateStr || '').replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateTime(dateStr) {
  const d = new Date(String(dateStr || '').replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function explorerUrl(network, txid) {
  const t = String(txid || '');
  if (!t) return '';
  if (/TRC20/i.test(network)) return `https://tronscan.org/#/transaction/${t}`;
  if (/BEP20/i.test(network)) return `https://bscscan.com/tx/${t}`;
  return `https://etherscan.io/tx/${t}`;
}

export function cycleDaysLeft(user) {
  const raw = user?.cycle_expires_at;
  if (!raw) return null;
  const t = new Date(String(raw).replace(' ', 'T')).getTime();
  if (Number.isNaN(t) || t < Date.now()) return -1;
  return Math.ceil((t - Date.now()) / 86400000);
}

/** Revenue figures computed from confirmed payments. */
export function revenueStats(payments) {
  const confirmed = payments.filter((p) => p.status === 'confirmed');
  const now = Date.now();
  const inWindow = (ms) =>
    confirmed
      .filter((p) => now - new Date(String(p.created).replace(' ', 'T')).getTime() <= ms)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  return {
    total: confirmed.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    last24h: inWindow(86400000),
    last7d: inWindow(7 * 86400000),
    last30d: inWindow(30 * 86400000),
    confirmedCount: confirmed.length,
  };
}
