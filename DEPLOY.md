# AKG ALGO deployment guide

The React site runs on Vercel. The API, database, hooks, and realtime connections
run on PocketBase Cloud. The tested branch is `green-theme`. The repo is linked
to a PocketBase instance named `akg-review`. Confirm the production instance and
public domain separately.

## 1. Build and test locally

From the repository root:

```bash
git switch green-theme
npm ci --prefix frontend
npm --prefix frontend run build:vercel
npm audit --prefix frontend --omit=dev
git status --short
```

Check the GitHub CI run for the commit being released. CI builds the frontend,
checks the PocketBase hooks, applies the migrations to a fresh database, and
checks payment ownership rules, license fields, and duplicate-reference triggers.

## 2. Set up the staging backend

1. Take a full PocketBase backup that includes uploaded files. Back up private
   robot binaries and server configuration separately. The SQLite-only backup
   script covers the database alone.
2. Use a dedicated staging instance with test accounts and test payment
   settings. If using PocketBase Cloud's preview feature, check what data it
   will copy from the selected instance and keep the preview access restricted.
3. Export `AKG_PB_INSTANCE` with the exact instance name selected for staging.
   From the repository root, create or refresh its preview:

   ```bash
   pbc pocketbase deploy --name "$AKG_PB_INSTANCE" --preview --preview-name release-check --skip-env
   ```

The CLI packages the directories in `pbc.json` and applies new migrations on
restart. Check for migration errors, especially if the instance was set up
with a manual schema import. For a new production database, use the bundled
migrations. Keep the demo seed scripts on disposable environments.

Set `AKG_URL` to the preview backend URL. Supply `AKG_SUPERUSER_EMAIL` and
`AKG_SUPERUSER_PASSWORD` through the shell environment or a secret manager.

```bash
curl --fail --silent --show-error "$AKG_URL/api/health"
npm run harden:db
```

## 3. Connect the Vercel preview

In the Vercel project, set the root directory to `frontend/`. The repository's
`vercel.json` sets the build and output paths. Set `VITE_PB_URL` in **Preview**
to the HTTPS staging backend URL and deploy the tested commit as a protected
preview. Configure the backend to allow the matching frontend origin.

Set `VITE_PB_URL` separately in Vercel's **Production** environment. Verify the
built production deployment uses the production backend before routing the
public domain to it. Keep superuser credentials and `AKG_CRED_KEY` on the
backend side. A `VITE_` variable is visible to browser users.

## 4. Verify the release on staging

- **Accounts** — Sign up with email and an international phone number on
  iPhone Safari and desktop. Test sign-in and the support process for account
  recovery. The customer UI has no self-service password reset.
- **Signals** — Submit a test order, approve it twice, and check that only the
  buyer gets the correct tier. Pause and resume the cycle, verify expiry and
  reminders, then reject the order and verify access is revoked. Check realtime
  posts and reactions using two sessions.
- **Payments** — Use two customer accounts and verify each can see only their
  own orders. Verify duplicate references are rejected. Disable a payment
  method, confirm checkout stops showing it, and submit an already-paid
  reference through the manual review flow.
- **Robots** — Put the final compiled `.ex4` and `.ex5` packages in the
  private delivery location configured for the backend. The sample files in
  the repository still need replacement or verification. A test buyer should
  be able to download, install, and activate the robot in MetaTrader after
  approval. Verify an unpaid account and a rejected order cannot download it.

## 5. Deploy production

1. Verify the production instance, backup, domain, app admin, support contact,
   prices, cycle dates, and exact wallet addresses and UPI ID. Check SMTP and
   rate limits. Test restoring the backup into a separate instance.
2. If managed-account applications are enabled, configure `AKG_CRED_KEY` on
   the backend. Keep the existing value during upgrades. For a fresh instance
   generate a 32-character key with `openssl rand -base64 24`.
3. From the repository root, set `AKG_PB_INSTANCE` to the confirmed production
   instance name and deploy:

   ```bash
   pbc pocketbase deploy --name "$AKG_PB_INSTANCE" --skip-env
   ```

4. Set `AKG_URL` to the production backend and repeat the health and schema
   checks. Release the Vercel production build against that backend, then run
   the smoke checks before opening paid checkout.
5. Start with a limited rollout. Monitor API errors, payment failures, disk
   use, and response times. The Traders screen currently shows up to 5,000
   accounts, and peak concurrent capacity needs a load test.

## Roll back

Keep the last working Vercel deployment and the pre-release PocketBase backup.
If checkout or access fails, stop new orders and revert the frontend. Review
the backend changes before restoring any database. Reconcile orders accepted
since the backup so their payments and access can be recovered.
