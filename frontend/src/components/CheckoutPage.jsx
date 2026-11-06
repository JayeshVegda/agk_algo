import React, { useEffect, useState } from 'react';
import { pb } from '../lib/pocketbase';
import { useSiteSettings, useWallets, walletsToMap } from '../lib/wallets';
import QRCode from 'qrcode';
import {
  ShieldCheck, Copy, Check, ArrowLeft, Bitcoin, Smartphone,
  LifeBuoy, Info, Clock, KeyRound,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

export function CheckoutPage({ user, onOpenAuth, onNavigate, notify }) {
  const settings = useSiteSettings();
  const walletList = useWallets();
  const walletMap = walletsToMap(walletList);
  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState('crypto');
  const [network, setNetwork] = useState('');
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const [done, setDone] = useState(false);
  const [walletQr, setWalletQr] = useState('');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('akg_order');
      if (raw) setOrder(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!settings.crypto_enabled && settings.inr_enabled && settings.upi_id) {
      setMethod('upi');
    }
  }, [settings.crypto_enabled, settings.inr_enabled, settings.upi_id]);

  useEffect(() => {
    if (walletList.length && !walletList.some((w) => w.label === network)) {
      setNetwork(walletList[0].label);
    }
  }, [walletList, network]);

  useEffect(() => {
    const address = walletMap[network];
    if (!address) { setWalletQr(''); return; }
    QRCode.toDataURL(address, { width: 220, margin: 1, color: { dark: '#0C1619E6', light: '#FFFFFF' } })
      .then(setWalletQr)
      .catch(() => setWalletQr(''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network, walletList]);

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

  const inr = settings.inr_enabled && settings.usdt_inr_rate > 0
    ? Math.round(order.price * settings.usdt_inr_rate)
    : 0;
  const isBot = order.kind === 'bot';
  const upiLink = settings.upi_id
    ? `upi://pay?pa=${encodeURIComponent(settings.upi_id)}${settings.payee_name ? `&pn=${encodeURIComponent(settings.payee_name)}` : ''}${inr ? `&am=${inr}&cu=INR` : ''}&tn=${encodeURIComponent('AKG ALGO order')}`
    : '';
  const upiAvailable = settings.inr_enabled && settings.upi_id;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const submit = async () => {
    if (!ref.trim()) {
      notify?.({ type: 'error', title: 'Reference missing', message: 'Paste your transaction hash or UPI reference (UTR).' });
      return;
    }
    const refOk = method === 'upi'
      ? /^[0-9]{8,30}$/.test(ref.trim())
      : /^[a-zA-Z0-9]{20,128}$/.test(ref.trim());
    if (!refOk) {
      notify?.({
        type: 'error',
        title: method === 'upi' ? 'Invalid UTR' : 'Invalid TXID',
        message: method === 'upi'
          ? 'Paste the 12-digit UPI reference number from your payment app.'
          : 'A transaction hash is 64 hexadecimal characters.',
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
        network: method === 'upi' ? 'INR-UPI' : network,
        method,
        ...(method === 'upi' ? { inr_amount: inr } : {}),
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
          The desk verifies {method === 'upi' ? 'your UPI payment (UTR)' : 'the blockchain transfer'} manually,
          usually within a few hours. {isBot ? 'Your license key is issued automatically on approval.' : 'Your 30-day cycle activates automatically on approval.'}
        </p>
        <div className="mt-4 rounded-xl border border-akg-hairline bg-akg-raised px-4 py-3 font-mono text-xs text-akg-accent break-all">
          {method === 'upi' ? 'UTR' : 'TXID'}: {ref.trim()}
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

  /* ------------------------------ checkout ------------------------------ */
  return (
    <div className="mx-auto max-w-2xl font-sans text-akg-text">
      <button
        onClick={() => { sessionStorage.removeItem('akg_order'); onNavigate(isBot ? 'bots' : 'pricing'); }}
        className="group mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-akg-muted hover:text-akg-accent cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to {isBot ? 'Expert Advisors' : 'Plans'}
      </button>

      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-3xl">Checkout</h1>
      <p className="mt-1.5 text-sm text-akg-muted">Confirm your order, choose how to pay, and submit the reference. Everything is verified by the desk.</p>

      {/* Order summary */}
      <section className="mt-6 rounded-xl border border-akg-hairline bg-akg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="emerald">{isBot ? 'Expert Advisor License' : 'Signal Subscription'}</Badge>
            <h2 className="mt-2.5 font-display text-lg font-bold text-akg-text">{order.name}</h2>
            <p className="mt-1 font-mono text-[11px] text-akg-muted">
              {isBot
                ? `${order.platform} · perpetual license · activates automatically on first run`
                : '30-day member cycle · full signal coordinates'}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-2xl font-bold text-akg-text tabular-nums">${order.price}</div>
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
        <div className={cn('grid gap-3', settings.crypto_enabled ? 'grid-cols-2' : 'grid-cols-1')}>
          <button
            onClick={() => settings.crypto_enabled && setMethod('crypto')}
            disabled={!settings.crypto_enabled}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer',
              !settings.crypto_enabled && 'cursor-not-allowed opacity-40',
              method === 'crypto' && settings.crypto_enabled ? 'border-akg-accent bg-akg-accent/[0.08] ring-1 ring-akg-accent/30' : 'border-akg-hairline bg-akg-card hover:border-akg-hairline/80'
            )}
          >
            <Bitcoin className="h-5 w-5 shrink-0 text-akg-accent" />
            <div>
              <div className="text-sm font-bold text-akg-text">Crypto · USDT</div>
              <div className="text-[11px] text-akg-muted">{settings.crypto_enabled ? 'TRC20 / BEP20 / ERC20' : 'temporarily unavailable'}</div>
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
      {method === 'crypto' ? (
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
            <h4 className="mb-2 text-xs font-semibold text-akg-text">2 · Send exactly ${order.price}.00 USDT to</h4>
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center">
              <button
                onClick={() => copy(walletMap[network] || '', 'wallet')}
                className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-akg-hairline bg-akg-raised px-3.5 py-3 text-left cursor-pointer"
              >
                <span className="min-w-0 break-all font-mono text-xs text-akg-accent">{walletMap[network] || 'Loading…'}</span>
                {copied === 'wallet' ? <Check className="h-4 w-4 shrink-0 text-akg-green" /> : <Copy className="h-4 w-4 shrink-0 text-akg-muted" />}
              </button>
              {walletQr && (
                <div className="self-center shrink-0 rounded-lg border border-akg-hairline bg-white p-2 sm:self-auto">
                  <img src={walletQr} alt={`${network} deposit QR`} className="h-32 w-32 object-contain" />
                </div>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-akg-muted">Send only USDT on {network}. Wrong-network transfers cannot be recovered.</p>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold text-akg-text">3 · Paste your transaction hash (TXID)</h4>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="0x… or 64-character hash"
              className="h-11 w-full rounded-lg border border-akg-hairline bg-akg-raised px-3.5 font-mono text-sm text-akg-text placeholder:text-akg-muted/60 focus:border-akg-accent focus:outline-none"
            />
          </div>
        </section>
      ) : (
        <section className="mt-4 space-y-4 rounded-xl border border-akg-hairline bg-akg-card p-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {settings.upi_qr_url ? (
              <div className="shrink-0 rounded-lg border border-akg-hairline bg-white p-2.5">
                <img src={settings.upi_qr_url} alt="UPI QR code" className="h-40 w-40 object-contain" />
              </div>
            ) : (
              <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-lg border border-dashed border-akg-hairline text-center text-[11px] text-akg-muted">
                QR not uploaded yet
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-akg-text">Scan and pay exactly</h4>
                <div className="mt-1.5 font-mono text-2xl font-bold text-akg-text">₹{inr.toLocaleString('en-IN')}</div>
                {settings.payee_name && <div className="text-xs text-akg-muted">to {settings.payee_name}</div>}
              </div>
              <button
                onClick={() => copy(settings.upi_id, 'upi')}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-akg-hairline bg-akg-raised px-3.5 py-2.5 text-left cursor-pointer"
              >
                <span className="min-w-0 truncate font-mono text-xs text-akg-green">{settings.upi_id}</span>
                {copied === 'upi' ? <Check className="h-4 w-4 shrink-0 text-akg-green" /> : <Copy className="h-4 w-4 shrink-0 text-akg-muted" />}
              </button>
              {upiLink && (
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
            <h4 className="mb-2 text-xs font-semibold text-akg-text">Paste the UPI reference (UTR / transaction ID)</h4>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. 415223698741" inputMode="numeric"
              className="h-11 w-full rounded-lg border border-akg-hairline bg-akg-raised px-3.5 font-mono text-sm text-akg-text placeholder:text-akg-muted/60 focus:border-akg-accent focus:outline-none"
            />
          </div>
        </section>
      )}

      {/* What happens next */}
      <section className="mt-5 rounded-xl border border-akg-hairline bg-akg-card p-5">
        <h3 className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-akg-muted">
          <ShieldCheck className="h-4 w-4 text-akg-green" /> What happens next
        </h3>
        <ol className="mt-3 space-y-2.5">
          {[
            <>Submit this form with your {method === 'upi' ? 'UTR' : 'TXID'} reference.</>,
            <>The desk verifies the payment <b className="text-akg-text">manually</b>, usually within a few hours.</>,
            isBot
              ? <>Your <b className="text-akg-text">license key</b> is issued automatically and appears in My Account with the download.</>
              : <>Your <b className="text-akg-text">30-day cycle</b> activates automatically and the full signals desk unlocks.</>,
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
        disabled={busy}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-akg-cta text-sm font-bold text-akg-cta-text transition-all active:scale-[0.98] disabled:opacity-50 hover:opacity-90 cursor-pointer shadow-sm"
      >
        <KeyRound className="h-4 w-4" />
        {busy ? 'Submitting...' : !user ? 'Sign in and Submit Order' : `Submit Order · $${order.price}${method === 'upi' && inr ? ` / ₹${inr.toLocaleString('en-IN')}` : ''}`}
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
