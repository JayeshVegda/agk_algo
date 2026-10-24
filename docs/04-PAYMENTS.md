# 04 — Payments (USDT / crypto)

Goal: let the admin offer as many USDT/crypto options as they choose, safely, without tying the app to one provider.

## Provider interface (`packages/core`)
```ts
interface PaymentProvider {
  id: 'manual_txid' | 'btcpay' | string;
  createInvoice(order: Order, network: PaymentNetwork): Promise<InvoiceInstructions>; // amount, address/URL, expiresAt
  handleWebhook?(req: RawRequest): Promise<PaymentEvent | null>;                     // verify signature first
  getStatus?(providerInvoiceId: string): Promise<ProviderStatus>;
}
```
Providers are registered by id; enabling is controlled by env flags and the admin's `payment_networks` table.

## State machine
```
pending -> awaiting_confirmations -> confirmed
pending -> expired
pending/awaiting -> underpaid | overpaid  (admin resolves)
confirmed -> refunded (admin, audit-logged)
pending/awaiting -> rejected (admin)
```
Only `confirmed` grants entitlements. Transitions are validated in code (illegal transitions throw) and tested.

## On `confirmed` (single DB transaction)
1. Lock the payment row; if already `confirmed`, return (idempotent).
2. Set status, `confirmed_at`.
3. Create or activate the enrolment, or create the bot license.
4. Write `audit_log`.
5. Enqueue a receipt/confirmation email job.

## Provider 1 — `manual_txid` (ship first)
1. Admin configures networks in settings (e.g. USDT on TRC20, BEP20, ERC20 — whichever the admin enables) with a receiving address.
2. User picks a plan/cycle (or bot) and a network; the app creates a `pending` payment and shows amount, network, address, QR code, and expiry countdown.
3. User pays externally and submits the **TXID**.
4. App rejects a TXID already used on that network (unique constraint) and shows the payment as `awaiting_confirmations`.
5. Admin reviews the pending queue, checks the transaction on a block explorer, and clicks Approve or Reject (with reason). Approval triggers the confirmed transaction above.

## Provider 2 — `btcpay` (second; behind `PAYMENTS_BTCPAY_ENABLED`)
- Self-hosted BTCPay Server creates invoices and sends signed webhooks.
- Native support is Bitcoin-centric; **USDT depends on plugins and node/API setup. Do not assume any network works.** For each network the admin wants, prove it end to end on testnet/regtest and record the result and exact setup steps in `docs/PAYMENTS-NETWORKS.md` before enabling it in production.
- Verify every webhook signature per the **current BTCPay documentation** before parsing; reject invalid ones. Store the raw event in `payment_events` (unique per external event id) and process idempotently.
- Other self-hosted processors (e.g. Bitcart, SHKeeper) can be added later as new providers without touching core flow.

## Edge cases that must be handled and tested
Underpayment · overpayment · payment after invoice expiry · duplicate TXID · wrong network · webhook replay · webhook with invalid signature · two admins approving the same payment concurrently · provider outage (invoice stays pending, retry job).

## UX requirements
Invoice page shows amount (in the asset), network, address, QR, countdown, live status (poll or SSE), and clear next steps. After confirmation, redirect to the dashboard and show the enrolment.

## Money rules
Integer minor units + currency; asset decimals handled in one conversion helper; never use floating point for amounts; show exact amounts to the user (no rounding surprises).
