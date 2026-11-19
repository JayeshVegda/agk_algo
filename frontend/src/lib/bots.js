/* bots helpers: the DB stores pairs/features/gallery as json arrays and the
   performance fields as numbers - normalize once, use everywhere. */

export const pairsOf = (bot) => {
  const p = bot?.pairs;
  if (Array.isArray(p)) return p.filter(Boolean);
  return String(p || '').split(/[\n,]/).map((t) => t.trim()).filter(Boolean);
};

export const featuresOf = (bot) => {
  const f = bot?.features;
  if (Array.isArray(f)) return f.filter(Boolean);
  return String(f || '').split(/[\n,]/).map((t) => t.trim()).filter(Boolean);
};

export const timeframesOf = (bot) => {
  const t = bot?.timeframes;
  if (Array.isArray(t)) return t.filter(Boolean);
  return String(t || '').split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
};

/* performance numbers come as 77.4 / 2.45 / 9.2 now; render with the right suffix */
export const pctStat = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? '' : `${v}%`);

export const numStat = (v) => {
  if (v == null || v === '') return '';
  const n = parseFloat(v);
  return Number.isFinite(n) ? String(n) : '';
};

export const statNumOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace('%', ''));
  return Number.isFinite(n) ? n : null;
};

export function performanceReport(bot) {
  const type = bot.performance_type === 'backtest' ? 'Backtest' : bot.performance_type === 'live' ? 'Live account' : null;
  const start = bot.performance_start;
  const end = bot.performance_end;
  const isDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!type || !isDate(start) || !isDate(end) || start > end) return null;
  try {
    const source = new URL(bot.performance_source);
    if (source.protocol === 'https:' || source.protocol === 'http:') return { type, start, end, source: source.href };
  } catch {
    // A report without a usable link is incomplete.
  }
  return null;
}


export function matchesBotPurchase(plan, botName) {
  const prefix = `BOT: ${botName}`;
  return plan === prefix || Boolean(plan?.startsWith(prefix + ' ('));
}
