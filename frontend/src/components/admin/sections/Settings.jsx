import React, { useState } from 'react';
import { Settings as Cog, Save, ShieldAlert } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { SectionHeader, labelCls, inputCls, EmptyState } from '../components/ui';
import { downscaleImage } from './Bots';

/**
 * Desk settings: settlement wallets, UPI/GPay details + QR, INR rate,
 * support contacts. Persisted to the site_settings record; the checkout page
 * reads the same record live, so changes apply without a redeploy.
 */
export default function Settings() {
  const { refresh } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [record, setRecord] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({});

  React.useEffect(() => {
    pb.collection('site_settings').getList(1, 1).then((res) => {
      const r = res.items[0];
      setRecord(r || null);
      if (r) {
        setForm({
          wallet_trc20: r.wallet_trc20 || '',
          wallet_bep20: r.wallet_bep20 || '',
          wallet_erc20: r.wallet_erc20 || '',
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
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      refresh?.();
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="py-20 text-center text-sm text-akg-muted">Loading settings…</div>;

  if (!record) {
    return <EmptyState icon={Cog} title="Settings record missing" hint="Run migrations; the site_settings collection should hold exactly one record." />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SectionHeader
        title="Desk Settings"
        sub="Payment destinations, INR pricing, and support contacts. Changes apply to the checkout instantly."
      />

      {/* Crypto wallets */}
      <section className="rounded-2xl border border-white/10 bg-akg-surface p-5">
        <h2 className="mb-4 font-data text-[10px] uppercase tracking-[0.16em] text-akg-gold">USDT wallets</h2>
        <div className="space-y-3">
          {[
            ['wallet_trc20', 'TRC-20 wallet (Tron)'],
            ['wallet_bep20', 'BEP-20 wallet (BSC)'],
            ['wallet_erc20', 'ERC-20 wallet (Ethereum)'],
          ].map(([k, label]) => (
            <div key={k}>
              <label className={labelCls}>{label}</label>
              <input value={form[k]} onChange={set(k)} className={`${inputCls} font-data text-xs`} placeholder="paste address" />
            </div>
          ))}
          <p className="flex items-start gap-1.5 text-[11px] text-amber-300/90">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Double-check these: customers send funds before the desk verifies. A wrong address loses money.
          </p>
        </div>
      </section>

      {/* UPI / GPay */}
      <section className="rounded-2xl border border-white/10 bg-akg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-data text-[10px] uppercase tracking-[0.16em] text-akg-green">GPay / UPI</h2>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-akg-silver">
            <input
              type="checkbox"
              checked={form.inr_enabled}
              onChange={(e) => setForm({ ...form, inr_enabled: e.target.checked })}
              className="h-4 w-4 accent-[#00D878]"
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
            <label className={labelCls}>USDT → INR rate (₹ per $1)</label>
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
              className="w-full text-xs text-akg-muted file:mr-2.5 file:rounded-full file:border-0 file:bg-[#F3C653]/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-akg-gold"
            />
            {form.upi_qr_url && (
              <div className="mt-2 flex items-center gap-3">
                <img src={form.upi_qr_url} alt="UPI QR" className="h-20 w-20 rounded-lg border border-white/10 bg-white object-contain p-1" />
                <button onClick={() => setForm({ ...form, upi_qr_url: '' })} className="text-[11px] font-semibold text-rose-300 hover:underline">remove</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="rounded-2xl border border-white/10 bg-akg-surface p-5">
        <h2 className="mb-4 font-data text-[10px] uppercase tracking-[0.16em] text-sky-300">Support contacts (shown at checkout)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Support email</label>
            <input value={form.support_email} onChange={set('support_email')} className={`${inputCls} font-data text-xs`} placeholder="desk@akgalgo.in" />
          </div>
          <div>
            <label className={labelCls}>Support Telegram / phone</label>
            <input value={form.support_phone} onChange={set('support_phone')} className={`${inputCls} font-data text-xs`} placeholder="@akgalgo_support or +91…" />
          </div>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] active:scale-[0.98] disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Settings'}
      </button>
    </div>
  );
}
