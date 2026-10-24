import React, { useState } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Check, ShieldAlert, CreditCard, Copy, CheckCircle2, 
  Lock, Zap, ArrowRight, ShieldCheck, X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

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
    <div className="space-y-10 max-w-5xl mx-auto font-sans text-slate-800">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Badge variant="default" className="gap-1.5 py-1 px-3 text-xs">
            <Zap className="h-3.5 w-3.5" />
            <span>Structured 30-Day Cycles</span>
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Signal Subscriptions & Memberships
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Predictable cycle renewals. Zero automated credit card charges or recurring fees. Direct crypto settlement in USDT.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {PLANS.map((plan) => {
          const isCurrentPlan = user?.plan === plan.id;

          return (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'border-emerald-500 ring-1 ring-emerald-500/20 shadow-md'
                  : 'hover:border-slate-300'
              }`}
            >
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.popular ? 'default' : 'secondary'}>
                      {plan.tag}
                    </Badge>
                    {isCurrentPlan && (
                      <Badge variant="success">
                        Active Plan
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-3 text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tabular-nums">
                      ${plan.price}
                    </span>
                    <span className="text-xs text-slate-500">USDT / 30-day cycle</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Package Inclusions
                  </div>
                  <ul className="space-y-3 text-xs text-slate-600">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </div>

              <CardFooter className="pt-6 border-t border-slate-100">
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => {
                    if (!user) {
                      onOpenAuth();
                    } else {
                      setSelectedPlan(plan);
                      setSubmitted(false);
                      setTxid('');
                    }
                  }}
                  className="w-full justify-center gap-2"
                >
                  <span>{!user ? 'Sign In to Subscribe' : isCurrentPlan ? 'Extend 30-Day Cycle' : `Enroll in ${plan.name}`}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Risk Notice */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Regulatory Risk Disclaimer: Algorithmic trading and foreign exchange execution carry significant risk of capital loss. Past algorithmic performance does not guarantee future results. Signals provided are for educational and analytical purposes.
        </p>
      </div>

      {/* USDT Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl space-y-4">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  USDT Checkout · {selectedPlan.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  Transfer exact USDT amount to the official deposit address.
                </CardDescription>
              </div>
              <button 
                onClick={() => setSelectedPlan(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4">
              {submitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Payment Submitted for Verification</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    Your TXID has been logged. Transactions are verified on-chain within 5-15 minutes to activate your 30-day membership access.
                  </p>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-700 break-all select-all">
                    TXID: {txid}
                  </div>
                  <Button
                    onClick={() => setSelectedPlan(null)}
                    className="mt-2"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {/* Network Picker */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">Select Settlement Network</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'].map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setNetwork(net)}
                          className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer font-bold ${
                            network === net
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {net.replace('USDT-', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount to send */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Exact Amount to Transfer</div>
                      <div className="text-2xl font-bold text-slate-900 mt-0.5 tabular-nums">${selectedPlan.price}.00 USDT</div>
                    </div>
                    <Badge variant="default">
                      Zero Fees
                    </Badge>
                  </div>

                  {/* Deposit Address Box */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-semibold">Official Deposit Address ({network})</span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 break-all select-all font-mono text-xs">
                      {WALLETS[network]}
                    </div>
                  </div>

                  {/* TXID Submission Form */}
                  <form onSubmit={handleSubmitTxid} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Transaction Hash / TXID
                      </label>
                      <input
                        type="text"
                        required
                        value={txid}
                        onChange={(e) => setTxid(e.target.value)}
                        placeholder="Paste your blockchain transaction hash here..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none text-xs"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full justify-center gap-2"
                    >
                      <span>{submitting ? 'Confirming...' : 'Submit Payment for Verification'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
