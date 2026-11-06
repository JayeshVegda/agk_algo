import React, { useMemo, useRef, useState } from 'react';
import { Cpu, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { SectionHeader, FilterChips, SearchInput, EmptyState, labelCls, inputCls, textareaCls } from '../components/ui';
import { ActionSheet, ConfirmSheet } from '../components/ActionSheet';
import { useUrlQuery, replaceParams } from '../lib/urlState';
import { cn } from '../../../lib/utils';

/** Downscale an uploaded image to a compact web-ready data URL (max ~640px). */
export function downscaleImage(file, maxSide = 640) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const listText = (v) => (Array.isArray(v) ? v.join(', ') : String(v || ''));

const EMPTY_BOT = {
  name: '',
  platform: 'MT5',
  price: '',
  version: 'v1.0',
  pairs: '',
  description: '',
  download_url: '',
  is_live: true,
  // Stats (optional)
  win_rate: '',
  drawdown: '',
  profit_factor: '',
  image_url: '',
  // Advanced (optional)
  strategy_type: '',
  trading_style: '',
  timeframes: '',
  min_lot: '',
  leverage: '',
  recommended_deposit: '',
  broker_note: '',
  features: '',
};

export default function Bots() {
  const { bots, saveBot, deleteBot } = useAdmin();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null closed, {} new, {...bot} edit
  const [deleting, setDeleting] = useState(null);

  // Deep-link edit: /admin?s=bots&edit=<id>
  const deepEdit = useUrlQuery('edit');
  React.useEffect(() => {
    if (!deepEdit || bots.length === 0) return;
    const found = bots.find((b) => b.id === deepEdit);
    if (found) setEditing(found);
  }, [deepEdit, bots]);

  const closeEditor = () => {
    setEditing(null);
    if (deepEdit) replaceParams({ edit: '' });
  };

  const counts = useMemo(
    () => ({
      all: bots.length,
      live: bots.filter((b) => b.is_live !== false).length,
      draft: bots.filter((b) => b.is_live === false).length,
      MT4: bots.filter((b) => (b.platform || '').includes('MT4')).length,
      MT5: bots.filter((b) => (b.platform || '').includes('MT5')).length,
    }),
    [bots]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bots
      .filter((b) => {
        if (filter === 'all') return true;
        if (filter === 'live') return b.is_live !== false;
        if (filter === 'draft') return b.is_live === false;
        return (b.platform || '').includes(filter);
      })
      .filter((b) => !q || (b.name || '').toLowerCase().includes(q) || listText(b.pairs).toLowerCase().includes(q));
  }, [bots, filter, search]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Expert Advisors"
        sub={`${counts.live} live · ${counts.draft} draft. Licenses and binaries are handled automatically on first run.`}
        actions={
          <button
            onClick={() => setEditing({ ...EMPTY_BOT })}
            className="flex h-10 items-center gap-2 rounded-lg bg-akg-cta px-4 text-sm font-bold text-akg-cta-text active:scale-[0.98] hover:opacity-90 shadow-sm transition-opacity cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Bot
          </button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'live', label: 'Live', count: counts.live },
            { id: 'draft', label: 'Draft', count: counts.draft },
            { id: 'MT4', label: 'MT4', count: counts.MT4 },
            { id: 'MT5', label: 'MT5', count: counts.MT5 },
          ]}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Name or pairs..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Cpu} title="No bots match" hint="Add your first Expert Advisor with the button above." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-akg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] font-data text-[10px] uppercase tracking-wider text-slate-700 dark:text-akg-muted">
                <tr>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Platform</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/[0.05]">
                {filtered.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{b.name}</div>
                      <div className="mt-0.5 font-data text-[10px] text-akg-muted">
                        {b.version || 'v1.0'} · {listText(b.pairs) || 'All pairs'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2 py-0.5 font-data text-[10px] font-semibold text-slate-800 dark:text-akg-silver">
                        {b.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm font-bold text-emerald-600 dark:text-akg-accent">${b.price}</span>
                      <span className="ml-1 text-[10px] text-akg-muted">USDT</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-data text-[10px] font-bold',
                          b.is_live !== false
                            ? 'border-emerald-200 dark:border-akg-green/30 bg-emerald-50 dark:bg-akg-green/15 text-emerald-800 dark:text-akg-green'
                            : 'border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-akg-muted'
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', b.is_live !== false ? 'bg-emerald-600 dark:bg-akg-green' : 'bg-slate-400 dark:bg-akg-muted')} />
                        {b.is_live !== false ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditing(b)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-akg-muted hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(b)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-akg-muted hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BotEditor
        bot={editing}
        onClose={closeEditor}
        onSave={async (payload) => {
          const b = editing;
          setEditing(null);
          if (deepEdit) replaceParams({ edit: '' });
          if (b) await saveBot(payload, b.id);
        }}
      />

      <ConfirmSheet
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await deleteBot(deleting);
        }}
        title="Delete bot?"
        message={deleting ? `${deleting.name} will disappear from the catalog. Existing licenses stay valid.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function BotEditor({ bot, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_BOT);
  const [busy, setBusy] = useState(false);
  const [openStats, setOpenStats] = useState(false);
  const [openAdvanced, setOpenAdvanced] = useState(false);
  const fileRef = useRef(null);

  React.useEffect(() => {
    if (bot) {
      const joinList = (v) => (Array.isArray(v) ? v.join(', ') : v || '');
      setForm({
        ...EMPTY_BOT,
        ...Object.fromEntries(Object.entries(bot).map(([k, v]) => [k, v ?? ''])),
        version: bot.version || 'v1.0',
        is_live: bot.is_live !== false,
        pairs: joinList(bot.pairs),
        features: joinList(bot.features),
        timeframes: joinList(bot.timeframes),
        win_rate: bot.win_rate ?? '',
        drawdown: bot.drawdown ?? '',
        profit_factor: bot.profit_factor ?? '',
        min_lot: bot.min_lot ?? '',
        leverage: bot.leverage || '',
        trading_style: bot.trading_style || '',
        broker_note: bot.broker_note || '',
      });
      // Expand sections if existing bot already has data in them
      if (bot.win_rate || bot.profit_factor || bot.drawdown || bot.image_url) {
        setOpenStats(true);
      }
      if (bot.strategy_type || bot.trading_style || bot.min_lot || bot.leverage || bot.broker_note) {
        setOpenAdvanced(true);
      }
    }
  }, [bot]);

  if (!bot) return null;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = form.name.trim() && form.price;

  return (
    <ActionSheet
      open={!!bot}
      onClose={onClose}
      size="lg"
      title={bot.id ? 'Edit bot' : 'Add bot'}
      subtitle="5 core fields always visible. Stats and advanced specifications are optional."
      footer={
        <button
          onClick={async () => {
            setBusy(true);
            const numOrNull = (v) => {
              const n = parseFloat(String(v).replace('%', '').trim());
              return Number.isFinite(n) ? n : null;
            };
            const list = (v, upper = false) =>
              String(v || '')
                .split(/[\n,]/)
                .map((t) => t.trim())
                .filter(Boolean)
                .map((t) => (upper ? t.toUpperCase() : t));
            const payload = {
              ...form,
              price: Number(form.price),
              version: form.version || 'v1.0',
              is_live: !!form.is_live,
              win_rate: numOrNull(form.win_rate),
              drawdown: numOrNull(form.drawdown),
              profit_factor: numOrNull(form.profit_factor),
              min_lot: form.min_lot === '' ? null : Number(form.min_lot),
              pairs: list(form.pairs, true),
              features: list(form.features),
              timeframes: list(form.timeframes),
            };
            delete payload.id;
            delete payload.created;
            delete payload.updated;
            delete payload.collectionId;
            delete payload.collectionName;
            await onSave(payload);
            setBusy(false);
          }}
          disabled={!valid || busy}
          className="h-11 w-full rounded-lg bg-akg-cta text-sm font-bold text-akg-cta-text disabled:opacity-40 hover:opacity-90 shadow-sm transition-opacity cursor-pointer"
        >
          {busy ? 'Saving...' : 'Save Bot'}
        </button>
      }
    >
      <div className="space-y-4">
        {/* Core Field 1: Name & Platform */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Name *</label>
            <input value={form.name} onChange={set('name')} className={inputCls} placeholder="AKG Gold Trap EA" />
          </div>
          <div>
            <label className={labelCls}>Platform *</label>
            <select value={form.platform} onChange={set('platform')} className={inputCls}>
              <option>MT4</option>
              <option>MT5</option>
              <option>MT4/MT5</option>
            </select>
          </div>
        </div>

        {/* Core Field 2: Price, Version, Live/Draft Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Price USDT *</label>
            <input value={form.price} onChange={set('price')} type="number" className={cn(inputCls, 'font-data')} placeholder="299" />
          </div>
          <div>
            <label className={labelCls}>Version</label>
            <input value={form.version} onChange={set('version')} className={cn(inputCls, 'font-data')} placeholder="v1.0" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, is_live: !prev.is_live }))}
              className={cn(
                'flex h-10 w-full items-center justify-center gap-2 rounded-xl border font-data text-xs font-bold transition-colors',
                form.is_live
                  ? 'border-emerald-300 dark:border-akg-green/40 bg-emerald-50 dark:bg-akg-green/15 text-emerald-800 dark:text-akg-green'
                  : 'border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-akg-muted hover:border-slate-400 dark:hover:border-white/25'
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', form.is_live ? 'bg-emerald-600 dark:bg-akg-green' : 'bg-slate-400 dark:bg-akg-muted')} />
              {form.is_live ? 'Live' : 'Draft'}
            </button>
          </div>
        </div>

        {/* Core Field 3: Traded Pairs */}
        <div>
          <label className={labelCls}>Traded pairs *</label>
          <input
            value={form.pairs}
            onChange={(e) => setForm({ ...form, pairs: e.target.value.toUpperCase() })}
            className={cn(inputCls, 'font-data')}
            placeholder="XAUUSD, EURUSD, GBPUSD"
          />
        </div>

        {/* Core Field 4: Description (1-2 lines) */}
        <div>
          <label className={labelCls}>Description (1-2 lines) *</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={set('description')}
            className={textareaCls}
            placeholder="Institutional liquidity sweep EA with hard stop loss and dynamic trailing targets."
          />
        </div>

        {/* Core Field 5: EA Package Link */}
        <div>
          <label className={labelCls}>EA file / Google Drive link (optional)</label>
          <input
            value={form.download_url}
            onChange={set('download_url')}
            className={inputCls}
            placeholder="https://drive.google.com/..."
          />
          <p className="mt-1 text-[11px] text-akg-muted">
            Delivered in buyer notifications &amp; My Account once payment is confirmed.
          </p>
        </div>

        {/* Collapsible: Stats (optional) */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.015] overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenStats((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-data text-xs font-semibold text-slate-900 dark:text-akg-silver hover:bg-slate-100/60 dark:hover:bg-white/[0.03] cursor-pointer"
          >
            <span>Stats (optional)</span>
            {openStats ? <ChevronDown className="h-4 w-4 text-akg-muted" /> : <ChevronRight className="h-4 w-4 text-akg-muted" />}
          </button>
          {openStats && (
            <div className="space-y-3 border-t border-slate-200 dark:border-white/10 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Win rate</label>
                  <input value={form.win_rate} onChange={set('win_rate')} className={cn(inputCls, 'font-data')} placeholder="81.4%" />
                </div>
                <div>
                  <label className={labelCls}>Profit factor</label>
                  <input value={form.profit_factor} onChange={set('profit_factor')} className={cn(inputCls, 'font-data')} placeholder="2.64" />
                </div>
                <div>
                  <label className={labelCls}>Max drawdown</label>
                  <input value={form.drawdown} onChange={set('drawdown')} className={cn(inputCls, 'font-data')} placeholder="5.8%" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Backtest image</label>
                <div className="flex items-center gap-2">
                  <input
                    value={form.image_url?.startsWith('data:') ? '' : form.image_url}
                    onChange={set('image_url')}
                    className={inputCls}
                    placeholder="https://... or upload image"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 dark:border-akg-hairline px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-akg-accent hover:bg-slate-100 dark:hover:bg-akg-raised cursor-pointer"
                  >
                    <ImageIcon className="h-4 w-4" /> Upload
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      try {
                        const dataUrl = await downscaleImage(f);
                        setForm((prev) => ({ ...prev, image_url: dataUrl }));
                      } catch {}
                    }
                    e.target.value = '';
                  }}
                />
                {form.image_url && (
                  <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 max-h-36">
                    <img src={form.image_url} alt="Backtest Preview" className="w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible: Advanced (optional) */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.015] overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenAdvanced((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-data text-xs font-semibold text-slate-900 dark:text-akg-silver hover:bg-slate-100/60 dark:hover:bg-white/[0.03] cursor-pointer"
          >
            <span>Advanced (optional)</span>
            {openAdvanced ? <ChevronDown className="h-4 w-4 text-akg-muted" /> : <ChevronRight className="h-4 w-4 text-akg-muted" />}
          </button>
          {openAdvanced && (
            <div className="space-y-3 border-t border-slate-200 dark:border-white/10 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Strategy type</label>
                  <input value={form.strategy_type} onChange={set('strategy_type')} className={inputCls} placeholder="Session Liquidity Sweep" />
                </div>
                <div>
                  <label className={labelCls}>Trading style</label>
                  <input value={form.trading_style} onChange={set('trading_style')} className={inputCls} placeholder="Intraday swing" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Timeframes</label>
                  <input value={form.timeframes} onChange={set('timeframes')} className={cn(inputCls, 'font-data')} placeholder="M15, H1" />
                </div>
                <div>
                  <label className={labelCls}>Min lot</label>
                  <input value={form.min_lot} onChange={set('min_lot')} type="number" step="0.01" className={cn(inputCls, 'font-data')} placeholder="0.01" />
                </div>
                <div>
                  <label className={labelCls}>Leverage guide</label>
                  <input value={form.leverage} onChange={set('leverage')} className={cn(inputCls, 'font-data')} placeholder="1:20+" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Min capital</label>
                <input value={form.recommended_deposit} onChange={set('recommended_deposit')} className={cn(inputCls, 'font-data')} placeholder="$1,000" />
              </div>
              <div>
                <label className={labelCls}>Broker note</label>
                <textarea value={form.broker_note} onChange={set('broker_note')} className={textareaCls} placeholder="Guidance for broker spread/feed..." />
              </div>
            </div>
          )}
        </div>
      </div>
    </ActionSheet>
  );
}
