import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Download, ExternalLink, Share2, ShieldCheck, Check, 
  Send, MessageSquare, Globe, Server, FileCode2,
  Sparkles, Layers, ArrowUpRight, Copy
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export function ResourcesTab({ notify }) {
  const [resources, setResources] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const loadResources = async () => {
    try {
      const records = await pb.collection('resources').getFullList({
        sort: 'sort_order,-created'
      });
      setResources(records);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
    const unsub = pb.collection('resources').subscribe('*', () => loadResources()).catch(() => {});
    return () => { unsub?.then?.((u) => u && u()); };
  }, []);

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    if (notify) {
      notify({
        type: 'copy',
        title: 'Link Copied',
        message: 'Resource link copied to clipboard'
      });
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = resources.filter((r) => {
    if (!r.is_active) return false;
    if (categoryFilter === 'all') return true;
    return r.category === categoryFilter;
  });

  const getCategoryIcon = (iconName, category) => {
    if (iconName === 'telegram') return <Send className="h-5 w-5 text-sky-400" />;
    if (iconName === 'twitter') return <Share2 className="h-5 w-5 text-sky-300" />;
    if (iconName === 'discord') return <MessageSquare className="h-5 w-5 text-indigo-400" />;
    if (iconName === 'server') return <Server className="h-5 w-5 text-emerald-400" />;
    if (category === 'software' || iconName === 'download') return <Download className="h-5 w-5 text-[#F3C653]" />;
    return <ExternalLink className="h-5 w-5 text-emerald-400" />;
  };

  return (
    <div className="space-y-8 font-sans text-[#E7E9EF] w-full">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#10141B] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D878]/15 border border-[#00D878]/30 text-[#00D878] text-xs font-mono font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Official Traders Kit</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Resources, Downloads & Useful Links
          </h1>
          <p className="text-xs md:text-sm text-[#A6ADB9] max-w-2xl leading-relaxed">
            Verified MT4/MT5 expert advisor files, institutional broker connectivity guides, proprietary trading presets, and verified community feeds.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#07090D] p-1.5 rounded-xl border border-white/10 shrink-0">
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'software', label: 'EAs & Software' },
            { id: 'useful_link', label: 'Brokers & VPS' },
            { id: 'social', label: 'Official Socials' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-[#00D878] text-[#07090D] font-bold shadow-md'
                  : 'text-[#A6ADB9] hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Resources */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#A6ADB9]">
          Loading official resources...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center text-xs text-[#A6ADB9] bg-[#10141B] rounded-2xl border border-white/10">
          No resources found in this category.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isDownload = item.category === 'software';

            return (
              <Card 
                key={item.id} 
                className="bg-[#10141B] border-white/10 hover:border-[#00D878]/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item.icon, item.category)}
                    </div>
                    {item.badge && (
                      <Badge 
                        variant="secondary"
                        className="text-[10px] font-mono tracking-wider bg-white/5 border border-white/10 text-[#E7E9EF]"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-2 pt-0">
                    <CardTitle className="text-base font-bold text-white group-hover:text-[#00D878] transition-colors">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#A6ADB9] leading-relaxed line-clamp-3">
                      {item.description || 'Verified resource provided by AKG ALGO desk.'}
                    </CardDescription>
                  </CardContent>
                </div>

                <div className="p-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2 mt-4">
                  <button
                    onClick={() => handleCopyUrl(item.url, item.id)}
                    className="p-1.5 rounded-lg text-[#A6ADB9] hover:text-white hover:bg-white/5 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    title="Copy direct link"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-3.5 w-3.5 text-[#00D878]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="text-[11px]">Copy</span>
                  </button>

                  <a
                    href={item.url}
                    target={item.url.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    download={isDownload ? true : undefined}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isDownload
                        ? 'bg-[#00D878] text-[#07090D] hover:bg-[#00F09A]'
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    <span>{isDownload ? 'Download' : 'Open Link'}</span>
                    {isDownload ? (
                      <Download className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    )}
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
