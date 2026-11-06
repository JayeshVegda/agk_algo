import React from 'react';
import { ArrowUpRight, Mail, Send, ShieldCheck } from 'lucide-react';
import { useSiteSettings } from '../lib/wallets';

const LINK_GROUPS = [
  {
    title: 'Systems',
    links: [
      { label: 'Signal Room', tab: 'signals' },
      { label: 'Expert Advisors', tab: 'bots' },
      { label: 'Account Management', tab: 'connector' },
      { label: 'Live Charts', tab: 'charts' },
    ],
  },
  {
    title: 'Desk',
    links: [
      { label: 'Desk Briefings', tab: 'broadcasts' },
      { label: 'Traders Kit', tab: 'resources' },
    ],
  },
  {
    title: 'Membership',
    links: [
      { label: 'Plans & Pricing', tab: 'pricing' },
      { label: 'My Account & Licenses', tab: 'account' },
      { label: 'Start Checkout', tab: 'checkout' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', tab: 'terms' },
      { label: 'Refund Policy', tab: 'refund' },
      { label: 'Risk Disclosure', tab: 'risk' },
      { label: 'Privacy Policy', tab: 'privacy' },
    ],
  },
];

export function Footer({ onNavigate, user, onNavigateAdmin }) {
  const settings = useSiteSettings();
  const telegramHandle = String(settings.support_phone || '').replace(/^@/, '').trim();

  const networks = [
    settings.crypto_enabled !== false && 'USDT TRC-20',
    settings.crypto_enabled !== false && 'BEP-20',
    settings.crypto_enabled !== false && 'ERC-20',
    settings.inr_enabled && 'UPI',
  ].filter(Boolean);

  return (
    <footer className="mt-8 border-t border-akg-hairline bg-akg-bg pb-24 text-xs text-akg-muted md:pb-10 transition-[background-color,border-color] duration-150">
      <div className="mx-auto w-[94%] max-w-[1560px] px-2 sm:px-4">
        <div className="grid gap-10 py-12 md:grid-cols-12 md:gap-8 lg:py-14">
          {/* Brand + trust */}
          <div className="md:col-span-4">
            <img
              src="/assets/logos/akg-algo-metallic-footer.webp"
              alt="AKG ALGO"
              className="h-9 w-auto"
              loading="lazy"
            />
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-akg-muted">
              Rule-based MetaTrader Expert Advisors and live signal desks with hard stop-loss on
              every trade. Settled in USDT, licensed once, yours to keep.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-1.5">
              {networks.map((n) => (
                <span
                  key={n}
                  className="rounded-md border border-akg-hairline bg-akg-surface px-2 py-0.5 font-mono text-[10px] text-akg-muted"
                >
                  {n}
                </span>
              ))}
            </div>

            {(settings.support_email || telegramHandle) && (
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
                {settings.support_email && (
                  <a
                    href={`mailto:${settings.support_email}`}
                    className="inline-flex items-center gap-1.5 text-akg-muted transition-colors hover:text-akg-green"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {settings.support_email}
                  </a>
                )}
                {telegramHandle && (
                  <a
                    href={`https://t.me/${telegramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-akg-muted transition-colors hover:text-akg-green"
                  >
                    <Send className="h-3.5 w-3.5" />
                    @{telegramHandle}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Link columns */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 md:col-span-8 md:gap-x-4"
          >
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-akg-muted">
                  {group.title}
                </h2>
                <ul className="mt-3.5 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => onNavigate(link.tab)}
                        className="group inline-flex items-center gap-1 text-left text-[13px] text-akg-muted transition-colors hover:text-akg-text cursor-pointer"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-akg-green" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Compliance */}
        <div className="border-t border-akg-hairline py-6">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-akg-green" strokeWidth={1.5} />
            <p className="max-w-4xl text-[11px] leading-relaxed text-akg-muted">
              <span className="font-medium text-akg-text">Risk disclosure.</span> Trading
              leveraged instruments carries a high level of risk and can result in the loss of all
              invested capital. Signals, Expert Advisors, and the managed-account service are
              analytical tools, not investment advice. Performance figures shown on this site are
              illustrative or historical and never guarantee future results. Only trade with
              capital you can afford to lose.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-akg-hairline py-5 text-[11px] sm:flex-row sm:items-center sm:justify-between text-akg-muted">
          <div>
            © {new Date().getFullYear()} AKG ALGO. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span>
              Platform <span className="font-medium text-akg-green">MT4 &amp; MT5</span>
            </span>
            <span className="text-akg-hairline">·</span>
            <span>
              Settlement <span className="font-medium text-akg-green">USDT direct</span>
            </span>
            <span className="text-akg-hairline">·</span>
            <span>Perpetual licenses &amp; 30-day cycles</span>
            {user?.role === 'admin' && (
              <>
                <span className="text-akg-hairline">·</span>
                <button
                  onClick={onNavigateAdmin}
                  className="font-medium text-akg-green hover:underline cursor-pointer"
                >
                  Admin console
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
