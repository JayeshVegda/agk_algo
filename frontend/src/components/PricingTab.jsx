import React, { useState } from 'react';
import { pb } from '../lib/pocketbase';
import { Check, ShieldAlert, CreditCard, Copy, CheckCircle2 } from 'lucide-react';

export function PricingTab({ user, onOpenAuth }) {
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
        plan: selectedPlan.name,
        amount: selectedPlan.price,
        network,
        txid,
        status: 'pending'
      });
      setSubmitted(true);
    } catch (err) {
      alert('Error submitting payment: ' + err.message);
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
      features: [
        'High-volatility signals (XAU/USD Gold, BTC/USD, NAS100)',
        'Multi-tier Take Profit & Trailing Stop zones',
        'Live algorithm commentary & rationale',
        'Full access to all bots & MT4/MT5 templates',
        'Priority execution advisory & admin broadcast stream',
        'Private Discord/Telegram VIP channel access'
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-semibold">
          STRUCTURED 30-DAY MEMBERSHIP CYCLES
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Institutional Trading Intelligence</h1>
        <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
          Predictable cycle renewals. Zero automated credit card charges or sneaky recurring fees. Direct crypto settlement in USDT.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl p-8 backdrop-blur flex flex-col justify-between transition-all relative ${
              plan.popular
                ? 'border-2 border-blue-500/80 bg-card/90 shadow-2xl shadow-blue-500/10'
                : 'border border-border/80 bg-card/70 hover:border-border'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-blue-600 text-[10px] font-mono font-bold tracking-wider text-white shadow">
                MOST POPULAR
              </span>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-extrabold font-mono text-white">${plan.price}</span>
                  <span className="text-xs text-slate-400 font-mono">USDT / cycle</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 font-mono">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                } else {
                  setSelectedPlan(plan);
                  setSubmitted(false);
                }
              }}
              className={`mt-8 w-full py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-md ${
                plan.popular
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-border'
              }`}
            >
              {user ? `Enroll in ${plan.name} →` : 'Sign In to Subscribe'}
            </button>
          </div>
        ))}
      </div>

      {/* Risk Notice */}
      <div className="p-4 rounded-xl border border-border/60 bg-[#05080f] text-xs text-slate-400 font-mono flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <p>
          Regulatory Risk Disclaimer: Algorithmic trading and foreign exchange execution carry significant risk of capital loss. Past algorithmic performance does not guarantee future results. Signals provided are for institutional educational purposes.
        </p>
      </div>

      {/* USDT Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-400" />
                USDT Checkout · {selectedPlan.name}
              </h3>
              <button onClick={() => setSelectedPlan(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Payment TXID Submitted!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your transaction has been queued for blockchain confirmation. Your signals desk will unlock as soon as 1 confirmation is received.
                </p>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="mt-3 px-6 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTxid} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Select Transfer Network</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setNetwork(net)}
                        className={`py-2 px-1 rounded-lg border text-center font-bold transition-all ${
                          network === net
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'border-border bg-background text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {net.replace('USDT-', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-background/80 space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase flex justify-between items-center">
                    <span>Deposit {network} Address</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="font-mono text-xs text-slate-200 break-all select-all font-semibold">
                    {WALLETS[network]}
                  </div>
                  <div className="text-[10px] text-emerald-400 pt-1">
                    Exact Amount to Send: <span className="font-bold">${selectedPlan.price} USDT</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Blockchain Transaction Hash (TXID)</label>
                  <input
                    type="text"
                    required
                    value={txid}
                    onChange={(e) => setTxid(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-white"
                    placeholder="e.g. 7f938d827f8a8b..."
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Paste your transaction hash from your wallet after sending.</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Verifying...' : 'Submit TXID for Instant Approval'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
