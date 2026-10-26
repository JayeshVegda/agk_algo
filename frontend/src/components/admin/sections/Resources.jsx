import React, { useMemo, useState } from 'react';
import { Package, Plus, Pencil, Trash2, Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { SectionHeader, FilterChips, SearchInput, EmptyState, labelCls, inputCls, textareaCls } from '../components/ui';
import { ActionSheet, ConfirmSheet } from '../components/ActionSheet';
import { cn } from '../../../lib/utils';

const CATEGORY_LABELS = {
  software: 'Official Files',
  useful_link: 'Brokers & VPS',
  social: 'Community',
};

export default function Resources() {
  const { resources, saveResource, toggleResource, deleteResource } = useAdmin();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const counts = useMemo(() => ({
    all: resources.length,
    software: resources.filter((r) => r.category === 'software').length,
    useful_link: resources.filter((r) => r.category === 'useful_link').length,
    social: resources.filter((r) => r.category === 'social').length,
  }), [resources]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources
      .filter((r) => (filter === 'all' ? true : r.category === filter))
      .filter((r) => !q || (r.title || '').toLowerCase().includes(q) || (r.url || '').toLowerCase().includes(q));
  }, [resources, filter, search]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Traders Kit"
        sub="Files, brokers, and community links shown on the public /kit page."
        actions={
          <button
            onClick={() => setEditing({
              title: '', category: 'software', url: '', description: '',
              icon: 'download', badge: '', sort_order: resources.length + 1, is_active: true,
            })}
            className="flex h-10 items-center gap-2 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] px-4 text-sm font-bold text-[#1C1403] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'software', label: 'Files', count: counts.software },
            { id: 'useful_link', label: 'Brokers & VPS', count: counts.useful_link },
            { id: 'social', label: 'Community', count: counts.social },
          ]}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Title or URL..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No items" hint="Add files, brokers, or community links." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <article
              key={r.id}
              className={cn(
                'flex flex-col rounded-2xl border border-white/10 bg-akg-surface p-4 transition-all',
                r.is_active === false && 'opacity-50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{r.title}</div>
                  <div className="mt-0.5 font-data text-[10px] uppercase tracking-wide text-akg-muted">
                    {CATEGORY_LABELS[r.category] || r.category}{r.badge ? ` · ${r.badge}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => toggleResource(r)}
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-1 font-data text-[9px] font-bold uppercase transition-colors',
                    r.is_active === false
                      ? 'border-white/10 text-akg-muted hover:border-akg-green/40 hover:text-akg-green'
                      : 'border-akg-green/30 bg-akg-green/10 text-akg-green hover:bg-akg-green/20'
                  )}
                >
                  {r.is_active === false ? 'hidden' : 'live'}
                </button>
              </div>
              {r.description && <p className="mt-2 line-clamp-2 flex-1 text-[11px] leading-relaxed text-akg-muted">{r.description}</p>}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(r.url || '');
                    setCopiedId(r.id);
                    setTimeout(() => setCopiedId(null), 1500);
                  }}
                  className="flex min-w-0 items-center gap-1.5 font-data text-[10px] text-akg-gold hover:underline"
                  title={r.url}
                >
                  {copiedId === r.id ? <Check className="h-3 w-3 shrink-0" /> : <Copy className="h-3 w-3 shrink-0" />}
                  <span className="truncate">{r.url}</span>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-akg-muted hover:bg-white/5 hover:text-white" title="Open">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button onClick={() => setEditing(r)} className="rounded-lg p-1.5 text-akg-muted hover:bg-white/5 hover:text-white" title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleting(r)} className="rounded-lg p-1.5 text-akg-muted hover:bg-rose-500/10 hover:text-rose-300" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <ResourceEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            const r = editing;
            setEditing(null);
            if (r) await saveResource(payload, r.id);
          }}
        />
      )}

      <ConfirmSheet
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => { if (deleting) await deleteResource(deleting); }}
        title="Delete item?"
        message={deleting ? `"${deleting.title}" will be removed from the Traders Kit.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function ResourceEditor({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    title: item.title || '',
    category: item.category || 'software',
    url: item.url || '',
    description: item.description || '',
    icon: item.icon || 'download',
    badge: item.badge || '',
    sort_order: item.sort_order ?? 10,
    is_active: item.is_active !== false,
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <ActionSheet
      open
      onClose={onClose}
      title={item.id ? 'Edit item' : 'Add item'}
      footer={
        <button
          onClick={() => onSave({ ...form, sort_order: Number(form.sort_order) || 10, is_active: Boolean(form.is_active) })}
          disabled={!form.title.trim() || !form.url.trim()}
          className="h-11 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] disabled:opacity-40"
        >
          Save Item
        </button>
      }
    >
      <div className="space-y-3.5">
        <div>
          <label className={labelCls}>Title *</label>
          <input value={form.title} onChange={set('title')} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Category *</label>
            <select value={form.category} onChange={set('category')} className={inputCls}>
              <option value="software">Official Files</option>
              <option value="useful_link">Brokers & VPS</option>
              <option value="social">Community</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Badge</label>
            <input value={form.badge} onChange={set('badge')} className={inputCls} placeholder="v3.2 Production" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Destination URL *</label>
          <input value={form.url} onChange={set('url')} className={cn(inputCls, 'font-data text-xs')} placeholder="/downloads/file.txt or https://..." />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={set('description')} className={textareaCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Sort order</label>
            <input value={form.sort_order} onChange={set('sort_order')} type="number" className={cn(inputCls, 'font-data')} />
          </div>
          <label className="flex cursor-pointer items-end gap-2 pb-2.5 text-xs text-akg-silver">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 accent-[#F3C653]"
            />
            Live on /kit
          </label>
        </div>
      </div>
    </ActionSheet>
  );
}
