# 08 — Dependencies

Verify the current stable version and docs of each package before installing; do not rely on memory. Use a current Node.js LTS and **pnpm**. Pin via lockfile.

## Approved stack
| Purpose | Package / project |
|---|---|
| Framework | Next.js **16** (App Router), React, TypeScript (strict) |
| UI | Tailwind CSS, shadcn/ui |
| Database | PostgreSQL |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Auth | **Better Auth** (+ its official plugins for 2FA and admin roles if they satisfy `05-SECURITY.md`; otherwise implement minimal custom logic and record it) |
| Validation | Zod |
| Jobs | `pg-boss` from `timgit/pg-boss` (current major; API: `createQueue`, `send`, `work`) |
| Email | Nodemailer (SMTP) |
| Logging | pino |
| Unit/integration tests | Vitest |
| E2E tests | Playwright |
| Reverse proxy | Caddy |
| Crypto payments | BTCPay Server (self-hosted, optional profile) + manual TXID flow |
| Charts/news | TradingView embeddable widgets (free) |

## Do not use (inactive, deprecated, or end-of-life)
| Item | Why |
|---|---|
| Auth.js / NextAuth | Maintenance mode (security patches only); its maintainers recommend Better Auth for new projects |
| Lucia | Deprecated |
| Next.js 15 or older | Next.js 15 reaches end of life on 21 Oct 2026 |
| `middleware.ts` file name | Renamed to `proxy.ts` in Next.js 16 |
| Old pg-boss forks and the old `publish`/`subscribe` API | Use the current `timgit/pg-boss` API |
| Archived or abandoned starter templates | Scaffold from the official tools instead; do not copy a template repo |
| Any package whose repository is archived, or with no release/commit activity for a long period | Check before adding; record the check in `DECISIONS.md` |

## Adding a dependency
1. Check it is actively maintained (recent release, open-issue handling, not archived) and has no known vulnerabilities.
2. Prefer the standard library or an approved package.
3. Add one line to `docs/DECISIONS.md`: what, why, version, date.
