import React, { useState } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Check, ShieldAlert, CreditCard, Copy, CheckCircle2, 
  Lock, Zap, ArrowRight, ShieldCheck, QrCode, ExternalLink
} from 'lucide-react';

export function PricingTab({ user, onOpenAuth, notify }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [network, setNetwork] = useState('USDT-TRC20');
  const [txid, setTxid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const WALLETS = {
    'USDT-TRC20': 'TLa2g9Y8kP2qXvL1b8Jp9wZmN4qK7dEf9A',
    'USDT-BEP20': '0x71C2B81F1A9D4E72b83A072fCc8295b7A19D38Ef',
    'USDT-ERC20': '0x71C2B81F1A9D4E72b83A072fCc8295b7A19D38Ef',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(WALLETS[network]);
    setCopied(true);
    if (notify) {
      notify({
        type: 'copy',
        title: 'Wallet Address Copied',
        message: `${network}: ${WALLETS[network]}`
      });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitTxid = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    setSubmitting(true);
    try {
      await pb.collection('payments').create({
        user_email: user.email,
        plan: selectedPlan.id,
        amount: selectedPlan.price,
        network,
        txid,
        status: 'pending'
      });
      setSubmitted(true);
      if (notify) {
        notify({
          type: 'success',
          title: 'Transaction Submitted',
          message: 'Payment TXID submitted for automated ledger verification'
        });
      }
    } catch (err) {
      if (notify) {
        notify({
          type: 'error',
          title: 'Submission Error',
          message: err.message || 'Check connection'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const PLANS = [
    {
      id: 'SR_SIGNAL_BOX',
      name: 'SR Signal Box',
      price: 10,
      period: 'per 30-day cycle',
      popular: false,
      tag: 'STANDARD EXECUTION',
      features: [
        'Photo & text signal execution parameters',
        'Standard currency pairs (EUR/USD, GBP/USD)',
        'Monthly archive full access',
        'Real-time SSE desktop push notifications',
        'Standard broker setups & PDF guides'
      ]
    },
    {
      id: 'PERFECT_SIGNAL_BOX',
      name: 'Perfect Signal Box',
      price: 20,
      period: 'per 30-day cycle',
      popular: true,
      tag: 'INSTITUTIONAL VIP',
      features: [
        'High-volatility signals (XAU/USD Gold, BTC/USD, NAS100)',
        'Multi-tier Take Profit & Trailing Stop zones',
        'Live algorithm commentary & rationale',
        'Full access to all bots & MT4/MT5 templates',
        'Priority execution advisory & admin broadcast stream',
        'VIP real-time execution channel access'
      ]
    }
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-semibold">
          <Zap className="h-3.5 w-3.5" />
          STRUCTURED 30-DAY MEMBERSHIP CYCLES
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
          Institutional Trading Intelligence
        </h1>
        <p className="text-xs text-slate-400 font-mono max-w-lg mx-auto leading-relaxed">
          Predictable cycle renewals. Zero automated credit card charges or recurring fees. Direct crypto settlement in USDT.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {PLANS.map((plan) => {
          const isCurrentPlan = user?.plan === plan.id;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 backdrop-blur flex flex-col justify-between transition-all duration-200 relative ${
                plan.popular
                  ? 'border-2 border-blue-500/80 bg-gradient-to-b from-[#0F172A] to-[#0A0E1A] shadow-glow-blue'
                  : 'border border-border bg-card hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full bg-blue-600 text-[10px] font-mono font-bold tracking-wider text-white shadow-glow-blue">
                  MOST POPULAR DESK
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">
                        {plan.tag}
                      </span>
                      <h3 className="text-2xl font-bold text-white font-sans mt-0.5">{plan.name}</h3>
                    </div>
                    {isCurrentPlan && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        ACTIVE PLAN
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-5 font-mono">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white tabular-nums">${plan.price}</span>
                    <span className="text-xs text-slate-400">USDT / 30-day cycle</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-3">
                    Package Inclusions
                  </div>
                  <ul className="space-y-3 text-xs text-slate-300 font-mono">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-2.5 w-2.5 text-emerald-400" />
                        </div>
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!user) {
                    onOpenAuth();
                  } else {
                    setSelectedPlan(plan);
                    setSubmitted(false);
                    setTxid('');
                  }
                }}
                className={`mt-8 w-full py-3.5 rounded-2xl font-semibold text-xs font-mono transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow-blue'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-border'
                }`}
              >
                {!user ? 'Sign In to Subscribe' : isCurrentPlan ? 'Extend 30-Day Cycle' : `Enroll in ${plan.name}`}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Risk Notice */}
      <div className="p-5 rounded-2xl border border-border bg-[#05070D] text-xs text-slate-400 font-mono flex items-start gap-3 shadow-inner">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Regulatory Risk Disclaimer: Algorithmic trading and foreign exchange execution carry significant risk of capital loss. Past algorithmic performance does not guarantee future results. Signals provided are for institutional educational purposes.
        </p>
      </div>

      {/* USDT Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2.5 font-sans">
                <CreditCard className="h-5 w-5 text-blue-400" />
                USDT Checkout · {selectedPlan.name}
              </h3>
              <button 
                onClick={() => setSelectedPlan(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-6 space-y-4 font-mono">
                <div className="relative inline-flex mb-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
                  <CheckCircle2 className="h-14 w-14 text-emerald-400 relative" />
                </div>
                <h3 className="text-xl font-bold text-white font-sans">Payment Submitted for Verification</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Your TXID has been logged. The desk admin validates transactions across blockchain explorers within 5-15 minutes, which instantly activates your 30-day membership access.
                </p>
                <div className="p-3.5 rounded-xl border border-border bg-[#05070D] text-xs text-slate-300 font-mono break-all select-all">
                  TXID: {txid}
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-5 font-mono text-xs">
                {/* Network Picker */}
                <div>
                  <label className="block text-slate-400 mb-2 font-semibold">Select Settlement Network</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setNetwork(net)}
                        className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                          network === net
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-glow-blue'
                            : 'border-border bg-[#05070D] text-slate-400 hover:text-white'
                        }`}
                      >
                        {net.replace('USDT-', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount to send */}
                <div className="p-4 rounded-2xl border border-border bg-[#05070D] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Exact Amount to Transfer</div>
                    <div className="text-2xl font-bold text-white mt-0.5 tabular-nums">${selectedPlan.price}.00 USDT</div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                    Zero Fees
                  </span>
                </div>

                {/* Deposit Address Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Official Deposit Address ({network})</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied!' : 'Copy Address'}
                    </button>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-[#05070D] text-slate-200 break-all select-all font-mono text-[11px] leading-relaxed">
                    {WALLETS[network]}
                  </div>
                </div>

                {/* TXID Submission Form */}
                <form onSubmit={handleSubmitTxid} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Transaction Hash / TXID
                    </label>
                    <input
                      type="text"
                      required
                      value={txid}
                      onChange={(e) => setTxid(e.target.value)}
                      placeholder="Paste your blockchain transaction hash here..."
                      className="w-full rounded-xl border border-border bg-[#05070D] px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-glow-emerald transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Confirming On-Chain Record...' : 'Submit Payment for Immediate Verification'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
