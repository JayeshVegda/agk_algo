import React, { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import {
  Check, ShieldAlert, CreditCard, Copy, CheckCircle2,
  Lock, Zap, ArrowRight, ShieldCheck, X, Timer, Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function PricingTab({ user, onOpenAuth, onNavigateSignals, notify }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [network, setNetwork] = useState('USDT-TRC20');
  const [txid, setTxid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myPayments, setMyPayments] = useState([]);

  // The member's own ledger drives the state-aware CTAs (current plan badge,
  // pending-verification state, renew vs subscribe).
  const loadMyPayments = useCallback(async () => {
    if (!user?.email) { setMyPayments([]); return; }
    try {
      const records = await pb.collection('payments').getFullList({
        filter: `user_email = "${user.email}"`,
        sort: '-created'
      });
      setMyPayments(records);
    } catch {
      setMyPayments([]);
    }
  }, [user?.email]);

  useEffect(() => {
    loadMyPayments();
    if (!user?.email) return;
    const unsub = pb.collection('payments').subscribe('*', () => loadMyPayments()).catch(() => {});
    return () => { unsub?.then?.((u) => u && u()); };
  }, [user?.email, loadMyPayments]);

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
      if (notify) {
        notify({
          type: 'info',
          title: 'Sign In Required',
          message: 'Please sign in or create an account to start your subscription.'
        });
      }
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

  // ---- Membership state (drives state-aware CTAs) -------------------------
  const now = Date.now();
  const expiry = user?.cycle_expires_at ? new Date(String(user.cycle_expires_at).replace(' ', 'T')).getTime() : null;
  const isActive = expiry && expiry > now;
  const daysLeft = isActive ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : 0;
  const pendingPlans = new Set(
    myPayments.filter((p) => p.status === 'pending' && !p.plan?.startsWith('BOT:')).map((p) => p.plan)
  );

  // Per-plan CTA: what the button should say and do for this member right now.
  const planCta = (plan) => {
    if (!user) return { label: `Select ${plan.name}`, icon: 'arrow', action: 'checkout' };
    if (pendingPlans.has(plan.id)) {
      return { label: 'Verification in Progress', icon: 'timer', action: 'none', disabled: true };
    }
    if (isActive && user.plan === plan.id) {
      return { label: 'Buy Next Month (+30 Days)', icon: 'credit', action: 'checkout' };
    }
    if (isActive) {
      return { label: `Switch to ${plan.name}`, icon: 'arrow', action: 'checkout' };
    }
    return { label: `Select ${plan.name}`, icon: 'arrow', action: 'checkout' };
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto font-sans text-[#E7E9EF]">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Badge variant="gold" className="gap-1.5 py-1 px-3 text-xs">
            <Zap className="h-3.5 w-3.5" />
            <span>Structured 30-Day Cycles</span>
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Signal Subscriptions & Memberships
        </h1>
        <p className="text-sm text-[#A6ADB9] max-w-lg mx-auto leading-relaxed">
          Predictable cycle renewals. Zero automated credit card charges or recurring fees. Direct crypto settlement in USDT.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {PLANS.map((plan) => {
          const isCurrentPlan = user?.plan === plan.id && isActive;
          const cta = planCta(plan);
          const hasPending = pendingPlans.has(plan.id);

          return (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between transition-all bg-[#10141B] ${
                plan.popular
                  ? 'border-[#F3C653] ring-1 ring-[#F3C653]/30 shadow-xl shadow-[#F3C653]/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.popular ? 'gold' : 'secondary'}>
                      {plan.tag}
                    </Badge>
                    {isCurrentPlan ? (
                      <span className="text-xs font-bold text-[#00D878] flex items-center gap-1 bg-[#00D878]/10 border border-[#00D878]/30 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Your Plan — {daysLeft}d left
                      </span>
                    ) : hasPending && user ? (
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                        <Timer className="h-3 w-3" /> Pending Verification
                      </span>
                    ) : null}
                  </div>

                  <CardTitle className="mt-3 text-2xl font-bold text-white">
                    {plan.name}
                  </CardTitle>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tabular-nums">${plan.price}</span>
                    <span className="text-xs text-[#F3C653] font-bold">USDT</span>
                    <span className="text-xs text-[#A6ADB9] ml-1">/ {plan.period}</span>
                  </div>

                  <CardDescription className="mt-2 text-xs text-[#A6ADB9]">
                    Fixed cycle duration. Extend or pause manually anytime.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <div className="text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider mb-2">
                    Included Benefits
                  </div>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#E7E9EF]">
                      <Check className="h-4 w-4 text-[#00D878] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </div>

              <CardFooter className="pt-6 border-t border-white/10 mt-6 space-y-2">
                {isCurrentPlan && (
                  <div className="text-[10px] text-[#A6ADB9] leading-relaxed">
                    Your cycle ends <b className="text-[#E7E9EF]">{new Date(expiry).toLocaleDateString()}</b>. Buying now stacks
                    30 more days on top — no gap in access.
                  </div>
                )}
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  disabled={cta.disabled}
                  onClick={() => {
                    if (cta.action === 'none') return;
                    if (!user) { onOpenAuth(); return; }
                    setSelectedPlan(plan);
                    setSubmitted(false);
                    setTxid('');
                  }}
                  className="w-full justify-center gap-2"
                >
                  {cta.icon === 'timer' && <Timer className="h-4 w-4" />}
                  {cta.icon === 'credit' && <CreditCard className="h-4 w-4" />}
                  {cta.icon === 'arrow' && <ArrowRight className="h-4 w-4" />}
                  <span>{cta.label}</span>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Risk Notice */}
      <div className="p-4 rounded-2xl border border-white/10 bg-[#10141B] text-xs text-[#A6ADB9] flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-[#F3C653] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Regulatory Risk Disclaimer: Algorithmic trading and foreign exchange execution carry significant risk of capital loss. Past algorithmic performance does not guarantee future results. Signals provided are for educational and analytical purposes.
        </p>
      </div>

      {/* USDT Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl bg-[#10141B] border border-white/10 max-h-[92vh] flex flex-col overflow-hidden my-auto">
            <CardHeader className="p-4 sm:p-6 pb-3 border-b border-white/10 shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <CreditCard className="h-5 w-5 text-[#F3C653]" />
                  USDT Checkout · {selectedPlan.name}
                </CardTitle>
                <CardDescription className="mt-1 text-[#A6ADB9]">
                  {isActive && user?.plan === selectedPlan.id
                    ? 'Renewal: 30 days will be added on top of your current cycle end date.'
                    : 'Transfer exact USDT amount to the official deposit address.'}
                </CardDescription>
              </div>
              <button 
                onClick={() => setSelectedPlan(null)} 
                className="text-[#A6ADB9] hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
              {submitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-[#00D878]/15 text-[#00D878] flex items-center justify-center mx-auto border border-[#00D878]/30">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Payment Submitted for Verification</h3>
                  <p className="text-xs text-[#A6ADB9] leading-relaxed max-w-sm mx-auto">
                    Your TXID has been logged. Transactions are verified on-chain to activate your 30-day membership access.
                  </p>
                  <div className="p-3 rounded-xl border border-white/10 bg-[#07090D] text-xs font-mono text-[#F3C653] break-all select-all">
                    TXID: {txid}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
                    <Button
                      onClick={() => setSelectedPlan(null)}
                      variant="outline"
                      className="w-full sm:w-auto text-xs"
                    >
                      Return to Dashboard
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedPlan(null);
                        if (onNavigateSignals) onNavigateSignals();
                      }}
                      className="w-full sm:w-auto bg-[#00D878] text-[#07090D] hover:bg-[#00F09A] font-bold text-xs"
                    >
                      Open Signals Terminal →
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {!user && (
                    <div className="p-3 rounded-xl border border-[#F3C653]/30 bg-[#F3C653]/10 flex items-center justify-between text-xs">
                      <span className="text-[#E7E9EF]">Sign in to bind this subscription to your email</span>
                      <Button size="sm" onClick={onOpenAuth} className="font-bold text-xs h-7">
                        Sign In / Register
                      </Button>
                    </div>
                  )}

                  {/* Network Picker */}
                  <div>
                    <label className="block text-[#E7E9EF] font-semibold mb-1.5">Select Settlement Network</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'].map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setNetwork(net)}
                          className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                            network === net
                              ? 'border-[#F3C653] bg-[#F3C653]/15 text-[#F3C653]'
                              : 'border-white/10 bg-white/5 text-[#A6ADB9] hover:bg-white/10'
                          }`}
                        >
                          {net.replace('USDT-', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount to send */}
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#A6ADB9] uppercase tracking-wider font-semibold">Exact Amount to Transfer</div>
                      <div className="text-2xl font-bold text-white mt-0.5 tabular-nums">${selectedPlan.price}.00 USDT</div>
                    </div>
                    <Badge variant="positive">
                      Zero Fees
                    </Badge>
                  </div>

                  {/* Deposit Address Box */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#E7E9EF] font-semibold">Official Deposit Address ({network})</span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="text-[#F3C653] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-xl border border-white/10 bg-[#07090D] text-[#F3C653] break-all select-all font-mono text-xs">
                      {WALLETS[network]}
                    </div>
                  </div>

                  {/* TXID Submission Form */}
                  <form onSubmit={handleSubmitTxid} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[#E7E9EF] font-semibold mb-1">
                        Transaction Hash / TXID
                      </label>
                      <input
                        type="text"
                        required
                        value={txid}
                        onChange={(e) => setTxid(e.target.value)}
                        placeholder="Paste your blockchain transaction hash here..."
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-[#A6ADB9] focus:border-[#F3C653] focus:outline-none text-xs"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full justify-center gap-2 font-bold"
                      >
                        <span>{submitting ? 'Confirming...' : 'Submit Payment for Desk Verification'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
