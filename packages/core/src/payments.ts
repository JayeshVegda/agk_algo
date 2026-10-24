export type PaymentStatus =
  | "pending"
  | "awaiting_confirmations"
  | "confirmed"
  | "expired"
  | "underpaid"
  | "overpaid"
  | "refunded"
  | "rejected";

export class PaymentStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentStateError";
  }
}

/**
 * Validates state transition according to the payment state machine.
 */
export function validatePaymentTransition(
  from: PaymentStatus,
  to: PaymentStatus,
): void {
  if (from === to) return;

  const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    pending: [
      "awaiting_confirmations",
      "confirmed",
      "expired",
      "underpaid",
      "overpaid",
      "rejected",
    ],
    awaiting_confirmations: [
      "confirmed",
      "underpaid",
      "overpaid",
      "rejected",
      "expired",
    ],
    confirmed: ["refunded"],
    expired: [],
    underpaid: ["confirmed", "rejected", "refunded"],
    overpaid: ["confirmed", "refunded"],
    refunded: [],
    rejected: [],
  };

  if (!validTransitions[from].includes(to)) {
    throw new PaymentStateError(
      `Illegal payment transition from '${from}' to '${to}'`,
    );
  }
}
