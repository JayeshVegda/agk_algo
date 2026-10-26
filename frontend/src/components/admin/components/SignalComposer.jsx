import React, { useEffect, useMemo, useState } from 'react';
import { Zap, Send, MessageSquareText, ListChecks } from 'lucide-react';
import { ActionSheet } from './ActionSheet';
import { labelCls, inputCls, textareaCls } from './ui';
import { parseSignalChatText, parsedSignalIsValid } from '../lib/parseSignal';
import { useAdmin } from '../AdminContext';
import { useSiteSettings } from '../../../lib/wallets';
import { cn } from '../../../lib/utils';

const SAMPLE = `XAUUSD BUY NOW
Entry: 4312.5
SL: 4298.0
TP1: 4328.0
TP2: 4345.0
Notes: London liquidity sweep complete, riding the displacement.`;

/**
 * Dual-mode signal publisher.
 * mode 'chat': paste a Telegram-style trade call, see the parsed preview live,
 * then broadcast it as a signal and optionally as a pinned directive.
 * mode 'form': precise structured entry.
 */
export default function SignalComposer({ open, onClose, editing }) {
  const { saveSignal, saveBroadcast, currentUser } = useAdmin();
  const settings = useSiteSettings();
  const [mode, setMode] = useState('chat');
  const [chatText, setChatText] = useState('');
  const [alsoDirective, setAlsoDirective] = useState(true);
  React.useEffect(() => { if (open) setAlsoDirective(settings.auto_pin_trade_alerts); }, [open, settings.auto_pin_trade_alerts]);
  const [tier, setTier] = useState('PERFECT_SIGNAL_BOX');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    symbol: 'XAUUSD', direction: 'BUY', entry: '', stop_loss: '',
    take_profit_1: '', take_profit_2: '', plan_tier: 'PERFECT_SIGNAL_BOX', notes: '',
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setMode('form');
      setForm({
        symbol: editing.symbol || '',
        direction: editing.direction || 'BUY',
        entry: editing.entry || '',
        stop_loss: editing.stop_loss || '',
        take_profit_1: editing.take_profit_1 || '',
        take_profit_2: editing.take_profit_2 || '',
        plan_tier: editing.plan_tier || 'PERFECT_SIGNAL_BOX',
        notes: editing.notes || '',
      });
    } else {
      setMode('chat');
      setChatText('');
    }
  }, [open, editing]);

  const parsed = useMemo(() => parseSignalChatText(chatText), [chatText]);
  const parsedOk = parsedSignalIsValid(parsed);
  const formOk = form.symbol.trim() && form.direction && form.entry.trim() && form.stop_loss.trim() && form.take_profit_1.trim();

  const handleChatBroadcast = async () => {
    if (!parsedOk || busy) return;
    setBusy(true);
    let ok = true;
    if (alsoDirective) {
      ok = await saveBroadcast({
        title: `Trade Alert: ${parsed.symbol} ${parsed.direction} @ ${parsed.entry}`,
        body: chatText.trim(),
        author: currentUser?.name || 'Desk Admin',
        pinned: true,
      });
    }
    if (ok) {
      ok = await saveSignal({
        ...parsed,
        plan_tier: tier,
        status: 'active',
        notes: parsed.notes || 'Dispatched via Quick Chatbox',
      });
    }
    setBusy(false);
    if (ok) onClose();
  };

  const handleFormSave = async () => {
    if (!formOk || busy) return;
    setBusy(true);
    const ok = await saveSignal(
      { ...form, symbol: form.symbol.toUpperCase() },
      editing?.id
    );
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <ActionSheet
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Edit Signal' : 'Broadcast Signal'}
      subtitle={editing ? 'Adjust the trade parameters.' : 'Paste from Telegram or fill the form. Members see it instantly.'}
      footer={
        mode === 'chat' ? (
          <div className="space-y-2.5">
            {!editing && (
              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-akg-silver">
                <input
                  type="checkbox"
                  checked={alsoDirective}
                  onChange={(e) => setAlsoDirective(e.target.checked)}
                  className="h-4 w-4 accent-[#F3C653]"
                />
                Also pin as a desk directive (broadcast feed)
              </label>
            )}
            <button
              onClick={handleChatBroadcast}
              disabled={!parsedOk || busy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] transition-all active:scale-[0.98] disabled:opacity-40"
            >
              <Zap className="h-4 w-4" />
              {busy ? 'Broadcasting...' : alsoDirective ? 'Broadcast Signal + Directive' : 'Broadcast Signal'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleFormSave}
            disabled={!formOk || busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] transition-all active:scale-[0.98] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {busy ? 'Saving...' : editing ? 'Save Changes' : 'Broadcast Signal'}
          </button>
        )
      }
    >
      {/* mode switch */}
      {!editing && (
        <div className="mb-4 flex rounded-full border border-white/10 bg-[#0A0D13] p-1">
          {[
            { id: 'chat', label: 'Chatbox paste', icon: MessageSquareText },
            { id: 'form', label: 'Structured form', icon: ListChecks },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-all',
                  mode === m.id ? 'bg-[#F3C653] text-[#1C1403]' : 'text-akg-muted hover:text-white'
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            );
          })}
        </div>
      )}

      {mode === 'chat' ? (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Deliver to subscription</label>
            <div className="flex gap-2">
              {[
                { id: 'PERFECT_SIGNAL_BOX', label: 'Premium (Perfect Box)', hint: 'SR members see a locked teaser' },
                { id: 'SR_SIGNAL_BOX', label: 'SR Box', hint: 'all paying members' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTier(t.id)}
                  title={t.hint}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all',
                    tier === t.id
                      ? 'border-[#F3C653] bg-[#F3C653]/12 text-akg-gold ring-1 ring-[#F3C653]/30'
                      : 'border-white/10 text-akg-muted hover:border-white/25'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tier === 'PERFECT_SIGNAL_BOX' && (
              <p className="mt-1.5 text-[11px] text-akg-muted">SR members will see this signal blurred with an upgrade prompt.</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <label className={labelCls}>Paste the trade call</label>
            <button
              onClick={() => setChatText(SAMPLE)}
              className="text-[11px] font-semibold text-akg-gold hover:underline"
            >
              insert sample
            </button>
          </div>
          <textarea
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder={'XAUUSD BUY NOW\nEntry: ...\nSL: ...\nTP1: ...'}
            className={cn(textareaCls, 'min-h-[140px] font-data text-[13px]')}
          />

          {chatText.trim() && (
            <div className="rounded-xl border border-white/10 bg-[#0A0D13] p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-data text-[10px] uppercase tracking-wider text-akg-muted">Parsed preview</span>
                <span className={cn('font-data text-[10px] font-bold', parsedOk ? 'text-akg-green' : 'text-amber-300')}>
                  {parsedOk ? 'READY' : 'incomplete — fix in form mode'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-data text-xs sm:grid-cols-3">
                {[
                  ['Symbol', parsed.symbol], ['Side', parsed.direction], ['Entry', parsed.entry],
                  ['Stop loss', parsed.stop_loss], ['TP1', parsed.take_profit_1], ['TP2', parsed.take_profit_2 || '-'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                    <div className="text-[9px] uppercase text-akg-muted">{k}</div>
                    <div className={cn('font-semibold', v ? 'text-white' : 'text-akg-muted/50')}>{v || '—'}</div>
                  </div>
                ))}
              </div>
              {parsed.notes && <p className="mt-2 line-clamp-2 text-[11px] text-akg-muted">Notes: {parsed.notes}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Pair / Symbol *</label>
              <input
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                className={cn(inputCls, 'font-data')}
                placeholder="XAUUSD"
              />
            </div>
            <div>
              <label className={labelCls}>Direction *</label>
              <div className="flex rounded-xl border border-white/10 bg-[#0A0D13] p-1">
                {['BUY', 'SELL'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setForm({ ...form, direction: d })}
                    className={cn(
                      'h-9 flex-1 rounded-lg text-xs font-bold transition-all',
                      form.direction === d
                        ? d === 'BUY' ? 'bg-akg-green text-[#052012]' : 'bg-rose-500 text-white'
                        : 'text-akg-muted'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelCls}>Entry *</label>
              <input value={form.entry} onChange={(e) => setForm({ ...form, entry: e.target.value })} className={cn(inputCls, 'font-data')} placeholder="4312.5" />
            </div>
            <div>
              <label className={labelCls}>Stop loss *</label>
              <input value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: e.target.value })} className={cn(inputCls, 'font-data')} placeholder="4298" />
            </div>
            <div>
              <label className={labelCls}>TP 1 *</label>
              <input value={form.take_profit_1} onChange={(e) => setForm({ ...form, take_profit_1: e.target.value })} className={cn(inputCls, 'font-data')} placeholder="4328" />
            </div>
            <div>
              <label className={labelCls}>TP 2</label>
              <input value={form.take_profit_2} onChange={(e) => setForm({ ...form, take_profit_2: e.target.value })} className={cn(inputCls, 'font-data')} placeholder="4345" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Plan tier</label>
            <select
              value={form.plan_tier}
              onChange={(e) => setForm({ ...form, plan_tier: e.target.value })}
              className={inputCls}
            >
              <option value="PERFECT_SIGNAL_BOX">Perfect Signal Box ($20, VIP)</option>
              <option value="SR_SIGNAL_BOX">SR Signal Box ($10)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Notes / rationale</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={textareaCls} placeholder="Desk rationale visible to members..." />
          </div>
        </div>
      )}
    </ActionSheet>
  );
}
