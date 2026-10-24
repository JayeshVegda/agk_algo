# Phase 2 — Communication and content

**Goal:** admin can talk to users and curate content.

## Tasks
- [x] Tables: `messages`, `message_reads`, `broker_links`, `resources`, `news_posts`, `social_links`, `social_posts`
- [x] Admin broadcast composer with audiences (all, active subscribers, cycle, tier, single user), pin, require-ack, attachment
- [x] Server-side admin-only send endpoint (rate-limited, audited)
- [x] User message feed with unread badge; SSE stream + 30 s polling fallback
- [x] Seen tracking, "Got it" acknowledgement, admin per-message counts and unseen/unacknowledged lists
- [x] Soft delete and edit rules for admin messages
- [x] Broker links (admin CRUD, user cards)
- [x] TradingView chart widget (any symbol, admin default symbols) and economic-calendar widget; CSP updated for widget hosts
- [x] Forex Factory link-out card (new tab, `rel="noopener noreferrer"`)
- [x] Resources: PDF download, video embed, news posts
- [x] Social links and manual "latest post" cards
- [x] Renewal reminder emails and "renewal window opened" email via worker
- [x] E2E scenario 5

## Acceptance criteria
- Non-admin cannot send a broadcast (tested at API level)
- Audience resolution matches tests for every audience type
- Widgets load only on their pages; CSP has no wildcard beyond what is required

## Verification
Test suite + e2e 5 + manual check of SSE and polling fallback.

## Progress Log
- 2026-10-24: Implemented broadcast schema, message reads with composite PK, broker links, resources, news, and social tables in Drizzle migration 0003.
- 2026-10-24: Built Admin broadcast composer with audience targeting and require-acknowledgement toggle.
- 2026-10-24: Created user message feed with real-time SSE stream route and 'Got it' acknowledgment action.
- 2026-10-24: Created Charts & News page with TradingView embeds, economic calendar, and Forex Factory link-outs.
- 2026-10-24: Created Broker links, Resources (PDF & Video guides), and Official Social community hubs.
