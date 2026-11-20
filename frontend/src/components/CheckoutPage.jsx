import React, { useEffect, useState } from 'react';
import { pb } from '../lib/pocketbase';
import { useCheckoutConfig } from '../lib/wallets';
import QRCode from 'qrcode';
import {
  ShieldCheck, Copy, Check, ArrowLeft, Bitcoin, Smartphone,
  LifeBuoy, Info, Clock, KeyRound,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cycleDay, useSignalSchedule } from '../lib/signalCycles';
import { cn, formatUsdt } from '../lib/utils';

function usePaymentQr(value) {
  const [qr, setQr] = useState(null);
  useEffect(() => {
    if (!value) return;
    let alive = true;
    QRCode.toDataURL(value, { width: 220, margin: 2 })
      .then((url) => { if (alive) setQr({ value, url }); })
      .catch(() => { if (alive) setQr(null); });
    return () => { alive = false; };
  }, [value]);
  return qr?.value === value ? qr.url : null;
}

export function CheckoutPage({ user, onOpenAuth, onNavigate, notify }) {
  const { status: configStatus, settings, wallets, retry } = useCheckoutConfig();
  const walletList = settings.crypto_enabled ? wallets : [];
  const [order] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('akg_order'));
    } catch {
      return null;
    }
  });
  const { data: schedule, status: scheduleStatus, retry: retrySchedule } = useSignalSchedule(user?.id || '', order?.kind === 'plan');
  const [currentBot, setCurrentBot] = useState(null);
  const [botStatus, setBotStatus] = useState('loading');
  const [botAttempt, setBotAttempt] = useState(0);
  const [chosenMethod, setMethod] = useState(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const cryptoAvailable = walletList.length > 0;
  const method = chosenMethod ?? (cryptoAvailable ? 'crypto' : 'upi');
  const [network, setNetwork] = useState('');
  const [recoveryNetwork, setRecoveryNetwork] = useState(null);
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const [done, setDone] = useState(false);
  const selectedWallet = walletList.find((wallet) => wallet.label === network);
  const walletAddress = selectedWallet?.address;

  useEffect(() => {
    if (order?.kind !== 'bot') return;
    let alive = true;
    pb.collection('bots').getOne(order.id, { fields: 'id,name,platform,price,is_live' })
      .then((bot) => {
        if (!alive) return;
        setCurrentBot(bot);
        setBotStatus('ready');
      })
      .catch((error) => {
        if (alive) setBotStatus(error.status === 404 ? 'unavailable' : 'error');
      });
    return () => { alive = false; };
  }, [order, botAttempt]);

  useEffect(() => {
    if (walletList.length && !walletList.some((w) => w.label === network)) {
      setNetwork(walletList[0].label);
    }
  }, [walletList, network]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(''), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  const inr = settings.inr_enabled && settings.usdt_inr_rate > 0 && order
    ? Math.round(order.price * settings.usdt_inr_rate)
    : 0;
  const upiId = settings.upi_id?.trim();
  const upiAvailable = Boolean(settings.inr_enabled && upiId && inr > 0);
  const upiLink = upiAvailable ? `upi://pay?${new URLSearchParams({
    pa: upiId,
    ...(settings.payee_name ? { pn: settings.payee_name } : {}),
    am: String(inr),
    cu: 'INR',
    tn: 'AKG ALGO order',
  })}` : '';
  const qrSrc = usePaymentQr(method === 'upi' ? upiLink : walletAddress);

  if (!order) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <Info className="mx-auto h-8 w-8 text-akg-muted" />
        <h1 className="mt-4 font-display text-xl font-bold text-akg-text">No pending order</h1>
        <p className="mt-2 text-sm text-akg-muted">Pick a plan or an Expert Advisor first, then check out here.</p>
        <div className="mt-6 flex justify-center gap-2.5">
          <Button variant="outline" onClick={() => onNavigate('home')}>Home</Button>
          <Button onClick={() => onNavigate('pricing')}>View Plans</Button>
        </div>
      </div>
    );
  }

  const checkoutOptions = schedule?.checkoutOptions || (schedule?.checkout ? [schedule.checkout] : []);
  const cycle = checkoutOptions.find(({ id }) => id === order.cycleId);
  const currentPrice = order.id === 'SR_SIGNAL_BOX' ? cycle?.srPrice : cycle?.vipPrice;
  const timestamp = (value) => Date.parse(String(value || '').replace(' ', 'T'));
  const cycleChanged = order.kind === 'plan' && Boolean(order.cycleId) &&
    scheduleStatus === 'ready' && (!cycle || currentPrice !== order.price ||
      timestamp(cycle.startsAt) !== timestamp(order.startsAt) || timestamp(cycle.endsAt) !== timestamp(order.endsAt));
  const botChanged = order.kind === 'bot' && (botStatus === 'unavailable' ||
    (botStatus === 'ready' && (!currentBot?.is_live || Number(currentBot.price) !== Number(order.price) ||
      currentBot.name !== order.name || currentBot.platform !== order.platform)));
  const needsReview = cycleChanged || botChanged;

  if (!done && order.kind === 'plan') {
    if (scheduleStatus === 'loading') {
      return <p role="status" className="mx-auto max-w-lg py-16 text-center text-sm text-akg-muted">Checking your signal cycle and price…</p>;
    }
    if (scheduleStatus === 'error' && !alreadyPaid) {
      return (
        <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
          <p role="alert" className="text-sm text-akg-muted">We couldn’t verify this cycle. Try again before sending payment.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={retrySchedule}>Try again</Button>
            <Button variant="outline" onClick={() => setAlreadyPaid(true)}>I already paid</Button>
          </div>
        </div>
      );
    }
    if (!order.cycleId) {
      return (
        <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
          <p role="status" className="text-sm text-akg-muted">Choose a signal cycle from Pricing before paying.</p>
          <Button onClick={() => onNavigate('pricing')}>Back to Pricing</Button>
        </div>
      );
    }
  }

  const amount = formatUsdt(order.price);
  const isBot = order.kind === 'bot';
  const priceReady = isBot ? botStatus === 'ready' : scheduleStatus === 'ready';
  const selectedNetwork = method === 'upi' ? 'INR-UPI' : network;
  const submittingForReview = needsReview || alreadyPaid;
  const paidNetwork = submittingForReview ? (recoveryNetwork ?? '') : selectedNetwork;
  const paidMethod = paidNetwork === 'INR-UPI' ? 'upi' : 'crypto';
  const canPay = submittingForReview ? Boolean(paidNetwork) : priceReady && configStatus === 'ready' && (method === 'upi' ? upiAvailable : Boolean(walletAddress));

  const copy = async (text, key) => {
    if (!text) return;
    setCopied('');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      notify?.({ type: 'error', title: 'Could not copy', message: 'Select and copy the payment address manually.' });
    }
  };

  const submit = async () => {
    if (!canPay || busy) return;
    if (!ref.trim()) {
      notify?.({ type: 'error', title: 'Reference missing', message: 'Paste your transaction hash or UPI reference (UTR).' });
      return;
    }
    const refOk = paidMethod === 'upi'
      ? /^[0-9]{8,30}$/.test(ref.trim())
      : /^[a-zA-Z0-9]{20,128}$/.test(ref.trim());
    if (!refOk) {
      notify?.({
        type: 'error',
        title: paidMethod === 'upi' ? 'Invalid UTR' : 'Invalid TXID',
        message: paidMethod === 'upi'
          ? 'Paste the 12-digit UPI reference number from your payment app.'
          : 'Paste the transaction hash from your wallet or block explorer.',
      });
      return;
    }
    if (!user) { onOpenAuth?.(); return; }
    setBusy(true);
    try {
      await pb.collection('payments').create({
        user_email: user.email,
        plan: isBot ? `BOT: ${order.name} (${order.platform || 'EA'})` : order.id,
        amount: order.price,
        ...(isBot ? { bot_id: order.id } : { signal_cycle: order.cycleId, starts_at: order.startsAt, ends_at: order.endsAt }),
        ...(submittingForReview ? { already_paid: true } : {}),
        network: paidNetwork,
        method: paidMethod,
        ...(paidMethod === 'upi' ? { inr_amount: inr } : {}),
        txid: ref.trim(),
        status: 'pending',
      });
      setDone(true);
      sessionStorage.removeItem('akg_order');
    } catch (err) {
      notify?.({ type: 'error', title: 'Submission failed', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------ success ------------------------------ */
  if (done) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10">
          <Clock className="h-7 w-7 text-akg-accent" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-akg-text">Order submitted</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-akg-muted">
          The desk verifies {paidMethod === 'upi' ? 'your UPI payment (UTR)' : 'the blockchain transfer'} manually,
          after submission. {isBot ? 'Your license key is issued automatically on approval.' : `When approved, your access follows the ${order.cycleName} schedule.`}
        </p>
        <div className="mt-4 rounded-xl border border-akg-hairline bg-akg-raised px-4 py-3 font-mono text-xs text-akg-accent break-all">
          {paidMethod === 'upi' ? 'UTR' : 'TXID'}: {ref.trim()}
        </div>
        <div className="mt-6 flex justify-center gap-2.5">
          <Button variant="outline" onClick={() => onNavigate('account')}>My Orders</Button>
          <Button onClick={() => onNavigate(isBot ? 'bots' : 'signals')}>
            {isBot ? 'Back to Bots' : 'Signal Room'}
          </Button>
        </div>
        <SupportCard settings={settings} />
      </div>
    );
  }

  if (submittingForReview) {
    return (
      <form className="mx-auto max-w-lg space-y-4 py-10" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <h1 className="font-display text-2xl font-bold">Submit a payment for review</h1>
        <p className="text-sm text-akg-muted">{needsReview ? 'This order or its price changed. If you already paid, send the transfer reference for review.' : 'If you already paid, send the transfer reference so the desk can verify it.'}</p>
        <label className="block space-y-1 text-sm">
          <span>How did you pay?</span>
          <select required value={paidNetwork} onChange={(event) => setRecoveryNetwork(event.target.value)} className="w-full rounded-lg border border-akg-hairline bg-akg-raised p-2">
            <option value="">Choose a method</option>
            <option value="USDT-TRC20">USDT · TRC20</option>
            <option value="USDT-BEP20">USDT · BEP20</option>
            <option value="USDT-ERC20">USDT · ERC20</option>
            <option value="INR-UPI">UPI</option>
            {wallets.filter(({ label }) => !['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'].includes(label))
              .map(({ id, label }) => <option key={id} value={label}>{label}</option>)}
            <option value="OTHER">Other network</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Payment reference</span>
          <input required value={ref} onChange={(event) => setRef(event.target.value)} className="w-full rounded-lg border border-akg-hairline bg-akg-raised p-2" />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || !canPay}>{busy ? 'Submitting…' : 'Send for review'}</Button>
          <Button type="button" variant="outline" onClick={() => needsReview ? onNavigate(isBot ? 'bots' : 'pricing') : setAlreadyPaid(false)}>
            {needsReview ? (isBot ? 'Back to Robots' : 'Back to Signal Plans') : 'Back to checkout'}
          </Button>
        </div>
        <SupportCard settings={settings} />
      </form>
    );
  }

  if (isBot && !priceReady) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        {botStatus === 'loading' ? <p role="status">Checking the current robot price…</p> : (
          <>
            <p role="alert">We couldn’t verify this robot’s price. Please wait before paying.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => { setBotStatus('loading'); setBotAttempt((value) => value + 1); }}>Try again</Button>
              <Button variant="outline" onClick={() => setAlreadyPaid(true)}>I already paid</Button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (configStatus !== 'ready' || (!cryptoAvailable && !upiAvailable)) {
    const loading = configStatus === 'loading';
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="text-xl font-bold">Checkout</h1>
        <p role={loading ? 'status' : 'alert'} className="text-sm text-akg-muted">
          {loading ? 'Checking payment methods…' : 'Payment instructions are unavailable. Please wait before sending money.'}
        </p>
        {!loading && <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={retry}>Try again</Button>
          <Button variant="outline" onClick={() => setAlreadyPaid(true)}>I already paid</Button>
        </div>}
        <SupportCard settings={settings} />
      </div>
    );
  }

  /* ------------------------------ checkout ------------------------------ */
  return (
    <div className="mx-auto max-w-2xl font-sans text-akg-text">
      <button
        onClick={() => { sessionStorage.removeItem('akg_order'); onNavigate(isBot ? 'bots' : 'pricing'); }}
        className="group mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-akg-muted hover:text-akg-accent cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to {isBot ? 'Robots' : 'Signal Plans'}
      </button>

      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-3xl">Checkout</h1>
      <p className="mt-1.5 text-sm text-akg-muted">Confirm your order, choose how to pay, and submit the reference. Everything is verified by the desk.</p>

      {/* Order summary */}
      <section className="mt-6 rounded-xl border border-akg-hairline bg-akg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="emerald">{isBot ? 'Robot License' : 'Signal Subscription'}</Badge>
            <h2 className="mt-2.5 font-display text-lg font-bold text-akg-text">{order.name}</h2>
            <p className="mt-1 font-mono text-[11px] text-akg-muted">
              {isBot
                ? `${order.platform} · perpetual license · activates automatically on first run`
                : `${order.cycleName || 'Signal cycle'} · ${cycleDay(order.startsAt)} to ${cycleDay(order.endsAt, true)}`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-2xl font-bold text-akg-text tabular-nums">{amount}</div>
            <div className="text-[10px] font-bold text-akg-accent">USDT</div>
            {inr > 0 && settings.display_currency !== 'USD' && (
              <div className="mt-1 rounded-md bg-akg-raised border border-akg-hairline px-2 py-0.5 font-mono text-[11px] text-akg-muted">
                {settings.display_currency === 'INR' ? '' : '≈ '}₹{inr.toLocaleString('en-IN')}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Method selector */}
      <section className="mt-5">
        <h3 className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-akg-muted">Payment method</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => cryptoAvailable && setMethod('crypto')}
            disabled={!cryptoAvailable}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer',
              !cryptoAvailable && 'cursor-not-allowed opacity-40',
              method === 'crypto' && cryptoAvailable ? 'border-akg-accent bg-akg-accent/[0.08] ring-1 ring-akg-accent/30' : 'border-akg-hairline bg-akg-card hover:border-akg-hairline/80'
            )}
          >
            <Bitcoin className="h-5 w-5 shrink-0 text-akg-accent" />
            <div>
              <div className="text-sm font-bold text-akg-text">Crypto · USDT</div>
              <div className="text-[11px] text-akg-muted">{cryptoAvailable ? 'Choose a network' : 'Unavailable'}</div>
            </div>
          </button>
          <button
            onClick={() => upiAvailable && setMethod('upi')}
            disabled={!upiAvailable}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer',
              !upiAvailable && 'cursor-not-allowed opacity-40',
              method === 'upi' && upiAvailable ? 'border-akg-accent bg-akg-accent/[0.08] ring-1 ring-akg-accent/30' : 'border-akg-hairline bg-akg-card hover:border-akg-hairline/80'
            )}
          >
            <Smartphone className="h-5 w-5 shrink-0 text-akg-green" />
            <div>
              <div className="text-sm font-bold text-akg-text">GPay / UPI</div>
              <div className="text-[11px] text-akg-muted">{upiAvailable ? `₹${inr.toLocaleString('en-IN')} instant` : 'unavailable'}</div>
            </div>
          </button>
        </div>
      </section>

      {/* Method detail */}
      {method === 'crypto' && cryptoAvailable && (
        <section className="mt-4 space-y-4 rounded-xl border border-akg-hairline bg-akg-card p-5">
          <div>
            <h4 className="mb-2 text-xs font-semibold text-akg-text">1 · Select network</h4>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, walletList.length))}, minmax(0, 1fr))` }}>
              {walletList.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setNetwork(w.label)}
                  className={cn(
                    'h-10 truncate rounded-lg border font-mono text-xs font-semibold transition-all cursor-pointer',
                    network === w.label ? 'border-akg-accent bg-akg-accent/15 text-akg-accent' : 'border-akg-hairline bg-akg-raised text-akg-muted hover:text-akg-text'
                  )}
                >
                  {w.label.replace(/^USDT[-_ ]?/, '')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold text-akg-text">2 · Send exactly {amount} USDT to</h4>
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center">
              <div className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-akg-hairline bg-akg-raised px-3.5 py-2">
                <span className="min-w-0 select-text break-all font-mono text-xs text-akg-accent">{walletAddress || 'No wallet address available'}</span>
                <button type="button" disabled={!walletAddress} aria-label="Copy wallet address"
                  onClick={() => copy(walletAddress, 'wallet')}
                  className="shrink-0 rounded-md p-2 text-akg-muted hover:text-akg-text disabled:opacity-50">
                  {copied === 'wallet' ? <Check aria-hidden className="h-4 w-4 text-akg-green" /> : <Copy aria-hidden className="h-4 w-4" />}
                </button>
              </div>
              {qrSrc && (
                <div className="self-center shrink-0 rounded-lg border border-akg-hairline bg-white p-2 sm:self-auto">
                  <img src={qrSrc} alt={`${network} deposit QR`} className="h-32 w-32 object-contain" />
                </div>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-akg-muted">Send only USDT on {network}. Wrong-network transfers cannot be recovered.</p>
          </div>
          <div>
            <label htmlFor="payment-reference" className="mb-2 block text-xs font-semibold text-akg-text">3 · Paste your transaction hash (TXID)</label>
            <input
              id="payment-reference"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="0x… or 64-character hash"
              className="h-11 w-full rounded-lg border border-akg-hairline bg-akg-raised px-3.5 font-mono text-sm text-akg-text placeholder:text-akg-muted/60 focus:border-akg-accent focus:outline-none"
            />
          </div>
        </section>
      )}
      {method === 'upi' && upiAvailable && (
        <section className="mt-4 space-y-4 rounded-xl border border-akg-hairline bg-akg-card p-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qrSrc && (
              <div className="shrink-0 rounded-lg border border-akg-hairline bg-white p-2.5">
                <img src={qrSrc} alt="UPI payment QR code" className="h-40 w-40 object-contain" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-akg-text">Scan and pay exactly</h4>
                <div className="mt-1.5 font-mono text-2xl font-bold text-akg-text">₹{inr.toLocaleString('en-IN')}</div>
                {settings.payee_name && <div className="text-xs text-akg-muted">to {settings.payee_name}</div>}
              </div>
              <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-akg-hairline bg-akg-raised px-3.5 py-2">
                <span className="min-w-0 select-text break-all font-mono text-xs text-akg-green">{upiId}</span>
                <button type="button" disabled={!upiAvailable} aria-label="Copy UPI ID"
                  onClick={() => copy(upiId, 'upi')}
                  className="shrink-0 rounded-md p-2 text-akg-muted hover:text-akg-text disabled:opacity-50">
                  {copied === 'upi' ? <Check aria-hidden className="h-4 w-4 text-akg-green" /> : <Copy aria-hidden className="h-4 w-4" />}
                </button>
              </div>
              {upiAvailable && upiLink && (
                <a
                  href={upiLink}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-akg-green"
                >
                  <Smartphone className="h-4 w-4" /> Open in GPay / any UPI app
                </a>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="payment-reference" className="mb-2 block text-xs font-semibold text-akg-text">Paste the UPI reference (UTR / transaction ID)</label>
            <input
              id="payment-reference"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. 415223698741" inputMode="numeric"
              className="h-11 w-full rounded-lg border border-akg-hairline bg-akg-raised px-3.5 font-mono text-sm text-akg-text placeholder:text-akg-muted/60 focus:border-akg-accent focus:outline-none"
            />
          </div>
        </section>
      )}

      <p role="status" className="sr-only">{copied === 'wallet' ? 'Wallet address copied' : copied === 'upi' ? 'UPI ID copied' : ''}</p>

      {/* What happens next */}
      <section className="mt-5 rounded-xl border border-akg-hairline bg-akg-card p-5">
        <h3 className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-akg-muted">
          <ShieldCheck className="h-4 w-4 text-akg-green" /> What happens next
        </h3>
        <ol className="mt-3 space-y-2.5">
          {[
            <>Submit this form with your {method === 'upi' ? 'UTR' : 'TXID'} reference.</>,
            <>The desk verifies the payment <b className="text-akg-text">manually</b>.</>,
            isBot
              ? <>Your <b className="text-akg-text">license key</b> is issued automatically and appears in My Account with the download.</>
              : <>After approval, your Signal Room access starts on the scheduled date.</>,
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-akg-muted">
              <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 font-mono text-[10px] font-bold text-akg-accent">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </section>

      {settings.checkout_note && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-akg-hairline bg-akg-card px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-akg-accent" />
          <p className="text-[11px] leading-relaxed text-akg-muted">{settings.checkout_note}</p>
        </div>
      )}

      <button
        onClick={submit}
        disabled={busy || !canPay}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-akg-cta text-sm font-bold text-akg-cta-text transition-all active:scale-[0.98] disabled:opacity-50 hover:opacity-90 cursor-pointer shadow-sm"
      >
        <KeyRound className="h-4 w-4" />
        {busy ? 'Submitting...' : !user ? 'Sign in and Submit Order' : `Submit Order · ${amount} USDT${method === 'upi' && inr ? ` / ₹${inr.toLocaleString('en-IN')}` : ''}`}
      </button>

      <button type="button" className="mt-3 min-h-11 px-2 text-sm underline" onClick={() => setAlreadyPaid(true)}>
        I already paid and need help
      </button>
      <SupportCard settings={settings} />
    </div>
  );
}

function SupportCard({ settings }) {
  if (!settings.support_email && !settings.support_phone) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-akg-hairline bg-akg-raised px-5 py-4 text-xs">
      <span className="flex items-center gap-2 font-semibold text-akg-text">
        <LifeBuoy className="h-4 w-4 text-akg-accent" /> Payment issue? Contact the desk
      </span>
      <span className="flex flex-wrap items-center gap-3 font-mono text-akg-muted">
        {settings.support_email && <a href={`mailto:${settings.support_email}`} className="hover:text-akg-accent">{settings.support_email}</a>}
        {settings.support_phone && <a href={`https://t.me/${settings.support_phone.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="hover:text-akg-accent">{settings.support_phone}</a>}
      </span>
    </div>
  );
}
