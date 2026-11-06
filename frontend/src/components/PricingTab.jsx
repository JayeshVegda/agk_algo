import React, { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import {
  Check, ShieldAlert, CreditCard, Copy, CheckCircle2,
  Lock, Zap, ArrowRight, ShieldCheck, X, Timer, Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import QRCode from 'qrcode';
import { useWallets, walletsToMap, getPlans, useSiteSettings } from '../lib/wallets';

export function PricingTab({ user, onOpenAuth, onNavigateSignals, onNavigate, notify }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [network, setNetwork] = useState('');
  const [txid, setTxid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletQr, setWalletQr] = useState('');
  const [myPayments, setMyPayments] = useState([]);

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

  const walletList = useWallets();
  const WALLETS = walletsToMap(walletList);

  useEffect(() => {
    if (WALLETS && !WALLETS[network]) setNetwork(Object.keys(WALLETS)[0] || '');
  }, [network, WALLETS]);

  const currentAddress = WALLETS[network];
  const uploadedQr = walletList.find((w) => w.label === network)?.qr_image;
  const qrSrc = uploadedQr || walletQr;
  useEffect(() => {
    if (!currentAddress || uploadedQr) { setWalletQr(''); return; }
    QRCode.toDataURL(currentAddress, { width: 220, margin: 1, color: { dark: '#0C1619E6', light: '#FFFFFF' } })
      .then(setWalletQr)
      .catch(() => setWalletQr(''));
  }, [currentAddress, uploadedQr]);

  useEffect(() => {
    if (!selectedPlan) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedPlan(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPlan]);

  const handleCopy = () => {
    navigator.clipboard.writeText(WALLETS[network]);
    setCopied(true);
    if (notify) {
      notify({
        type: 'copy',
        title: 'Wallet address copied',
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
    if (!/^[a-zA-Z0-9]{20,128}$/.test(txid.trim())) {
      if (notify) {
        notify({
          type: 'error',
          title: 'Invalid TXID',
          message: 'A transaction hash is 64 hexadecimal characters. Paste the full hash from your wallet.'
        });
      }
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
          title: 'Transaction submitted',
          message: 'Payment TXID submitted for automated ledger verification'
        });
      }
    } catch (err) {
      if (notify) {
        notify({
          type: 'error',
          title: 'Submission error',
          message: err.message || 'Check connection'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const settings = useSiteSettings();
  const PLANS = getPlans(settings);


  const now = Date.now();
  const expiry = user?.cycle_expires_at ? new Date(String(user.cycle_expires_at).replace(' ', 'T')).getTime() : null;
  const isActive = expiry && expiry > now;
  const daysLeft = isActive ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : 0;
  const pendingPlans = new Set(
    myPayments.filter((p) => p.status === 'pending' && !p.plan?.startsWith('BOT:')).map((p) => p.plan)
  );

  const planCta = (plan) => {
    if (!user) return { label: `Select ${plan.name}`, icon: 'arrow', action: 'checkout' };
    if (pendingPlans.has(plan.id)) {
      return { label: 'Verification in Progress', icon: 'timer', action: 'none', disabled: true };
    }
    if (isActive && user.plan === plan.id) {
      return { label: 'Buy Next Month', icon: 'credit', action: 'checkout' };
    }
    if (isActive) {
      return { label: `Switch to ${plan.name}`, icon: 'arrow', action: 'checkout' };
    }
    return { label: `Select ${plan.name}`, icon: 'arrow', action: 'checkout' };
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto font-sans text-akg-text">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Badge variant="emerald" className="gap-1.5 py-1 px-3 text-xs">
            <Zap className="h-3.5 w-3.5" />
            <span>Structured 30-Day Cycles</span>
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-akg-text tracking-tight font-display">
          Signal Subscriptions and Memberships
        </h1>
        <p className="text-sm text-akg-muted max-w-lg mx-auto leading-relaxed">
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
              className={`flex flex-col justify-between transition-all bg-akg-card ${
                plan.popular
                  ? 'border-akg-accent/50 ring-1 ring-akg-accent/20 shadow-sm'
                  : 'border-akg-hairline hover:border-akg-hairline/80'
              }`}
            >
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.popular ? 'emerald' : 'secondary'}>
                      {plan.tag}
                    </Badge>
                    {isCurrentPlan ? (
                      <span className="text-xs font-semibold text-akg-green flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        <Check className="h-3 w-3" /> Your Plan: {daysLeft}d left
                      </span>
                    ) : hasPending && user ? (
                      <span className="text-xs font-semibold text-amber-500 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        <Timer className="h-3 w-3" /> Pending Verification
                      </span>
                    ) : null}
                  </div>

                  <CardTitle className="mt-3 text-2xl font-bold text-akg-text">
                    {plan.name}
                  </CardTitle>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tabular-nums text-akg-text">${plan.price}</span>
                    <span className="text-xs text-akg-accent font-bold">USDT</span>
                    <span className="text-xs text-akg-muted ml-1">/ {plan.period}</span>
                  </div>

                  <CardDescription className="mt-2 text-xs text-akg-muted">
                    Fixed cycle duration. Extend or pause manually anytime.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <div className="text-[10px] font-mono font-semibold text-akg-muted uppercase tracking-wider mb-2">
                    Included Benefits
                  </div>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-akg-text">
                      <Check className="h-4 w-4 text-akg-green shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </div>

              <CardFooter className="pt-6 border-t border-akg-hairline mt-6 space-y-2">
                {isCurrentPlan && (
                  <div className="text-[10px] text-akg-muted leading-relaxed">
                    Your cycle ends <b className="text-akg-text">{new Date(expiry).toLocaleDateString()}</b>. Buying now stacks
                    30 more days on top, with no gap in access.
                  </div>
                )}
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  disabled={cta.disabled}
                  onClick={() => {
                    if (cta.action === 'none') return;
                    sessionStorage.setItem('akg_order', JSON.stringify({
                      kind: 'plan', id: plan.id, name: plan.name, price: plan.price,
                    }));
                    if (onNavigate) onNavigate('checkout');
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
      <div className="p-4 rounded-xl border border-akg-hairline bg-akg-card text-xs text-akg-muted flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-akg-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Regulatory Risk Disclaimer: Algorithmic trading and foreign exchange execution carry significant risk of capital loss. Past algorithmic performance does not guarantee future results. Signals provided are for educational and analytical purposes.
        </p>
      </div>

      {/* USDT Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl bg-akg-card border border-akg-hairline max-h-[92vh] flex flex-col overflow-hidden my-auto rounded-xl">
            <CardHeader className="p-4 sm:p-6 pb-3 border-b border-akg-hairline shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-akg-text">
                  <CreditCard className="h-5 w-5 text-akg-accent" />
                  USDT Checkout · {selectedPlan.name}
                </CardTitle>
                <CardDescription className="mt-1 text-akg-muted">
                  {isActive && user?.plan === selectedPlan.id
                    ? 'Renewal: 30 days will be added on top of your current cycle end date.'
                    : 'Transfer exact USDT amount to the official deposit address.'}
                </CardDescription>
              </div>
              <button 
                onClick={() => setSelectedPlan(null)} 
                className="text-akg-muted hover:text-akg-text p-1 rounded-md cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
              {submitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-emerald-500/15 text-akg-green flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-akg-text">Payment Submitted for Verification</h3>
                  <p className="text-xs text-akg-muted leading-relaxed max-w-sm mx-auto">
                    Your TXID has been logged. Transactions are verified on-chain to activate your 30-day membership access.
                  </p>
                  <div className="p-3 rounded-lg border border-akg-hairline bg-akg-raised text-xs font-mono text-akg-accent break-all select-all">
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
                      className="w-full sm:w-auto text-xs font-semibold"
                    >
                      Open Signals Terminal →
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {!user && (
                    <div className="p-3 rounded-lg border border-akg-accent/30 bg-akg-accent/10 flex items-center justify-between text-xs">
                      <span className="text-akg-text">Sign in to bind this subscription to your email</span>
                      <Button size="sm" onClick={onOpenAuth} className="font-semibold text-xs h-7">
                        Sign In / Register
                      </Button>
                    </div>
                  )}

                  {/* Network Picker */}
                  <div>
                    <label className="block text-akg-text font-semibold mb-1.5">Select Settlement Network</label>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, Object.keys(WALLETS).length))}, minmax(0, 1fr))` }}>
                      {Object.entries(WALLETS).map(([net, address]) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setNetwork(net)}
                          className={`py-2 px-3 rounded-lg border text-center transition-all cursor-pointer font-semibold ${
                            network === net
                              ? 'border-akg-accent bg-akg-accent/15 text-akg-accent'
                              : 'border-akg-hairline bg-akg-raised text-akg-muted hover:text-akg-text'
                          }`}
                        >
                          {net.replace(/^USDT[-_ ]?/, '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount to send */}
                  <div className="p-3.5 rounded-lg border border-akg-hairline bg-akg-raised flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-akg-muted uppercase tracking-wider font-mono">Exact Amount to Transfer</div>
                      <div className="text-2xl font-bold text-akg-text mt-0.5 tabular-nums">${selectedPlan.price}.00 USDT</div>
                    </div>
                    <Badge variant="emerald">
                      Zero Fees
                    </Badge>
                  </div>

                  {/* Deposit Address Box */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-akg-text font-semibold">Official Deposit Address ({network})</span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="text-akg-accent hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                     <div className="p-3 rounded-lg border border-akg-hairline bg-akg-raised text-akg-accent break-all select-all font-mono text-xs">
                       {WALLETS[network]}
                     </div>
                     {qrSrc && (
                       <div className="flex justify-center pt-1">
                         <div className="rounded-lg border border-akg-hairline bg-white p-2">
                           <img src={qrSrc} alt={`${network} deposit QR`} className="h-32 w-32 object-contain" />
                         </div>
                       </div>
                     )}
                  </div>

                  {/* TXID Submission Form */}
                  <form onSubmit={handleSubmitTxid} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-akg-text font-semibold mb-1">
                        Transaction Hash / TXID
                      </label>
                      <input
                        type="text"
                        required
                        value={txid}
                        onChange={(e) => setTxid(e.target.value)}
                        placeholder="Paste your blockchain transaction hash here..."
                        className="w-full rounded-lg border border-akg-hairline bg-akg-raised px-3 py-2 text-akg-text placeholder:text-akg-muted focus:border-akg-accent focus:outline-none text-xs"
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
