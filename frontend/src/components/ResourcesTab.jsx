import React, { useState, useEffect } from 'react';
import { pb, pbUrl } from '../lib/pocketbase';
import {
  Download, Copy, Check, FileText,
  Send, Share2, MessageSquare, Server, Globe, ArrowRight,
} from 'lucide-react';
import { Badge } from './ui/Badge';

const CATEGORIES = [
  { id: 'software', label: 'Official Files' },
  { id: 'useful_link', label: 'Brokers & VPS' },
  { id: 'social', label: 'Community' },
];

function categoryIcon(item) {
  const icon = (item.icon || '').toLowerCase();
  const url = (item.url || '').toLowerCase();
  if (icon.includes('telegram') || url.includes('t.me')) return Send;
  if (icon.includes('twitter') || icon.includes('x') || url.includes('x.com')) return Share2;
  if (icon.includes('discord') || url.includes('discord')) return MessageSquare;
  if (icon.includes('server') || url.includes('vps') || url.includes('beeks')) return Server;
  if (item.category === 'software' || item.url?.endsWith('.txt') || item.url?.endsWith('.zip')) return FileText;
  return Globe;
}

const groupIcon = {
  software: FileText,
  useful_link: Server,
  social: Send,
};

export function ResourcesTab({ notify, onNavigate }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const load = () => {
    pb.collection('resources')
      .getFullList({ sort: 'sort_order,-created' })
      .then((records) => {
        setResources(records.filter((r) => r.is_active !== false));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load resources:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    const unsub = pb.collection('resources').subscribe('*', () => load()).catch(() => {});
    return () => { unsub?.then?.((u) => u && u()); };
  }, []);

  const handleCopy = (item) => {
    const absolute = pbUrl(item.url || '');
    navigator.clipboard.writeText(absolute);
    setCopiedId(item.id);
    if (notify) {
      notify({ type: 'copy', title: 'Link copied', message: absolute });
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openItem = (item) => {
    const u = item.url || '';
    if (u.startsWith('/') && !u.startsWith('/downloads') && !u.startsWith('/api')) {
      if (onNavigate) {
        onNavigate(u.replace(/^\//, '') === 'bots' ? 'bots' : 'resources');
      } else {
        window.location.href = u;
      }
      return;
    }
    window.open(pbUrl(u), '_blank', 'noopener,noreferrer');
  };

  const isDownload = (item) => item.category === 'software' && /\.(txt|zip|ex4|ex5|set)$/i.test(item.url || '');

  const featured = resources.find((r) => isDownload(r) && r.url?.endsWith('.txt')) || null;
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: resources.filter((r) => r.category === cat.id && r.id !== featured?.id),
  })).filter((g) => g.items.length > 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-2 py-20 text-center text-sm text-akg-muted">
        Loading the kit...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl font-sans text-akg-text">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-3xl">
          Traders Kit
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-akg-muted">
          Everything you need around the systems: the official setup guide, vetted brokers and VPS providers, and the community channels where the desk operates.
        </p>
      </div>

      {resources.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-akg-hairline bg-akg-card px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-akg-hairline bg-akg-raised">
            <Globe className="h-5 w-5 text-akg-muted" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-akg-text">The kit is being packed</h3>
          <p className="mt-1 text-sm text-akg-muted">Official files and links will appear here.</p>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {/* Featured: setup guide */}
          {featured && (
            <section>
              <article className="relative overflow-hidden rounded-xl border border-akg-hairline bg-akg-card p-6 shadow-sm sm:p-8">
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                      <FileText className="h-6 w-6 text-akg-accent" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <Badge variant="emerald">{featured.badge || 'Official'}</Badge>
                        <span className="font-mono text-[10px] uppercase text-akg-muted">
                          {(featured.url || '').split('.').pop()} file
                        </span>
                      </div>
                      <h2 className="mt-2 font-display text-xl font-bold text-akg-text">{featured.title}</h2>
                      <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-akg-muted">
                        {featured.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={pbUrl(featured.url)}
                      download
                      className="inline-flex items-center gap-2 rounded-lg bg-akg-cta px-5 py-2.5 text-sm font-semibold text-akg-cta-text transition-opacity hover:opacity-90 shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </a>
                    <button
                      onClick={() => handleCopy(featured)}
                      className="rounded-lg border border-akg-hairline bg-akg-raised p-2.5 text-akg-muted transition-colors hover:text-akg-text cursor-pointer"
                      title="Copy link"
                    >
                      {copiedId === featured.id ? <Check className="h-4 w-4 text-akg-green" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* Grouped sections */}
          {grouped.map((group) => {
            const GIcon = groupIcon[group.id] || Globe;
            return (
              <section key={group.id}>
                <h2 className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-wider text-akg-muted">
                  <GIcon className="h-3.5 w-3.5 text-akg-accent" />
                  {group.label}
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => {
                    const Icon = categoryIcon(item);
                    const internal = item.url?.startsWith('/');
                    return (
                      <article
                        key={item.id}
                        onClick={() => openItem(item)}
                        className="group flex cursor-pointer flex-col rounded-xl border border-akg-hairline bg-akg-card p-5 transition-all hover:border-akg-accent/40 hover:-translate-y-0.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-akg-hairline bg-akg-raised">
                            <Icon className="h-5 w-5 text-akg-accent" strokeWidth={1.75} />
                          </div>
                          {item.badge && (
                            <Badge variant="secondary" className="font-mono text-[9px] uppercase">
                              {item.badge}
                            </Badge>
                          )}
                        </div>

                        <h3 className="mt-4 text-sm font-bold text-akg-text group-hover:text-akg-accent transition-colors">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-3 flex-1 text-xs leading-relaxed text-akg-muted">
                          {item.description}
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-akg-hairline pt-3.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(item); }}
                            className="rounded-md p-1.5 text-akg-muted transition-colors hover:text-akg-text cursor-pointer"
                            title="Copy link"
                          >
                            {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-akg-green" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>

                          {isDownload(item) ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-akg-green">
                              <Download className="h-3 w-3" />
                              Download
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-akg-muted group-hover:text-akg-accent transition-colors">
                              {internal ? 'Open in site' : 'Open link'}
                              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
