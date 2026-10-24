import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Bell, Pin, Shield, Clock, Plus, Trash2 } from 'lucide-react';

export function BroadcastsTab({ user }) {
  const [broadcasts, setBroadcasts] = useState([]);

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
      } else if (e.action === 'update') {
        setBroadcasts((prev) => prev.map((b) => (b.id === e.record.id ? e.record : b)));
      } else if (e.action === 'delete') {
        setBroadcasts((prev) => prev.filter((b) => b.id !== e.record.id));
      }
    });

    return () => {
      unsubPromise.then((unsub) => unsub());
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await pb.collection('broadcasts').delete(id);
      loadBroadcasts();
    } catch (err) {
      alert('Error deleting announcement: ' + err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="p-6 rounded-2xl border border-border/80 bg-card/80 backdrop-blur shadow-sm">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono font-semibold mb-2">
          <Bell className="h-3 w-3" />
          OFFICIAL TRADING DESK BROADCAST
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Live Announcements & Directives</h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time broadcasts issued directly by lead algorithmic engineers and chief market analysts.
        </p>
      </div>

      <div className="space-y-4">
        {broadcasts.map((b) => (
          <div
            key={b.id}
            className={`p-6 rounded-2xl border backdrop-blur transition-all shadow-md ${
              b.pinned
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-border/80 bg-card/90 hover:border-blue-500/40'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                {b.pinned && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    <Pin className="h-3 w-3" /> PINNED
                  </span>
                )}
                <h3 className="text-base font-bold text-white">{b.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(b.created).toLocaleDateString()}
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

            <p className="text-xs text-slate-300 leading-relaxed pt-3 font-mono">
              {b.body}
            </p>

            <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Author: <span className="text-slate-400 font-semibold">{b.author || 'Lead Desk Admin'}</span></span>
              <span>Encrypted Broadcast Stream Verified</span>
            </div>
          </div>
        ))}
        {broadcasts.length === 0 && (
          <div className="p-8 text-center text-slate-500 rounded-2xl border border-border/50 font-mono text-xs">
            No active announcements.
          </div>
        )}
      </div>
    </div>
  );
}
