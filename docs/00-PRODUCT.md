# 00 — Product

## Purpose
AKG ALGO is a membership site for a trading business. The business sells trading **signals**, **MT4/MT5 algo bots**, and a **Connector** (demo). Customers are international; the client has accepted responsibility for the terms users agree to at registration, so the app records consent but does not enforce jurisdiction-specific rules.

## Users and panels
| Role | Can do |
|---|---|
| `user` | Register/login, pay for a cycle, read today's signals and the monthly archive, read admin broadcasts, buy and download bots, use the broker/news/chart/resource pages, submit a Connector demo request |
| `admin` | Everything in the admin panel (see `06-SCREENS.md`). Invite-only, 2FA required |

## Offer
| Plan | What the user gets | Default price |
|---|---|---|
| `SR_SIGNAL_BOX` | Photo/text signals for the running cycle | $10 per cycle |
| `PERFECT_SIGNAL_BOX` | Photo/text signals (Perfect tier) for the running cycle | $20 per cycle |
| Algo bots | MT4/MT5 bot purchased once; compiled file + license key | set per bot |
| Connector | Demo only: user submits account number, server, master password | free (demo) |

Prices are admin-editable per cycle (signals) and per bot.

## User-facing features
- Trading-account opening links (admin-managed list; user clicks through to the external site)
- Forex Factory (link-out only) and TradingView widgets (charts for any symbol, economic calendar)
- Helpful data: Trading Bot PDF, Trading Bot video, latest-news posts
- Social links: WhatsApp, YouTube, Instagram, Facebook, Telegram, plus admin-entered "latest post" cards
- Admin broadcast feed (read and acknowledge only)

## Look and feel
Dark, professional trading-terminal style; mobile-first; high contrast; clean type. Pages: landing, pricing, login/register, dashboard. Reference sites are for structure only — never copy their text, images, branding, or statistics:
- https://eagoldtrap.com/en · https://akgfxbot-web.web.app/#services · https://fdimond423-del.github.io/akg-algo-website/

Every pricing page and the footer show a clear risk disclaimer (trading is risky; signals are not financial advice).

## Explicitly out of scope for v1
Telegram/WhatsApp message forwarding, user replies or a support inbox, live broker connections (Connector real mode), automated trading by the platform, native mobile apps, fiat payment gateways, multi-language UI (keep all strings in one place so it can be added), scraping social networks or Forex Factory.
