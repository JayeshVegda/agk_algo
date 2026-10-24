import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Bell, Pin, Shield, Clock, Plus, Trash2, Radio, CheckCircle, Tag } from 'lucide-react';

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

    // Realtime SSE updates
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono font-semibold mb-2">
              <Bell className="h-3.5 w-3.5" />
              OFFICIAL TRADING DESK BROADCAST
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Live Announcements & Directives
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Real-time directives issued directly by algorithmic engineers and chief market analysts.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-bold'
                  : 'border-border bg-[#05070D] text-slate-400'
              }`}
            >
              All ({broadcasts.length})
            </button>
            <button
              onClick={() => setFilter('pinned')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'pinned'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                  : 'border-border bg-[#05070D] text-slate-400'
              }`}
            >
              <Pin className="h-3 w-3" />
              Pinned
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast Feed */}
      <div className="space-y-4">
        {filteredBroadcasts.map((b) => (
          <div
            key={b.id}
            className={`p-6 rounded-2xl border transition-all shadow-md font-mono ${
              b.pinned
                ? 'border-amber-500/40 bg-[#120D05]'
                : 'border-border bg-card hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                {b.pinned && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    <Pin className="h-3 w-3" /> CRITICAL DESK DIRECTIVE
                  </span>
                )}
                <h3 className="text-base font-bold text-white font-sans">{b.title}</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 tabular-nums">
                  <Clock className="h-3 w-3" />
                  {new Date(b.created).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded cursor-pointer"
                    title="Delete announcement"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-3 font-mono whitespace-pre-line">
              {b.body}
            </p>

            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-slate-500">
              <span>
                Desk Lead: <span className="text-slate-300 font-semibold">{b.author || 'Chief Quantitative Strategist'}</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="h-3 w-3" />
                Verified Institutional Stream
              </span>
            </div>
          </div>
        ))}

        {filteredBroadcasts.length === 0 && (
          <div className="p-12 text-center text-slate-500 rounded-2xl border border-border bg-card/50 font-mono text-xs">
            No active directives found matching criteria.
          </div>
        )}
      </div>
    </div>
  );
}
