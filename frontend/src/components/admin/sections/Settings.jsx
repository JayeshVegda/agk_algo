import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings as Cog, Save, ShieldAlert, Plus, Trash2, QrCode, Download,
  Zap, Sparkles, Wallet, Smartphone, Headphones, CheckCircle2, Globe,
  ArrowRight, ShieldCheck, DollarSign
} from 'lucide-react';
import QRCode from 'qrcode';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { SectionHeader, labelCls, inputCls, textareaCls, EmptyState } from '../components/ui';
import { downscaleImage } from './Bots';
import { Badge } from '../../ui/Badge';

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
      await pb.collection('wallets').getList(1, 1);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
  }, [walletRows]);

  if (!loaded) return <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">Loading settings...</div>;

  if (!record) {
    return <EmptyState icon={Cog} title="Settings record missing" hint="Run migrations; the site_settings collection should hold exactly one record." />;
  }

  const TABS = [
    { key: 'plans', label: 'Signal Plans', icon: Zap },
    { key: 'wallets', label: 'Crypto Wallets', icon: Wallet },
    { key: 'upi', label: 'UPI / Support & Branding', icon: Smartphone },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeader
        title="Desk Settings"
        sub="Plans, settlement wallets, INR pricing and support contacts. Changes apply to the public checkout instantly."
      />

      {/* Segmented Tab Switcher */}
      <div className="flex gap-1.5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 backdrop-blur-md">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex h-9 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none active:scale-[0.98] ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold border border-slate-200/90 dark:border-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== SIGNAL PLANS ==================== */}
      {tab === 'plans' && (
        <div className="space-y-6">
          {[
            { k: 'sr', title: 'Standard Signal Box', tierBadge: 'STANDARD', icon: Zap, color: 'text-emerald-600 dark:text-emerald-400' },
            { k: 'vip', title: 'VIP Perfect Signal Box', tierBadge: 'VIP PRO', icon: Sparkles, color: 'text-amber-500' },
          ].map(({ k, title, tierBadge, icon: Icon, color }) => (
            <section
              key={k}
              className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 shadow-xs"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure public display title, price, and marketing copy</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {tierBadge}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <div>
                  <label className={labelCls}>Plan Display Title</label>
                  <input
                    value={form[`plan_${k}_name`]}
                    onChange={set(`plan_${k}_name`)}
                    className={inputCls}
                    placeholder="SR Signal Box"
                  />
                </div>
                <div>
                  <label className={labelCls}>Price (USDT / 30 Days)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">$</span>
                    <input
                      value={form[`plan_${k}_price`]}
                      onChange={set(`plan_${k}_price`)}
                      type="number"
                      min="0"
                      className={`${inputCls} pl-8 font-mono font-bold`}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className={labelCls}>One-Line Pitch (Shown on Pricing Cards)</label>
                <textarea
                  value={form[`plan_${k}_blurb`]}
                  onChange={set(`plan_${k}_blurb`)}
                  className={textareaCls}
                  placeholder="Desk-tested signals for a focused watchlist. Real-time entries, stops and targets..."
                />
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 p-3 text-xs text-slate-500 dark:text-slate-400">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  Fixed plan IDs (<strong className="text-slate-700 dark:text-slate-200">SR_SIGNAL_BOX</strong> / <strong className="text-slate-700 dark:text-slate-200">PERFECT_SIGNAL_BOX</strong>) gate permissions across the backend. Renaming here only updates user-facing labels.
                </span>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ==================== CRYPTO WALLETS ==================== */}
      {tab === 'wallets' && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200/80 dark:border-white/10">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Crypto Deposit Wallets</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage addresses and QR codes shown to members during checkout</p>
            </div>
            <button
              onClick={addWalletRow}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3.5 text-xs font-bold text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Wallet</span>
            </button>
          </div>

          {!walletsLoaded ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading wallets...</div>
          ) : (
            <div className="space-y-4">
              {walletRows.map((row, idx) => (
                <div
                  key={row.id || `new-${idx}`}
                  className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 p-4 transition-all hover:border-slate-300 dark:hover:border-white/20"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="min-w-0 flex-1 space-y-3 w-full">
                      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                        <div>
                          <label className={labelCls}>Network Label</label>
                          <input
                            value={row.label}
                            onChange={(e) => patchWalletRow(idx, { label: e.target.value })}
                            className={`${inputCls} font-mono text-xs`}
                            placeholder="USDT-TRC20"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Deposit Address</label>
                          <input
                            value={row.address}
                            onChange={(e) => patchWalletRow(idx, { address: e.target.value })}
                            className={`${inputCls} font-mono text-xs`}
                            placeholder="TLa2g9..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Checkout Note (Optional)</label>
                        <input
                          value={row.note}
                          onChange={(e) => patchWalletRow(idx, { note: e.target.value })}
                          className={`${inputCls} text-xs`}
                          placeholder="e.g. TRC-20 network only · Min deposit 10 USDT"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) => patchWalletRow(idx, { enabled: e.target.checked })}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Enabled (Visible at checkout)</span>
                        </label>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span>Display Order:</span>
                          <input
                            value={row.sort}
                            onChange={(e) => patchWalletRow(idx, { sort: e.target.value })}
                            type="number"
                            className="h-7 w-16 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2 text-xs font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    {(() => {
                      const generated = qrs[row.label + row.address];
                      const preview = row.qr_image || generated;
                      return (
                        <div className="shrink-0 flex sm:flex-col items-center gap-3 sm:gap-1.5 text-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/80 dark:border-white/5">
                          {preview ? (
                            <img
                              src={preview}
                              alt={`${row.label} QR`}
                              className="h-24 w-24 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white p-1.5 shadow-xs"
                            />
                          ) : (
                            <div className="grid h-24 w-24 place-items-center rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-100 dark:bg-slate-800 text-slate-400">
                              <QrCode className="h-6 w-6" />
                            </div>
                          )}

                          <div className="flex flex-col sm:items-center">
                            <label className="cursor-pointer text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
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
                                <button
                                  onClick={() => patchWalletRow(idx, { qr_image: '' })}
                                  className="text-[10px] font-semibold text-rose-500 hover:underline"
                                >
                                  remove custom
                                </button>
                              ) : (
                                generated && (
                                  <a
                                    href={generated}
                                    download={`${row.label || 'wallet'}-qr.png`}
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                  >
                                    <Download className="h-2.5 w-2.5" /> PNG
                                  </a>
                                )
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => dropWalletRow(idx)}
                            title="Remove wallet"
                            className="ml-auto sm:ml-0 mt-0 sm:mt-1 cursor-pointer rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-100 dark:hover:bg-rose-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}

              {walletRows.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No wallets configured yet. Click "Add Wallet" to allow crypto checkout.
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-300">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>
                  Carefully double-check addresses before saving. Members send funds directly to these coordinates before verification.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== UPI / GPAY & BRANDING ==================== */}
      {tab === 'upi' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/80 dark:border-white/10">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">GPay / Instant UPI Integration</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure Indian payments, live USDT-INR conversion rates, and QR codes</p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={form.inr_enabled}
                  onChange={(e) => setForm({ ...form, inr_enabled: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Offer UPI at Checkout</span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>UPI ID (VPA)</label>
                <input
                  value={form.upi_id}
                  onChange={set('upi_id')}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="name@okhdfcbank"
                />
              </div>

              <div>
                <label className={labelCls}>Payee Name Displayed</label>
                <input
                  value={form.payee_name}
                  onChange={set('payee_name')}
                  className={inputCls}
                  placeholder="AKG ALGO TRADING"
                />
              </div>

              <div>
                <label className={labelCls}>USDT to INR Conversion Rate (₹ per $1)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">₹</span>
                  <input
                    value={form.usdt_inr_rate}
                    onChange={set('usdt_inr_rate')}
                    type="number"
                    className={`${inputCls} pl-8 font-mono font-bold`}
                    placeholder="92"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>UPI QR Code Image</label>
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
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2.5 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-500/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-500/25 transition-colors"
                />
                {form.upi_qr_url && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={form.upi_qr_url}
                      alt="UPI QR"
                      className="h-20 w-20 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white object-contain p-1.5 shadow-xs"
                    />
                    <button
                      onClick={() => setForm({ ...form, upi_qr_url: '' })}
                      className="text-xs font-semibold text-rose-500 hover:underline"
                    >
                      Remove QR
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 shadow-xs">
            <div className="pb-4 mb-5 border-b border-slate-200/80 dark:border-white/10">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Desk Support &amp; Checkout Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Communication contacts and customer reassurance copy</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Official Support Email</label>
                <input
                  value={form.support_email}
                  onChange={set('support_email')}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="desk@akgalgo.in"
                />
              </div>

              <div>
                <label className={labelCls}>Official Telegram / Phone</label>
                <input
                  value={form.support_phone}
                  onChange={set('support_phone')}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="@akgalgo_support"
                />
              </div>

              <div>
                <label className={labelCls}>Currency Shown at Checkout</label>
                <select
                  value={form.display_currency}
                  onChange={set('display_currency')}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="USD">USDT only</option>
                  <option value="INR">INR only</option>
                  <option value="BOTH">Both (USDT + INR)</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Announcement Banner (Public Hero Top)</label>
                <input
                  value={form.landing_announcement}
                  onChange={set('landing_announcement')}
                  className={`${inputCls} text-xs`}
                  placeholder="e.g. Gold Liquidity Trap EA v3.2 released this week"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={labelCls}>Checkout Post-Order Instructions (Shown to Buyer)</label>
              <textarea
                value={form.checkout_note}
                onChange={set('checkout_note')}
                className={textareaCls}
                placeholder="Payments are verified by the desk within a few hours. Once confirmed, your license key will be delivered to your account dashboard instantly..."
              />
            </div>
          </section>
        </div>
      )}

      {/* Modern Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-20 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Desk sync active: changes apply to public site and checkout immediately</span>
        </div>

        <button
          onClick={tab === 'wallets' ? saveWallets : save}
          disabled={saving}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 font-sans text-xs font-bold text-white shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving changes...' : saved || (tab === 'wallets' && !walletDirty) ? 'Settings Saved ✓' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
