import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Cpu, Plus, Pencil, Trash2, ExternalLink, Eye, Image as ImageIcon } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { SectionHeader, FilterChips, SearchInput, EmptyState, labelCls, inputCls, textareaCls } from '../components/ui';
import { ActionSheet, ConfirmSheet } from '../components/ActionSheet';
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

const EMPTY_BOT = {
  name: '', platform: 'MT5', price: '', version: '', recommended_deposit: '',
  win_rate: '', drawdown: '', profit_factor: '', pairs: '', strategy_type: '',
  features: '', description: '', image_url: '', download_url: '',
};

export default function Bots() {
  const { bots, saveBot, deleteBot } = useAdmin();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null closed, {} new, {...bot} edit
  const [dossier, setDossier] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const counts = useMemo(() => ({
    all: bots.length,
    MT4: bots.filter((b) => (b.platform || '').includes('MT4')).length,
    MT5: bots.filter((b) => (b.platform || '').includes('MT5')).length,
  }), [bots]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bots
      .filter((b) => (filter === 'all' ? true : (b.platform || '').includes(filter)))
      .filter((b) => !q || (b.name || '').toLowerCase().includes(q) || (b.pairs || '').toLowerCase().includes(q));
  }, [bots, filter, search]);

  // Linked signals fetched on demand when the dossier opens (small query).
  const [linkedSignals, setLinkedSignals] = useState([]);
  useEffect(() => {
    if (!dossier) { setLinkedSignals([]); return; }
    pb.collection('signals').getList(1, 60, { filter: "status = 'active'", sort: '-created' })
      .then((res) => setLinkedSignals(res.items.filter((sig) => (dossier.pairs || '').includes(sig.symbol)).slice(0, 6)))
      .catch(() => setLinkedSignals([]));
  }, [dossier]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Expert Advisors"
        sub={`${bots.length} systems in the catalog. Licenses and binaries are handled automatically at purchase.`}
        actions={
          <button
            onClick={() => setEditing({ ...EMPTY_BOT })}
            className="flex h-10 items-center gap-2 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] px-4 text-sm font-bold text-[#1C1403] active:scale-[0.98]"
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
            { id: 'MT4', label: 'MT4', count: counts.MT4 },
            { id: 'MT5', label: 'MT5', count: counts.MT5 },
          ]}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Name or pairs..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Cpu} title="No bots match" hint="Add your first Expert Advisor with the button above." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b) => (
            <article
              key={b.id}
              className="group flex flex-col rounded-2xl border border-white/10 bg-akg-surface p-4 transition-all hover:border-[#F3C653]/35"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{b.name}</div>
                  <div className="font-data text-[10px] text-akg-muted">{b.platform} · {b.version || 'v1'}</div>
                </div>
                <span className="shrink-0 font-data text-sm font-bold text-akg-gold">${b.price}</span>
              </div>
              <p className="mt-2 line-clamp-2 flex-1 text-[11px] leading-relaxed text-akg-muted">{b.description}</p>
              <div className="mt-2 flex gap-3 font-data text-[10px] text-akg-muted">
                <span className="text-akg-green">{b.win_rate}</span>
                <span>PF {b.profit_factor}</span>
                <span>DD {b.drawdown}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                <button
                  onClick={() => setDossier(b)}
                  className="flex items-center gap-1 text-[11px] font-bold text-akg-gold hover:text-akg-goldLight"
                >
                  <Eye className="h-3.5 w-3.5" /> Dossier
                </button>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setEditing(b)} className="rounded-lg p-1.5 text-akg-muted hover:bg-white/5 hover:text-white" title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleting(b)} className="rounded-lg p-1.5 text-akg-muted hover:bg-rose-500/10 hover:text-rose-300" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Dossier */}
      <ActionSheet
        open={!!dossier}
        onClose={() => setDossier(null)}
        size="lg"
        title={dossier?.name}
        subtitle={dossier ? `${dossier.platform} · ${dossier.pairs}` : ''}
      >
        {dossier && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Price', `$${dossier.price}`],
                ['Win rate', dossier.win_rate],
                ['Profit factor', dossier.profit_factor],
                ['Max drawdown', dossier.drawdown],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/[0.07] bg-[#0A0D13] px-3 py-2.5">
                  <div className="text-[9px] uppercase tracking-wide text-akg-muted">{k}</div>
                  <div className="mt-0.5 font-data text-sm font-semibold text-white">{v || '-'}</div>
                </div>
              ))}
            </div>

            {dossier.strategy_type && (
              <div>
                <h3 className={labelCls}>Strategy</h3>
                <p className="rounded-xl border border-white/[0.07] bg-[#0A0D13] px-3.5 py-3 text-xs leading-relaxed text-akg-silver">
                  {dossier.strategy_type}
                </p>
              </div>
            )}

            {dossier.features && (
              <div>
                <h3 className={labelCls}>Features</h3>
                <ul className="space-y-1.5">
                  {String(dossier.features).split(/[\n,]/).map((f, i) => f.trim() && (
                    <li key={i} className="rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs text-akg-silver">{f.trim()}</li>
                  ))}
                </ul>
              </div>
            )}

            {dossier.download_url && (
              <a
                href={dossier.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-sky-400/20 bg-sky-400/[0.06] px-4 py-3 text-xs font-semibold text-sky-300 hover:bg-sky-400/10"
              >
                <span>Distribution package (Drive)</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            {linkedSignals.length > 0 && (
              <div>
                <h3 className={labelCls}>Linked live signals ({linkedSignals.length})</h3>
                <div className="space-y-2">
                  {linkedSignals.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0A0D13] px-3.5 py-2.5 font-data text-[11px]">
                      <span className="font-bold text-white">{s.symbol} {s.direction}</span>
                      <span className="text-akg-muted">E {s.entry} · SL {s.stop_loss}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ActionSheet>

      <BotEditor
        bot={editing}
        onClose={() => setEditing(null)}
        onSave={async (payload) => {
          const b = editing;
          setEditing(null);
          if (b) await saveBot(payload, b.id);
        }}
      />

      <ConfirmSheet
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => { if (deleting) await deleteBot(deleting); }}
        title="Delete bot?"
        message={deleting ? `${deleting.name} will disappear from the public catalog. Existing licenses stay valid.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function BotEditor({ bot, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_BOT);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  React.useEffect(() => {
    if (bot) {
      setForm({
        ...EMPTY_BOT,
        ...Object.fromEntries(Object.entries(bot).map(([k, v]) => [k, v ?? ''])),
      });
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
      subtitle="Catalog entry shown on the public Expert Advisors page."
      footer={
        <button
          onClick={async () => {
            setBusy(true);
            const payload = {
              ...form,
              price: Number(form.price),
              features: form.features,
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
          className="h-11 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] disabled:opacity-40"
        >
          {busy ? 'Saving...' : 'Save Bot'}
        </button>
      }
    >
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelCls}>Price USDT *</label>
            <input value={form.price} onChange={set('price')} type="number" className={cn(inputCls, 'font-data')} placeholder="299" />
          </div>
          <div>
            <label className={labelCls}>Version</label>
            <input value={form.version} onChange={set('version')} className={cn(inputCls, 'font-data')} placeholder="v3.2" />
          </div>
          <div>
            <label className={labelCls}>Win rate</label>
            <input value={form.win_rate} onChange={set('win_rate')} className={cn(inputCls, 'font-data')} placeholder="81.4%" />
          </div>
          <div>
            <label className={labelCls}>Max drawdown</label>
            <input value={form.drawdown} onChange={set('drawdown')} className={cn(inputCls, 'font-data')} placeholder="5.8%" />
          </div>
          <div>
            <label className={labelCls}>Profit factor</label>
            <input value={form.profit_factor} onChange={set('profit_factor')} className={cn(inputCls, 'font-data')} placeholder="2.64" />
          </div>
          <div>
            <label className={labelCls}>Min capital</label>
            <input value={form.recommended_deposit} onChange={set('recommended_deposit')} className={cn(inputCls, 'font-data')} placeholder="$1,000" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Strategy type</label>
            <input value={form.strategy_type} onChange={set('strategy_type')} className={inputCls} placeholder="Session Liquidity Sweep" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Traded pairs</label>
          <input value={form.pairs} onChange={(e) => setForm({ ...form, pairs: e.target.value.toUpperCase() })} className={cn(inputCls, 'font-data')} placeholder="XAUUSD (Gold)" />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={set('description')} className={textareaCls} placeholder="One-paragraph strategy description shown on the product page..." />
        </div>
        <div>
          <label className={labelCls}>Features (comma or newline separated)</label>
          <textarea value={form.features} onChange={set('features')} className={textareaCls} placeholder="Hard stop-loss, Dynamic lot sizing, ..." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Image URL</label>
            <input value={form.image_url?.startsWith('data:') ? '' : form.image_url} onChange={set('image_url')} className={inputCls} placeholder="https://..." />
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-akg-gold hover:underline"
            >
              <ImageIcon className="h-3.5 w-3.5" /> or upload (auto-downscaled to webp)
            </button>
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
                  } catch {
                    /* ignore unreadable file */
                  }
                }
                e.target.value = '';
              }}
            />
            {form.image_url && (
              <div className="mt-2 overflow-hidden rounded-lg border border-white/10">
                <img src={form.image_url} alt="preview" className="h-20 w-full object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Google Drive package URL</label>
            <input value={form.download_url} onChange={set('download_url')} className={inputCls} placeholder="https://drive.google.com/..." />
          </div>
        </div>
      </div>
    </ActionSheet>
  );
}
