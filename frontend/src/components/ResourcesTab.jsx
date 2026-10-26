import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
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
    const absolute = item.url?.startsWith('/') ? `${window.location.origin}${item.url}` : item.url;
    navigator.clipboard.writeText(absolute);
    setCopiedId(item.id);
    if (notify) {
      notify({ type: 'copy', title: 'Link Copied', message: absolute });
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openItem = (item) => {
    if (item.url?.startsWith('/')) {
      if (onNavigate) {
        onNavigate(item.url.replace(/^\//, '') === 'bots' ? 'bots' : 'resources');
      } else {
        window.location.href = item.url;
      }
      return;
    }
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const isDownload = (item) => item.category === 'software' && /\.(txt|zip|ex4|ex5|set)$/i.test(item.url || '');

  // Featured card: the setup guide (first active .txt file)
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
    <div className="mx-auto max-w-5xl font-sans text-akg-silver">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Traders Kit
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-akg-muted">
          Everything you need around the systems: the official setup guide, vetted brokers and VPS providers, and the community channels where the desk operates.
        </p>
      </div>

      {resources.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-akg-surface px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
            <Globe className="h-5 w-5 text-akg-muted" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-white">The kit is being packed</h3>
          <p className="mt-1 text-sm text-akg-muted">Official files and links will appear here.</p>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {/* Featured: setup guide */}
          {featured && (
            <section>
              <article className="relative overflow-hidden rounded-2xl border border-[#F3C653]/30 bg-gradient-to-b from-[#171208]/80 to-akg-surface p-6 shadow-gold ring-1 ring-[#F3C653]/15 sm:p-8">
                <div className="pointer-events-none absolute -top-16 right-10 h-40 w-40 rounded-full bg-[#F3C653]/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#F3C653]/30 bg-[#F3C653]/10">
                      <FileText className="h-6 w-6 text-akg-gold" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <Badge variant="gold">{featured.badge || 'Official'}</Badge>
                        <span className="font-data text-[10px] uppercase text-akg-muted">
                          {(featured.url || '').split('.').pop()} file
                        </span>
                      </div>
                      <h2 className="mt-2 font-display text-xl font-bold text-white">{featured.title}</h2>
                      <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-akg-muted">
                        {featured.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={featured.url}
                      download
                      className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] px-5 py-2.5 text-sm font-bold text-[#1C1403] shadow-md shadow-[#F3C653]/20 transition hover:brightness-[1.07]"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </a>
                    <button
                      onClick={() => handleCopy(featured)}
                      className="rounded-full border border-white/10 p-2.5 text-akg-muted transition-colors hover:border-white/25 hover:text-akg-silver"
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
                <h2 className="flex items-center gap-2.5 font-data text-[11px] uppercase tracking-[0.16em] text-akg-muted">
                  <GIcon className="h-3.5 w-3.5 text-akg-gold" />
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
                        className="group flex cursor-pointer flex-col rounded-2xl border border-white/10 bg-akg-surface p-5 transition-all hover:border-[#F3C653]/40 hover:shadow-gold"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3C653]/25 bg-[#F3C653]/[0.07]">
                            <Icon className="h-5 w-5 text-akg-gold" strokeWidth={1.75} />
                          </div>
                          {item.badge && (
                            <Badge variant="secondary" className="font-data text-[9px] uppercase">
                              {item.badge}
                            </Badge>
                          )}
                        </div>

                        <h3 className="mt-4 text-sm font-bold text-white group-hover:text-akg-gold transition-colors">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-3 flex-1 text-xs leading-relaxed text-akg-muted">
                          {item.description}
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(item); }}
                            className="rounded-lg p-1.5 text-akg-muted transition-colors hover:bg-white/5 hover:text-akg-silver"
                            title="Copy link"
                          >
                            {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-akg-green" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>

                          {isDownload(item) ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-akg-green/15 px-3 py-1 text-[11px] font-bold text-akg-green">
                              <Download className="h-3 w-3" />
                              Download
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-akg-muted group-hover:text-akg-gold transition-colors">
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
