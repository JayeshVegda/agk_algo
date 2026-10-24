# How plans work

Each phase file is a living task list. You (the agent) maintain it.

## Rules
1. Work phases in order. Do not start a phase until the previous phase's acceptance criteria pass.
2. Within a phase, take the next unchecked task. Split a task into sub-tasks if it is bigger than a few hours of work.
3. When you finish a task: tick it, add one line to the phase's **Progress Log** (date, what changed, anything surprising).
4. If you discover work the plan missed, add it as a new unchecked task in the right phase instead of doing it silently.
5. If a task conflicts with `docs/02-BUSINESS-RULES.md`, the business rules win; note the conflict in the log.
6. When unsure, use the defaults in `docs/DECISIONS.md` and log the assumption. Stop only for BLOCKING items.
7. At the end of a phase: run the full verification block in that phase file, list what was built and what was deferred, then stop for review.

## Phases
0. Foundation → `phase-0-foundation.md`
1. Core product (cycles, access, signals, manual payments) → `phase-1-core-product.md`
2. Communication and content → `phase-2-communication-content.md`
3. Bot store → `phase-3-bot-store.md`
4. Automation and hardening → `phase-4-automation-hardening.md`
5. Connector demo → `phase-5-connector-demo.md`
