# Playbook — Add a payment provider or network
1. Implement `PaymentProvider` in `packages/core` (see `docs/04-PAYMENTS.md`). No provider-specific logic outside its file.
2. If it sends webhooks: verify the signature per that provider's current docs, store the raw event in `payment_events` (unique per external id), process idempotently.
3. Use the shared `confirmPayment()` transaction; never grant access directly.
4. Add the network row via the admin Networks screen (not hard-coded).
5. Test: underpay, overpay, late, duplicate event, invalid signature, concurrent confirmation.
6. Prove the network end to end on a test network; record exact steps and results in `docs/PAYMENTS-NETWORKS.md`.
7. Ship behind a feature flag; enabling in production is a BLOCKING decision.
