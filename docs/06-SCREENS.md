# 06 — Screens

For every screen implement: loading, empty, error, and permission-denied states. Mobile-first, dark theme default.

## Public
| Screen | Content |
|---|---|
| Landing | Hero, what's offered (signals, bots, connector demo), how it works, pricing preview, risk disclaimer, social links, CTA. No fake stats or testimonials |
| Pricing | Plans, current/next cycle dates, bot list, USDT payment explanation, disclaimer |
| Register / Login / Verify email / Reset password | Terms checkbox on register (links to current terms) |
| Terms | Current terms version |

## User panel
| Screen | Content and behaviour |
|---|---|
| Dashboard | Cycle status banner (running / renewal open / paused with admin text / expired), today's signals for the user's tier, unread broadcast badge, renew call-to-action when applicable |
| Signal detail | Fields, image lightbox, outcome if closed |
| Archive | Month picker (back through all months with data), signal list with outcomes, computed monthly summary |
| Subscribe / Renew | Choose cycle + plan, choose payment network, shows invoice |
| Invoice | Amount, network, address, QR, countdown, TXID form (manual provider), live status |
| My payments | History and statuses |
| Messages | Admin broadcast feed, pinned first, "Got it" button when required, unread/seen handling |
| Bots | Catalogue; purchase; **My bots** with license key, signed download links, MT account binding |
| Connector (demo) | Warning banner; form (platform, account number, server, master password); masked saved entry; delete; mocked paper-trading status page |
| Trading accounts | Admin-provided broker links (cards with logo, text, button) |
| Charts & news | TradingView chart widget (symbol search, any symbol) and economic-calendar widget; Forex Factory link-out card; latest news posts |
| Resources | Trading Bot PDF download, Trading Bot video, news/updates |
| Social | Social profile links + admin-entered latest post cards |
| Account | Profile, change password, sessions, terms status |

## Admin panel
| Screen | Content and behaviour |
|---|---|
| Overview | Active members, revenue this cycle, pending payments, upcoming cycle dates |
| Users | Search, view enrolments/payments/licenses, disable account |
| Cycles | Create/edit, set renewal window and audience, pause/resume, overlap warning, price per plan, status controls |
| Enrolments | List, filter by cycle/plan, refund |
| Payments | Pending queue (TXID, network, amount, user), approve/reject with reason, history, **Networks** config (enable/disable, address, confirmations, expiry) |
| Signals | Table + create/edit form (all fields, image upload, tier), publish/cancel, set outcome, filter by month |
| Broadcast | Composer ("chat box"), audience selector, pin, require-ack toggle, attachment; sent list with seen/ack counts and unseen/unacknowledged users |
| Bots & licenses | Bot CRUD, upload compiled files, view purchases, revoke/reset licenses |
| Broker links | CRUD with ordering |
| Resources & news | PDFs, videos, news posts CRUD |
| Social | Profile URLs and latest-post cards |
| Connector requests | List (demo); credential decryption only via an audit-logged action |
| Settings | Business timezone, `allow_mid_cycle_join`, `archive_visible_when_inactive`, reminder schedule, paused-banner text, default TradingView symbols, SMTP test |
| Terms | Publish new version |
| Audit log | Filter by actor/action/entity |
| Admin accounts | Invite, remove, reset 2FA |
