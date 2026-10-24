# Phase 2 — Communication and content

**Goal:** admin can talk to users and curate content.

## Tasks
- [ ] Tables: `messages`, `message_reads`, `broker_links`, `resources`, `news_posts`, `social_links`, `social_posts`
- [ ] Admin broadcast composer with audiences (all, active subscribers, cycle, tier, single user), pin, require-ack, attachment
- [ ] Server-side admin-only send endpoint (rate-limited, audited)
- [ ] User message feed with unread badge; SSE stream + 30 s polling fallback
- [ ] Seen tracking, "Got it" acknowledgement, admin per-message counts and unseen/unacknowledged lists
- [ ] Soft delete and edit rules for admin messages
- [ ] Broker links (admin CRUD, user cards)
- [ ] TradingView chart widget (any symbol, admin default symbols) and economic-calendar widget; CSP updated for widget hosts
- [ ] Forex Factory link-out card (new tab, `rel="noopener noreferrer"`)
- [ ] Resources: PDF download, video embed, news posts
- [ ] Social links and manual "latest post" cards
- [ ] Renewal reminder emails and "renewal window opened" email via worker
- [ ] E2E scenario 5

## Acceptance criteria
- Non-admin cannot send a broadcast (tested at API level)
- Audience resolution matches tests for every audience type
- Widgets load only on their pages; CSP has no wildcard beyond what is required

## Verification
Test suite + e2e 5 + manual check of SSE and polling fallback.

## Progress Log
