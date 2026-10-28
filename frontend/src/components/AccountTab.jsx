import React, { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import { pbUrl } from '../lib/pocketbase';
import {
  Zap, Cpu, KeyRound, Copy, Check, Download, ExternalLink, HardDrive,
  Clock, CreditCard, FileText, AlertCircle, CheckCircle2, Timer, Receipt,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { downloadLinksFor } from '../lib/utils';
import { cn } from '../lib/utils';

const PLAN_LABELS = {
  PERFECT_SIGNAL_BOX: '⚡ Perfect Signal Box (VIP)',
  SR_SIGNAL_BOX: 'SR Signal Box (Standard)',
};

function fmtDateTime(s) {
  if (!s) return '-';
  return new Date(String(s).replace(' ', 'T')).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function AccountTab({ user, notify, onNavigate, onOpenAuth }) {
  const [payments, setPayments] = useState([]);
  const [bots, setBots] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    if (!user?.email) return;
    try {
      const [payRecords, botRecords] = await Promise.all([
        pb.collection('payments').getFullList({ filter: `user_email = "${user.email}"`, sort: '-created' }),
        pb.collection('bots').getFullList({ sort: '-created' }).catch(() => []),
      ]);
      setPayments(payRecords);
      setBots(botRecords);
    } catch (err) {
      console.error('Failed to load account data:', err);
    }
  }, [user?.email]);

  useEffect(() => {
    load();
    if (!user?.email) return;
    const unsub = pb.collection('payments').subscribe('*', () => load()).catch(() => {});
    return () => { unsub?.then?.((u) => u && u()); };
  }, [user?.email, load]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4 text-[#E7E9EF]">
        <KeyRound className="h-10 w-10 mx-auto text-[#F3C653]" />
        <h2 className="text-xl font-bold text-white">Sign in to view your account</h2>
        <p className="text-xs text-[#A6ADB9]">Your membership status, purchase history and bot licenses live here.</p>
        <Button onClick={onOpenAuth} className="font-bold">Sign In / Register</Button>
      </div>
    );
  }

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (notify) notify({ type: 'copy', title: 'Copied to Clipboard', message: text });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ---- Subscription state ------------------------------------------------
  const now = Date.now();
  const expiry = user?.cycle_expires_at ? new Date(String(user.cycle_expires_at).replace(' ', 'T')).getTime() : null;
  const isActive = expiry && expiry > now;
  const daysLeft = isActive ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : 0;
  const cycleProgress = isActive ? Math.max(0, Math.min(100, Math.round(((30 - daysLeft) / 30) * 100))) : 100;
  const subState = isActive ? (daysLeft <= 7 ? 'expiring' : 'active') : (user?.plan && user?.plan !== 'NONE' ? 'expired' : 'none');
  const pendingSub = payments.find((p) => p.status === 'pending' && !p.plan?.startsWith('BOT:'));

  // ---- Bot fleet ----------------------------------------------------------
  const botPurchases = payments.filter((p) => p.plan?.startsWith('BOT:') && p.status === 'confirmed');
  const pendingBots = payments.filter((p) => p.plan?.startsWith('BOT:') && p.status === 'pending');

  const stateChip = {
    active: 'bg-[#00D878]/15 text-[#00D878] border-[#00D878]/30',
    expiring: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    expired: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    none: 'bg-white/5 text-[#A6ADB9] border-white/10',
  }[subState];

  const stateLabel = {
    active: '● ACTIVE',
    expiring: '● EXPIRING SOON',
    expired: '● EXPIRED',
    none: '○ NO PLAN',
  }[subState];

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans text-[#E7E9EF]">

      {/* ================= SECTION 1: MEMBERSHIP STATUS ================= */}
      <div className={cn(
          'p-5 sm:p-6 rounded-2xl border space-y-4 shadow-xl',
          isActive
            ? 'border-[#F3C653]/30 bg-gradient-to-b from-[#171208] to-[#10141B] shadow-[#F3C653]/10 ring-1 ring-[#F3C653]/20'
            : 'border-white/10 bg-[#10141B]'
        )}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#A6ADB9] flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[#F3C653]" />
            <span>My Membership</span>
          </span>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', stateChip)}>{stateLabel}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className={cn('text-2xl font-black', isActive ? 'text-metallic' : 'text-white')}>
              {PLAN_LABELS[user?.plan] || 'Free Member Access'}
            </div>
            <div className="text-xs text-[#A6ADB9] mt-1">
              {isActive ? (
                <>Cycle ends <b className="text-white">{new Date(expiry).toLocaleDateString()}</b> · <span className="text-[#F3C653] font-bold">{daysLeft} day{daysLeft === 1 ? '' : 's'} remaining</span></>
              ) : user?.plan && user?.plan !== 'NONE' ? (
                <>Your previous cycle has ended. Renew to restore full signal access.</>
              ) : (
                <>No active 30-day signal cycle yet. Subscribe to unlock the live desk.</>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {isActive && (
              <Button
                size="sm"
                className="gap-1.5 font-bold text-xs"
                onClick={() => onNavigate && onNavigate('pricing')}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Buy Next Month</span>
              </Button>
            )}
            {!isActive && (
              <Button size="sm" className="gap-1.5 font-bold text-xs" onClick={() => onNavigate && onNavigate('pricing')}>
                <CreditCard className="h-3.5 w-3.5" />
                <span>Subscribe Now</span>
              </Button>
            )}
            {pendingSub && (
              <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                <Timer className="h-3 w-3" /> Next-cycle payment awaiting desk verification
              </span>
            )}
          </div>
        </div>

        {/* Cycle progress bar */}
        <div>
          <div className="h-2 w-full rounded-full bg-white/5 border border-white/10 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', subState === 'expiring' ? 'bg-amber-400' : 'bg-[#00D878]')}
              style={{ width: `${isActive ? 100 - cycleProgress : 0}%` }}
            />
          </div>
          {isActive && (
            <div className="flex justify-between text-[10px] text-[#A6ADB9] mt-1 font-mono">
              <span>{30 - daysLeft} days used</span>
              <span>{daysLeft} days left</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= SECTION 2: MY BOTS ================= */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#A6ADB9] flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-[#00D878]" />
          <span>My Bot Licenses ({botPurchases.length})</span>
        </span>

        {botPurchases.length === 0 && pendingBots.length === 0 ? (
          <div className="p-5 rounded-xl border border-white/10 bg-white/5 text-center space-y-2">
            <p className="text-sm text-[#E7E9EF]">No bot licenses yet.</p>
            <p className="text-[11px] text-[#A6ADB9]">
              Purchase an MT4/MT5 Expert Advisor and your bound account number, license key and downloads appear here permanently.
            </p>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => onNavigate && onNavigate('bots')}>
              Browse Trading Bots
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {botPurchases.map((bp) => {
              const match = bp.plan.match(/BOT:\s*([^(]+)\s*\(([^#]+)#([^)]+)\)/i);
              const botName = match ? match[1].trim() : bp.plan.replace('BOT:', '').trim();
              const platform = match ? match[2].trim() : 'MT5';
              const acc = match ? match[3].trim() : 'N/A';
              const matchedBot = bots.find((b) => b.name.toLowerCase().trim() === botName.toLowerCase().trim());
              const isCopied = copiedId === bp.id;
              return (
                <div key={bp.id} className="p-4 rounded-xl border border-[#00D878]/20 bg-[#07090D] space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="gold" className="font-mono text-[10px]">{platform}</Badge>
                      <span className="font-bold text-sm text-white">{botName}</span>
                      <span className="text-[10px] text-[#A6ADB9] font-mono">Acct #{acc}</span>
                    </div>
                    <span className="text-[10px] text-[#A6ADB9] font-mono">Purchased {fmtDateTime(bp.created)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {bp.license_key ? (
                      <button
                        onClick={() => handleCopy(bp.license_key, bp.id)}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-black/60 border border-[#00D878]/20 font-mono text-xs text-[#00D878] break-all select-all cursor-pointer hover:border-[#00D878]/50 transition-colors text-left"
                      >
                        <KeyRound className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-bold">{bp.license_key}</span>
                        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 opacity-60" />}
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-xs text-[#A6ADB9]">
                        Key pending issuance
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#F3C653]">${bp.amount} USDT</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {matchedBot && downloadLinksFor(matchedBot).map((l) => (
                      <a
                        key={l.path}
                        href={l.path}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D878] text-[#07090D] font-bold hover:bg-[#00F09A] transition-colors text-xs cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download .{l.ext} ({l.platform})</span>
                      </a>
                    ))}
                    {matchedBot?.download_url && (
                      <a
                        href={matchedBot.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-semibold hover:bg-blue-600/30 transition-colors text-xs"
                      >
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>Drive Package</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <a
                      href={pbUrl('/downloads/AKG_ALGO_SETUP_GUIDE.txt')}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#F3C653]" />
                      <span>Setup Guide</span>
                    </a>
                  </div>
                </div>
              );
            })}

            {pendingBots.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-400/20 bg-amber-400/5 text-xs text-amber-200 flex items-start gap-2">
                <Timer className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {pendingBots.length} bot purchase{pendingBots.length === 1 ? '' : 's'} awaiting desk verification. Your license key and Google Drive package link appear here the moment the payment is approved — no further action needed from you.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= SECTION 3: FULL PAYMENT HISTORY ================= */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#A6ADB9] flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5 text-slate-400" />
          <span>Payment History ({payments.length})</span>
        </span>

        {payments.length === 0 ? (
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center text-xs text-[#A6ADB9]">
            No payments recorded yet for this account.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const isBot = p.plan?.startsWith('BOT:');
              const match = isBot ? p.plan.match(/BOT:\s*([^(]+)\s*\(([^#]+)#([^)]+)\)/i) : null;
              const planLabel = isBot
                ? `Bot: ${match ? match[1].trim() : p.plan.slice(4)}`
                : PLAN_LABELS[p.plan] || p.plan;
              const chip = p.status === 'confirmed'
                ? 'bg-[#00D878]/15 text-[#00D878] border-[#00D878]/30'
                : p.status === 'pending'
                  ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30';
              const isCopied = copiedId === 'tx-' + p.id;
              return (
                <div key={p.id} className="p-3.5 rounded-xl border border-white/10 bg-[#10141B] space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="secondary" className="text-[9px] font-mono shrink-0">{isBot ? 'BOT' : 'SIGNALS'}</Badge>
                      <span className="text-xs font-bold text-white truncate">{planLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-[#F3C653] tabular-nums">${p.amount} USDT</span>
                      <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase', chip)}>{p.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] font-mono text-[#A6ADB9]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {fmtDateTime(p.created)}
                    </span>
                    <span>{p.network}</span>
                    {p.txid && (
                      <button
                        onClick={() => handleCopy(p.txid, 'tx-' + p.id)}
                        className="flex items-center gap-1 hover:text-[#F3C653] cursor-pointer transition-colors"
                        title={p.txid}
                      >
                        TXID {p.txid.slice(0, 8)}…{p.txid.slice(-6)}
                        {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    )}
                  </div>

                  {p.status === 'rejected' && p.admin_notes && (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span><b>Rejected:</b> {p.admin_notes}</span>
                    </div>
                  )}
                  {p.status === 'pending' && (
                    <div className="text-[11px] text-amber-300/90 flex items-start gap-1.5">
                      <Timer className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>Awaiting desk verification. You'll get a notification the moment it's reviewed.</span>
                    </div>
                  )}
                  {p.status === 'confirmed' && !isBot && (
                    <div className="text-[11px] text-[#00D878]/90 flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>Confirmed. 30-day signal cycle granted.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
