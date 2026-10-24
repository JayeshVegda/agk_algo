import { describe, expect, it } from "vitest";
import { validatePaymentTransition, PaymentStateError } from "./payments";

describe("payment state transitions", () => {
  it("allows valid forward transitions", () => {
    expect(() => validatePaymentTransition("pending", "awaiting_confirmations")).not.toThrow();
    expect(() => validatePaymentTransition("awaiting_confirmations", "confirmed")).not.toThrow();
    expect(() => validatePaymentTransition("pending", "confirmed")).not.toThrow();
    expect(() => validatePaymentTransition("confirmed", "refunded")).not.toThrow();
  });

  it("rejects illegal transitions", () => {
    expect(() => validatePaymentTransition("confirmed", "pending")).toThrow(PaymentStateError);
    expect(() => validatePaymentTransition("refunded", "confirmed")).toThrow(PaymentStateError);
    expect(() => validatePaymentTransition("expired", "confirmed")).toThrow(PaymentStateError);
  });
});
