import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Bell, Pin, Shield, Clock, Plus, Trash2, Radio, CheckCircle, Tag } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export function BroadcastsTab({ user, notify }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [filter, setFilter] = useState('all');

  const loadBroadcasts = () => {
    pb.collection('broadcasts').getFullList({ sort: '-pinned,-created' })
      .then(setBroadcasts)
      .catch((err) => console.error('Failed to load broadcasts:', err));
  };

  useEffect(() => {
    loadBroadcasts();

    const unsubPromise = pb.collection('broadcasts').subscribe('*', (e) => {
      if (e.action === 'create') {
        setBroadcasts((prev) => [e.record, ...prev]);
        if (notify) {
          notify({
            type: 'warning',
            title: 'New Desk Announcement',
            message: e.record.title
          });
        }
      } else if (e.action === 'update') {
        setBroadcasts((prev) => prev.map((b) => (b.id === e.record.id ? e.record : b)));
      } else if (e.action === 'delete') {
        setBroadcasts((prev) => prev.filter((b) => b.id !== e.record.id));
      }
    });

    return () => {
      unsubPromise.then((unsub) => unsub());
    };
  }, [notify]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await pb.collection('broadcasts').delete(id);
      if (notify) {
        notify({
          type: 'info',
          title: 'Broadcast Removed',
          message: 'Announcement deleted from public stream'
        });
      }
      loadBroadcasts();
    } catch (err) {
      if (notify) notify({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const filteredBroadcasts = broadcasts.filter((b) => {
    if (filter === 'pinned') return b.pinned;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans text-[#E7E9EF]">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#10141B] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="gold" className="gap-2 mb-2 font-mono">
              <Bell className="h-3.5 w-3.5" />
              <span>OFFICIAL TRADING DESK BROADCAST</span>
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Live Announcements & Directives
            </h1>
            <p className="text-xs text-[#A6ADB9] font-mono mt-1">
              Real-time directives issued directly by algorithmic engineers and chief market analysts.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#F3C653]/15 border-[#F3C653] text-[#F3C653] font-bold'
                  : 'border-white/10 bg-white/5 text-[#A6ADB9] hover:text-white'
              }`}
            >
              All ({broadcasts.length})
            </button>
            <button
              onClick={() => setFilter('pinned')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'pinned'
                  ? 'bg-[#F3C653]/15 border-[#F3C653] text-[#F3C653] font-bold'
                  : 'border-white/10 bg-white/5 text-[#A6ADB9] hover:text-white'
              }`}
            >
              <Pin className="h-3 w-3" />
              <span>Pinned</span>
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast Feed */}
      <div className="space-y-4">
        {filteredBroadcasts.map((b) => (
          <div
            key={b.id}
            className={`p-6 rounded-2xl border transition-all shadow-xl font-mono ${
              b.pinned
                ? 'border-[#F3C653]/40 bg-[#171D26]'
                : 'border-white/10 bg-[#10141B] hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                {b.pinned && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#F3C653] bg-[#F3C653]/20 px-2 py-0.5 rounded border border-[#F3C653]/30">
                    <Pin className="h-3 w-3" /> CRITICAL DIRECTIVE
                  </span>
                )}
                <h3 className="text-base font-bold text-white font-sans">{b.title}</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-[11px] text-[#A6ADB9] flex items-center gap-1 tabular-nums">
                  <Clock className="h-3 w-3" />
                  {new Date(b.created).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-[#A6ADB9] hover:text-rose-400 p-1 rounded cursor-pointer"
                    title="Delete announcement"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-[#E7E9EF] leading-relaxed pt-3 font-mono whitespace-pre-line">
              {b.body}
            </p>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-[#A6ADB9]">
              <span>
                Desk Lead: <span className="text-white font-semibold">{b.author || 'Chief Quantitative Strategist'}</span>
              </span>
              <span className="flex items-center gap-1 text-[#00D878]">
                <CheckCircle className="h-3 w-3" />
                Verified Institutional Stream
              </span>
            </div>
          </div>
        ))}

        {filteredBroadcasts.length === 0 && (
          <div className="p-12 text-center text-[#A6ADB9] rounded-2xl border border-white/10 bg-[#10141B] font-mono text-xs">
            No active directives found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
