# Playbook — Change the database schema
1. Edit the Drizzle schema in `packages/db` (never the generated auth schema by hand; regenerate it with the Better Auth CLI if auth config changed).
2. Run `pnpm db:generate`; read the generated SQL. Confirm constraints, indexes, and `ON DELETE` choices match `docs/03-DATA-MODEL.md`.
3. Never edit a migration that has already been applied or committed to main; add a new one.
4. Run `pnpm db:migrate` on a fresh database and on one with seed data.
5. Update `pnpm db:seed` if new required data exists.
6. Add or adjust core tests for any rule the new constraint enforces.
7. If the data model changed, update `docs/03-DATA-MODEL.md` in the same commit.
