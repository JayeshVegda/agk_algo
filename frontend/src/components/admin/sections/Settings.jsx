import React, { useState, useEffect, useCallback } from 'react';
import { Settings as Cog, Save, ShieldAlert, Plus, Trash2, QrCode, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { SectionHeader, labelCls, inputCls, textareaCls, EmptyState } from '../components/ui';
import { downscaleImage } from './Bots';

// QR renders offline from the address string, so no network call is needed.
async function makeQr(text) {
  try {
    return await QRCode.toDataURL(text, { width: 256, margin: 1, color: { dark: '#0C1619E6', light: '#FFFFFF' } });
  } catch {
    return '';
  }
}

/**
 * Desk settings in three tabs: Signal plans (admin-editable copy + prices),
 * Crypto wallets (fully dynamic list on the `wallets` collection) and
 * UPI/support. Saved values apply to the live site without a redeploy.
 */
export default function Settings() {
  const { refresh } = useAdmin();
  const [tab, setTab] = useState('plans');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [record, setRecord] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({});

  // --- wallets manager state ---
  const [walletRows, setWalletRows] = useState([]);
  const [walletsLoaded, setWalletsLoaded] = useState(false);
  const [loadedIds, setLoadedIds] = useState([]);
  const [walletDirty, setWalletDirty] = useState(false);
  const [qrs, setQrs] = useState({});

  const loadWallets = useCallback(async () => {
    try {
      const rows = await pb.collection('wallets').getFullList({ sort: 'sort,created' });
      setWalletRows(rows.map((r) => ({ id: r.id, label: r.label, address: r.address, note: r.note || '', enabled: !!r.enabled, sort: r.sort ?? 0, qr_image: r.qr_image || '' })));
      setLoadedIds(rows.map((r) => r.id));
      setWalletDirty(false);
    } catch { /* starts empty */ }
    setWalletsLoaded(true);
  }, []);

  React.useEffect(() => {
    if (tab === 'wallets') loadWallets();
  }, [tab, loadWallets]);

  React.useEffect(() => {
    pb.collection('site_settings').getList(1, 1).then((res) => {
      const r = res.items[0];
      setRecord(r || null);
      if (r) {
        setForm({
          upi_id: r.upi_id || '',
          payee_name: r.payee_name || '',
          upi_qr_url: r.upi_qr_url || '',
          support_email: r.support_email || '',
          support_phone: r.support_phone || '',
          usdt_inr_rate: r.usdt_inr_rate ?? 0,
          inr_enabled: !!r.inr_enabled,
          crypto_enabled: r.crypto_enabled !== false,
          max_pending_payments: r.max_pending_payments ?? 5,
          default_user_share: r.default_user_share ?? 70,
          checkout_note: r.checkout_note || '',
          display_currency: r.display_currency || 'BOTH',
          landing_announcement: r.landing_announcement || '',
          auto_pin_trade_alerts: r.auto_pin_trade_alerts !== false,
          plan_sr_name: r.plan_sr_name || 'SR Signal Box',
          plan_sr_blurb: r.plan_sr_blurb || '',
          plan_sr_price: r.plan_sr_price ?? 10,
          plan_vip_name: r.plan_vip_name || 'Perfect Signal Box',
          plan_vip_blurb: r.plan_vip_blurb || '',
          plan_vip_price: r.plan_vip_price ?? 20,
        });
      }
      setLoaded(true);
    });
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      await pb.collection('site_settings').update(record.id, {
        ...form,
        usdt_inr_rate: Number(form.usdt_inr_rate) || 0,
        max_pending_payments: Number(form.max_pending_payments) || 5,
        default_user_share: Number(form.default_user_share) || 70,
        plan_sr_price: Number(form.plan_sr_price) || 0,
        plan_vip_price: Number(form.plan_vip_price) || 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      refresh?.();
    } finally {
      setSaving(false);
    }
  };

  // --- wallets manager ops ---
  const addWalletRow = () => {
    const maxSort = walletRows.reduce((m, r) => Math.max(m, Number(r.sort) || 0), 0);
    setWalletRows([...walletRows, { id: null, label: '', address: '', note: '', enabled: true, sort: maxSort + 10, qr_image: '' }]);
    setWalletDirty(true);
  };
  const patchWalletRow = (idx, patch) => {
    setWalletRows(walletRows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setWalletDirty(true);
  };
  const dropWalletRow = (idx) => {
    setWalletRows(walletRows.filter((_, i) => i !== idx));
    setWalletDirty(true);
  };
  const saveWallets = async () => {
    setSaving(true);
    try {
      for (const r of walletRows) {
        const body = { label: r.label.trim(), address: r.address.trim(), note: r.note, enabled: !!r.enabled, sort: Number(r.sort) || 0, qr_image: r.qr_image || '' };
        if (r.id) await pb.collection('wallets').update(r.id, body);
        else await pb.collection('wallets').create(body);
      }
      const kept = new Set(walletRows.filter((r) => r.id).map((r) => r.id));
      for (const id of loadedIds) {
        if (!kept.has(id)) { try { await pb.collection('wallets').delete(id); } catch { /* already gone */ } }
      }
      await loadWallets();
      await pb.collection('wallets').getList(1, 1); // warm the cache hook consumers read
      refresh?.();
    } finally {
      setSaving(false);
    }
  };

  // generate QR previews lazily for rows with addresses
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const r of walletRows) {
        if (!r.address || qrs[r.label + r.address]) continue;
        const url = await makeQr(r.address);
        if (!alive) return;
        setQrs((prev) => ({ ...prev, [r.label + r.address]: url }));
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletRows]);

  if (!loaded) return <div className="py-20 text-center text-sm text-akg-muted">Loading settings...</div>;

  if (!record) {
    return <EmptyState icon={Cog} title="Settings record missing" hint="Run migrations; the site_settings collection should hold exactly one record." />;
  }

  const TABS = [
    ['plans', 'Signal plans'],
    ['wallets', 'Crypto wallets'],
    ['upi', 'UPI / support'],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SectionHeader
        title="Desk Settings"
        sub="Plans, settlement wallets, INR pricing and support contacts. Changes apply to the checkout instantly."
      />

      {/* Tab switcher */}
      <div className="flex gap-1.5 rounded-xl border border-[var(--akg-hairline)] bg-akg-card p-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`h-8 flex-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === key ? 'bg-akg-accent/15 text-akg-accent' : 'text-akg-muted hover:text-akg-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ==================== SIGNAL PLANS ==================== */}
      {tab === 'plans' && (
        <div className="space-y-5">
          {[['sr', 'Standard plan'], ['vip', 'VIP plan']].map(([k, title]) => (
            <section key={k} className="rounded-2xl border border-[var(--akg-hairline)] bg-akg-card p-5">
              <h2 className="mb-4 font-data text-[10px] uppercase tracking-[0.16em] text-akg-accent">{title}</h2>
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <div>
                  <label className={labelCls}>Plan name</label>
                  <input value={form[`plan_${k}_name`]} onChange={set(`plan_${k}_name`)} className={inputCls} placeholder="SR Signal Box" />
                </div>
                <div>
                  <label className={labelCls}>Price (USDT / 30d)</label>
                  <input value={form[`plan_${k}_price`]} onChange={set(`plan_${k}_price`)} type="number" min="0" className={`${inputCls} font-data`} placeholder="10" />
                </div>
              </div>
              <div className="mt-3">
                <label className={labelCls}>One-line pitch (shown on pricing cards)</label>
                <textarea value={form[`plan_${k}_blurb`]} onChange={set(`plan_${k}_blurb`)} className={textareaCls} placeholder="Desk-tested signals for a focused watchlist..." />
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-akg-muted">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Fixed plan ids (SR_SIGNAL_BOX / PERFECT_SIGNAL_BOX) gate access everywhere — renaming here only changes what members see.
              </p>
            </section>
          ))}
        </div>
      )}

      {/* ==================== CRYPTO WALLETS ==================== */}
      {tab === 'wallets' && (
        <div className="rounded-2xl border border-[var(--akg-hairline)] bg-akg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-data text-[10px] uppercase tracking-[0.16em] text-akg-accent">Crypto deposit wallets</h2>
            <button onClick={addWalletRow} className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--akg-hairline)] bg-akg-raised px-3 text-xs font-semibold text-akg-text hover:text-akg-accent cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Add wallet
            </button>
          </div>

          {!walletsLoaded ? (
            <div className="py-8 text-center text-xs text-akg-muted">Loading wallets...</div>
          ) : (
            <div className="space-y-3">
              {walletRows.map((row, idx) => (
                <div key={row.id || `new-${idx}`} className="rounded-xl border border-[var(--akg-hairline)] bg-akg-raised p-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                        <div>
                          <label className={labelCls}>Network label</label>
                          <input value={row.label} onChange={(e) => patchWalletRow(idx, { label: e.target.value })} className={`${inputCls} font-data text-xs`} placeholder="USDT-TRC20" />
                        </div>
                        <div>
                          <label className={labelCls}>Deposit address</label>
                          <input value={row.address} onChange={(e) => patchWalletRow(idx, { address: e.target.value })} className={`${inputCls} font-data text-xs`} placeholder="TLa2g9..." />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Note shown at checkout (optional)</label>
                        <input value={row.note} onChange={(e) => patchWalletRow(idx, { note: e.target.value })} className={`${inputCls} text-xs`} placeholder="e.g. Tron network only" />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-akg-silver">
                          <input type="checkbox" checked={row.enabled} onChange={(e) => patchWalletRow(idx, { enabled: e.target.checked })} className="h-4 w-4 accent-[var(--akg-accent)]" />
                          Enabled (visible at checkout)
                        </label>
                        <div className="flex items-center gap-1.5 text-xs text-akg-muted">
                          Sort
                          <input value={row.sort} onChange={(e) => patchWalletRow(idx, { sort: e.target.value })} type="number" className="h-7 w-16 rounded-md border border-[var(--akg-hairline)] bg-akg-card px-2 text-xs font-data text-akg-text" />
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const generated = qrs[row.label + row.address];
                      const preview = row.qr_image || generated;
                      return (
                        <div className="shrink-0 text-center">
                          {preview ? (
                            <img src={preview} alt={`${row.label} QR`} className="h-24 w-24 rounded-lg border border-[var(--akg-hairline)] bg-white p-1" />
                          ) : (
                            <div className="grid h-24 w-24 place-items-center rounded-lg border border-[var(--akg-hairline)] bg-akg-card text-akg-muted">
                              <QrCode className="h-6 w-6" />
                            </div>
                          )}
                          <label className="mt-1.5 block cursor-pointer text-[10px] font-semibold text-akg-accent hover:underline" title="Upload your own QR image; leave empty to auto-generate from the address">
                            {row.qr_image ? 'Replace QR' : 'Upload QR'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                try {
                                  const url = await downscaleImage(f, 320);
                                  patchWalletRow(idx, { qr_image: url });
                                } catch { /* ignore */ }
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <div className="mt-0.5 flex items-center justify-center gap-2">
                            {row.qr_image ? (
                              <button onClick={() => patchWalletRow(idx, { qr_image: '' })} className="text-[10px] font-semibold text-rose-600 hover:underline dark:text-rose-300">remove custom</button>
                            ) : (
                              generated && (
                                <a href={generated} download={`${row.label || 'wallet'}-qr.png`} className="inline-flex items-center gap-1 text-[10px] font-semibold text-akg-accent hover:underline">
                                  <Download className="h-2.5 w-2.5" /> PNG
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    <button onClick={() => dropWalletRow(idx)} title="Remove wallet" className="cursor-pointer rounded-lg border border-[var(--akg-hairline)] bg-akg-card p-2 text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {walletRows.length === 0 && (
                <p className="py-4 text-center text-xs text-akg-muted">No wallets yet — add one so customers can pay in crypto.</p>
              )}
              <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300/90">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Double-check addresses; customers send funds before the desk verifies. A wrong address loses money.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================== UPI / GPAY ==================== */}
      {tab === 'upi' && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--akg-hairline)] bg-akg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-data text-[10px] uppercase tracking-[0.16em] text-akg-accent">GPay / UPI</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-akg-silver">
                <input
                  type="checkbox"
                  checked={form.inr_enabled}
                  onChange={(e) => setForm({ ...form, inr_enabled: e.target.checked })}
                  className="h-4 w-4 accent-[var(--akg-accent)]"
                />
                Offer UPI at checkout
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>UPI ID (VPA)</label>
                <input value={form.upi_id} onChange={set('upi_id')} className={`${inputCls} font-data text-xs`} placeholder="name@okhdfcbank" />
              </div>
              <div>
                <label className={labelCls}>Payee name shown</label>
                <input value={form.payee_name} onChange={set('payee_name')} className={inputCls} placeholder="JAYESH V" />
              </div>
              <div>
                <label className={labelCls}>USDT to INR rate (₹ per $1)</label>
                <input value={form.usdt_inr_rate} onChange={set('usdt_inr_rate')} type="number" className={`${inputCls} font-data`} placeholder="e.g. 92" />
              </div>
              <div>
                <label className={labelCls}>UPI QR code image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      try {
                        const url = await downscaleImage(f, 480);
                        setForm((prev) => ({ ...prev, upi_qr_url: url }));
                      } catch { /* ignore */ }
                    }
                    e.target.value = '';
                  }}
                  className="w-full text-xs text-akg-muted file:mr-2.5 file:cursor-pointer file:rounded-md file:border-0 file:bg-emerald-500/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-akg-accent hover:file:bg-emerald-500/25 transition-colors"
                />
                {form.upi_qr_url && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={form.upi_qr_url} alt="UPI QR" className="h-20 w-20 rounded-lg border border-[var(--akg-hairline)] bg-white object-contain p-1" />
                    <button onClick={() => setForm({ ...form, upi_qr_url: '' })} className="text-[11px] font-semibold text-rose-600 hover:underline dark:text-rose-300">remove</button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--akg-hairline)] bg-akg-card p-5">
            <h2 className="mb-4 font-data text-[10px] uppercase tracking-[0.16em] text-akg-accent">Support & checkout copy</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Support email</label>
                <input value={form.support_email} onChange={set('support_email')} className={`${inputCls} font-data text-xs`} placeholder="desk@akgalgo.in" />
              </div>
              <div>
                <label className={labelCls}>Support Telegram / phone</label>
                <input value={form.support_phone} onChange={set('support_phone')} className={`${inputCls} font-data text-xs`} placeholder="@akgalgo_support or +91..." />
              </div>
              <div>
                <label className={labelCls}>Currency shown at checkout</label>
                <select value={form.display_currency} onChange={set('display_currency')} className={`${inputCls} cursor-pointer`}>
                  <option value="USD">USDT only</option>
                  <option value="INR">INR only</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Landing announcement banner</label>
                <input value={form.landing_announcement} onChange={set('landing_announcement')} className={`${inputCls} text-xs`} placeholder="e.g. Gold setups open this week" />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Checkout note (shown after order)</label>
              <textarea value={form.checkout_note} onChange={set('checkout_note')} className={textareaCls} placeholder="Payments are verified by the desk within a few hours..." />
            </div>
          </section>
        </div>
      )}

      <button
        onClick={tab === 'wallets' ? saveWallets : save}
        disabled={saving}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-akg-cta text-sm font-bold text-akg-cta-text shadow-sm transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : saved || (tab === 'wallets' && !walletDirty) ? 'Saved ✓' : 'Save Settings'}
      </button>
    </div>
  );
}
