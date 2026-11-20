# AKG ALGO deployment

The hosted setup uses Vercel for the React frontend and PocketBase Cloud for the
API, database, hooks and realtime connections. Confirm the instance and domain
before releasing. The repository currently links to a PocketBase instance named
`akg-review`.

## Prepare the backend

1. Take a full PocketBase backup, including files, and keep a separate copy of
   private robot binaries and the server configuration. The SQLite-only backup
   script does not include uploads or binaries.
2. Verify the migration on a preview of the target instance. For a fresh
   instance, use the bundled migrations and configure production settings in
   the admin portal. The legacy setup and demo seed scripts are for development.
3. In the target, verify the app's admin account, support contact, the active
   and next signal cycles, robot prices, and every enabled payment destination.
   Checkout uses the wallet addresses and UPI ID returned by the API. Test the
   generated QR codes from the same devices customers will use.
4. Set `AKG_CRED_KEY` on the backend before accepting managed-account
   applications. Generate a 32-character ASCII key for a new instance with
   `openssl rand -base64 24`. Keep the existing key on upgrades. Review PocketBase log retention and monitor disk space, API
   latency and failed checkout submissions.

From the repo root, using the confirmed instance name:

```bash
pbc pocketbase deploy --name "$AKG_PB_INSTANCE" --preview --preview-name release-check --skip-env
```

The CLI packages the paths declared in `pbc.json` and applies new migrations at
restart. Check the preview for migration errors, especially if its original
schema was imported manually. Verify the payment and cycle schema with
`AKG_URL` and the preview's superuser credentials in the environment:

```bash
npm run harden:db
```

Before enabling robot purchases, install the verified compiled `.ex4`/`.ex5`
packages in private storage for the target backend. The repository’s sample
packages have not been verified in MetaTrader. Test an authenticated download,
then load the downloaded file in the intended MetaTrader version and confirm
license activation. Keep the binaries out of `pb_public/`. Make sure the
backend allows the exact frontend origins for the preview and production sites.

## Prepare the frontend

Use `frontend/` as the Vercel project root and use the build settings in
`frontend/vercel.json`. Set `VITE_PB_URL` to the HTTPS backend URL for the
matching Vercel environment. Build a Vercel preview with the PocketBase preview
URL, and test the pair before switching `VITE_PB_URL` to the production backend.

## Release checks

- On desktop and iPhone Safari, sign up with email and an international phone
  number. Check menu navigation, sign-in, focus indicators and payment feedback.
- Buy a signal cycle in the preview. Verify pending, approved, duplicate
  approval, pause, expiry and rejection. Check that a paid member can read the
  correct Signal Room tier and receives a reminder near expiry.
- Buy a test robot. Verify license issuance, download, and revocation.
- Disable one method and test that checkout hides its payment details. Verify
  that an already-paid customer can submit a reference for manual review.
- Open the Signal Room in two sessions and check new posts and reactions.
  Verify admin statistics and review the oldest unpaid orders.

After preview checks pass, deploy to the confirmed PocketBase instance and
verify its health. Deploy the Vercel production build against that backend and
repeat the smoke checks. Start with a limited rollout and measure concurrency
before promoting to a larger audience.

Keep the last working frontend deployment and the pre-release PocketBase
backup. If a release fails, roll back the frontend and stop new checkouts
before making backend changes. Account for orders accepted after the backup
before restoring a database so their payments can be reconciled.
