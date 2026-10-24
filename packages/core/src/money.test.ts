import { describe, expect, it } from "vitest";
import { createMoney, formatMoney } from "./money";

describe("money helpers", () => {
  it("creates a Money object with integer minor units", () => {
    const money = createMoney(1000, "USD");
    expect(money.amountMinor).toBe(1000);
    expect(money.currency).toBe("USD");
  });

  it("throws TypeError if minor units are not integers", () => {
    expect(() => createMoney(10.5, "USD")).toThrow(TypeError);
  });

  it("formats USD minor units to currency string", () => {
    expect(formatMoney(createMoney(1000, "USD"))).toBe("$10.00");
    expect(formatMoney(createMoney(2550, "USD"))).toBe("$25.50");
    expect(formatMoney(createMoney(0, "USD"))).toBe("$0.00");
  });

  it("formats non-USD minor units with currency suffix", () => {
    expect(formatMoney(createMoney(1000, "USDT"))).toBe("10.00 USDT");
  });
});
