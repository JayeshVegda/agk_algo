# Playbook — Add a background job
1. Use pg-boss (`createQueue`, `send`, `work`; handlers receive an array of jobs). Define the queue in one place.
2. The handler is thin: load data, call a `packages/core` function, persist.
3. Make the job idempotent (safe to run twice) and give it retry/backoff settings.
4. Jobs must never be the only enforcement of a rule (e.g. access is checked per request).
5. Add a test that runs the handler twice and asserts one effect.
