/* bots helpers: the DB stores pairs/features/gallery as json arrays and the
   performance fields as numbers — normalize once, use everywhere. */

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
