# AKG ALGO — Agent Kit

A documentation package for coding agents building the AKG ALGO website. It is not application code.

## How to use
1. Create an empty repository and copy this kit into its root (keep the folder structure).
2. Point your coding agent at the repo and tell it: *"Read AGENTS.md, then start Phase 0 in plans/phase-0-foundation.md."*
3. Review after each phase. The agent ticks tasks in `plans/` and logs progress there.
4. Change a decision by editing `docs/DECISIONS.md`; the agent reads it before assuming defaults.

## What is in the kit
| File | Purpose |
|---|---|
| `AGENTS.md` | Short, always-loaded briefing (commands, layout, rules, method). `CLAUDE.md` simply imports it. |
| `docs/00-PRODUCT.md` | Scope, users, plans, out-of-scope |
| `docs/01-ARCHITECTURE.md` | Stack, services, request flow, deployment |
| `docs/02-BUSINESS-RULES.md` | Cycles, access, signals, broadcast, bots, connector — with worked examples |
| `docs/03-DATA-MODEL.md` | Tables, constraints, indexes |
| `docs/04-PAYMENTS.md` | Payment providers, state machine, USDT handling |
| `docs/05-SECURITY.md` | Security requirements and threat checklist |
| `docs/06-SCREENS.md` | Every user and admin screen with states |
| `docs/07-TESTING.md` | Test matrix, access truth table, seed data, e2e scenarios |
| `docs/08-DEPENDENCIES.md` | Approved stack and banned/inactive packages |
| `docs/DECISIONS.md` | Open decisions with defaults + decision log |
| `docs/playbooks/` | Step-by-step recipes for repeated tasks |
| `plans/` | Phase task lists with acceptance criteria and progress logs |
| `.env.example` | Every configuration variable the app uses |
