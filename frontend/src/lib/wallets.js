import { useEffect, useState } from 'react';
import { pb } from './pocketbase';

export const DEFAULT_SETTINGS = {
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

/** Load live payment details on every checkout visit. */
export function useCheckoutConfig() {
  const [attempt, setAttempt] = useState(0);
  const [config, setConfig] = useState({ status: 'loading', settings: DEFAULT_SETTINGS, wallets: [] });

  useEffect(() => {
    let alive = true;
    Promise.all([
      pb.collection('site_settings').getList(1, 1),
      pb.collection('wallets').getList(1, 50, { filter: 'enabled = true', sort: 'sort,created' }),
    ]).then(([settingsPage, walletPage]) => {
      const settings = settingsPage.items[0];
      if (!settings) throw new Error('Payment settings are unavailable.');
      if (alive) setConfig({
        status: 'ready',
        settings,
        wallets: walletPage.items.filter((wallet) => wallet.address && wallet.label && wallet.label !== 'INR-UPI'),
      });
    }).catch(() => {
      if (alive) setConfig({ status: 'error', settings: DEFAULT_SETTINGS, wallets: [] });
    });
    return () => { alive = false; };
  }, [attempt]);

  function retry() {
    setConfig({ status: 'loading', settings: DEFAULT_SETTINGS, wallets: [] });
    setAttempt((value) => value + 1);
  }

  return { ...config, retry };
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
export function getPlans(settings, cycle) {
  const s = settings || DEFAULT_SETTINGS;
  return [
    {
      id: 'SR_SIGNAL_BOX',
      name: s.plan_sr_name || 'SR Signal Box',
      price: cycle?.srPrice ?? (Number(s.plan_sr_price) || 10),
      blurb: s.plan_sr_blurb || '',
      period: 'cycle',
      popular: false,
      tag: 'STANDARD EXECUTION',
      features: STATIC_PLAN_FEATURES.SR_SIGNAL_BOX
    },
    {
      id: 'PERFECT_SIGNAL_BOX',
      name: s.plan_vip_name || 'Perfect Signal Box',
      price: cycle?.vipPrice ?? (Number(s.plan_vip_price) || 20),
      blurb: s.plan_vip_blurb || '',
      period: 'cycle',
      popular: true,
      tag: 'INSTITUTIONAL VIP',
      features: STATIC_PLAN_FEATURES.PERFECT_SIGNAL_BOX
    }
  ];
}
