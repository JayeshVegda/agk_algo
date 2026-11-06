import { useEffect, useState } from 'react';
import { pb } from './pocketbase';

/**
 * USDT deposit wallets. Since the wallets collection became admin-managed the
 * public read goes straight to it (addresses are public data); these constants
 * are the fallback while the collection loads (or if the API is unreachable).
 */
export const DEFAULT_WALLETS = [
  { id: 'default-trc20', label: 'USDT-TRC20', address: 'TLa2g9Y8kP2qXvL1b8Jp9wZmN4qK7dEf9A', note: '', qr_image: '' },
  { id: 'default-bep20', label: 'USDT-BEP20', address: '0x48D406F20110D753C90D7465D35889F7628192F9', note: '', qr_image: '' },
  { id: 'default-erc20', label: 'USDT-ERC20', address: '0x71C2B81F1A9D4E72b83A072fCc8295b7A19D38Ef', note: '', qr_image: '' },
];

let cachePromise = null;

function fetchWallets() {
  if (!cachePromise) {
    cachePromise = pb.collection('wallets')
      .getList(1, 50, { filter: 'enabled = true', sort: 'sort,created' })
      .then((res) => {
        const rows = (res.items || []).map((r) => ({ id: r.id, label: r.label, address: r.address, note: r.note || '', qr_image: r.qr_image || '' }));
        return rows.length ? rows : DEFAULT_WALLETS;
      })
      .catch(() => DEFAULT_WALLETS);
  }
  return cachePromise;
}

export const DEFAULT_SETTINGS = {
  wallets: DEFAULT_WALLETS,
  upi_id: '',
  payee_name: '',
  upi_qr_url: '',
  support_email: '',
  support_phone: '',
  usdt_inr_rate: 0,
  inr_enabled: false,
  crypto_enabled: true,
  checkout_note: '',
  display_currency: 'BOTH',
  landing_announcement: '',
  auto_pin_trade_alerts: true,
  plan_sr_name: 'SR Signal Box',
  plan_sr_price: 10,
  plan_sr_blurb: '',
  plan_vip_name: 'Perfect Signal Box',
  plan_vip_price: 20,
  plan_vip_blurb: '',
};

let settingsPromise = null;

function fetchSettings() {
  if (!settingsPromise) {
    settingsPromise = pb.collection('site_settings')
      .getList(1, 1)
      .then((res) => {
        const s = res.items[0];
        if (!s) return DEFAULT_SETTINGS;
        return {
          wallets: {
            'USDT-TRC20': s.wallet_trc20 || DEFAULT_WALLETS['USDT-TRC20'],
            'USDT-BEP20': s.wallet_bep20 || DEFAULT_WALLETS['USDT-BEP20'],
            'USDT-ERC20': s.wallet_erc20 || DEFAULT_WALLETS['USDT-ERC20'],
          },
          upi_id: s.upi_id || '',
          payee_name: s.payee_name || '',
          upi_qr_url: s.upi_qr_url || '',
          support_email: s.support_email || '',
          support_phone: s.support_phone || '',
          usdt_inr_rate: Number(s.usdt_inr_rate) || 0,
          inr_enabled: !!s.inr_enabled,
          crypto_enabled: s.crypto_enabled !== false,
          checkout_note: s.checkout_note || '',
          display_currency: s.display_currency || 'BOTH',
          landing_announcement: s.landing_announcement || '',
          auto_pin_trade_alerts: s.auto_pin_trade_alerts !== false,
          plan_sr_name: s.plan_sr_name || 'SR Signal Box',
          plan_sr_price: Number(s.plan_sr_price) || 10,
          plan_sr_blurb: s.plan_sr_blurb || '',
          plan_vip_name: s.plan_vip_name || 'Perfect Signal Box',
          plan_vip_price: Number(s.plan_vip_price) || 20,
          plan_vip_blurb: s.plan_vip_blurb || '',
        };
      })
      .catch(() => DEFAULT_SETTINGS);
  }
  return settingsPromise;
}

/** Full site settings (wallets, UPI, support contacts, INR rate). */
export function useSiteSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  useEffect(() => {
    let alive = true;
    fetchSettings().then((v) => { if (alive) setSettings(v); });
    return () => { alive = false; };
  }, []);
  return settings;
}

/** Returns the live wallet list (falls back to defaults). */
export function useWallets() {
  const [wallets, setWallets] = useState(DEFAULT_WALLETS);

  useEffect(() => {
    let alive = true;
    fetchWallets().then((w) => {
      if (alive) setWallets(w);
    });
    return () => { alive = false; };
  }, []);

  return wallets;
}

/** Same list shaped as a legacy {label: address} map (used by QR + admin import). */
export function walletsToMap(list) {
  const out = {};
  (list || []).forEach((w) => { out[w.label] = w.address; });
  return out;
}

const STATIC_PLAN_FEATURES = {
  SR_SIGNAL_BOX: [
    'Photo and text signal execution parameters',
    'Standard currency pairs (EUR/USD, GBP/USD)',
    'Monthly archive full access',
    'Real-time SSE desktop push notifications',
    'Standard broker setups and PDF guides'
  ],
  PERFECT_SIGNAL_BOX: [
    'High-volatility signals (XAU/USD Gold, BTC/USD, NAS100)',
    'Multi-tier Take Profit and Trailing Stop zones',
    'Live algorithm commentary and rationale',
    'Full access to all bots and MT4/MT5 templates',
    'Priority execution advisory and admin broadcast stream',
    'VIP real-time execution channel access'
  ]
};

/**
 * Builds the two subscription cards. Name, price and pitch come from
 * admin-editable site_settings; stable plan ids, feature copy and tags stay
 * static because roles, grants and analytics key off them.
 */
export function getPlans(settings) {
  const s = settings || DEFAULT_SETTINGS;
  return [
    {
      id: 'SR_SIGNAL_BOX',
      name: s.plan_sr_name || 'SR Signal Box',
      price: Number(s.plan_sr_price) || 10,
      blurb: s.plan_sr_blurb || '',
      period: 'per 30-day cycle',
      popular: false,
      tag: 'STANDARD EXECUTION',
      features: STATIC_PLAN_FEATURES.SR_SIGNAL_BOX
    },
    {
      id: 'PERFECT_SIGNAL_BOX',
      name: s.plan_vip_name || 'Perfect Signal Box',
      price: Number(s.plan_vip_price) || 20,
      blurb: s.plan_vip_blurb || '',
      period: 'per 30-day cycle',
      popular: true,
      tag: 'INSTITUTIONAL VIP',
      features: STATIC_PLAN_FEATURES.PERFECT_SIGNAL_BOX
    }
  ];
}
