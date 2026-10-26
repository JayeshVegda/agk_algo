import { useEffect, useState } from 'react';
import { pb } from './pocketbase';

/**
 * USDT deposit wallets. Served from the `site_settings` collection so the desk
 * can rotate addresses without a frontend redeploy; these constants are the
 * fallback while the record loads (or if the API is unreachable).
 */
export const DEFAULT_WALLETS = {
  'USDT-TRC20': 'TLa2g9Y8kP2qXvL1b8Jp9wZmN4qK7dEf9A',
  'USDT-BEP20': '0x71C2B81F1A9D4E72b83A072fCc8295b7A19D38Ef',
  'USDT-ERC20': '0x71C2B81F1A9D4E72b83A072fCc8295b7A19D38Ef',
};

let cachePromise = null;

function fetchWallets() {
  if (!cachePromise) {
    cachePromise = pb.collection('site_settings')
      .getList(1, 1)
      .then((res) => {
        const s = res.items[0];
        if (!s) return DEFAULT_WALLETS;
        return {
          'USDT-TRC20': s.wallet_trc20 || DEFAULT_WALLETS['USDT-TRC20'],
          'USDT-BEP20': s.wallet_bep20 || DEFAULT_WALLETS['USDT-BEP20'],
          'USDT-ERC20': s.wallet_erc20 || DEFAULT_WALLETS['USDT-ERC20'],
        };
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

/** Returns the live wallet map (falls back to defaults). */
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
