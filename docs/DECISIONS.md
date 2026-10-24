# Decisions

## Open decisions (apply the default, log it, continue)
| # | Decision | Default |
|---|---|---|
| D1 | Does Perfect include SR signals? | No. One tier per enrolment |
| D2 | Mid-cycle joining | Off; join the next cycle during `renewal_open` |
| D3 | Archive visible when not subscribed | Yes, for anyone who ever paid |
| D4 | Business timezone | Admin setting; `UTC` until set |
| D5 | USDT networks offered | Admin-configurable list; start with manual TXID |
| D6 | Reminder schedule | 7, 3, 1 days before cycle end + when renewal opens |
| D7 | Who can create signals | Admin accounts only (no separate analyst role) in v1 |
| D8 | Cycle overlap | Blocked unless admin override |
| D9 | Mid-pause archive access | Same rule as D3 |

## BLOCKING items (stop and ask)
- Enabling `CONNECTOR_REAL_MODE`
- Enabling a BTCPay network in production before its testnet proof is recorded
- Any change that grants access to signals outside `hasSignalAccess`

## Decision log
Format: `YYYY-MM-DD — decision — reason — who`
