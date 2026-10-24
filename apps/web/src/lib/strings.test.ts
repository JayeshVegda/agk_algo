import { describe, expect, it } from "vitest";
import { strings } from "./strings";

describe("strings dictionary", () => {
  it("contains all required translation namespaces", () => {
    expect(strings.common.brandName).toBe("AKG ALGO");
    expect(strings.common.riskDisclaimer).toContain("Risk Disclaimer");
    expect(strings.auth.agreeToTerms).toBeDefined();
    expect(strings.plans.srSignalBox).toBeDefined();
    expect(strings.plans.perfectSignalBox).toBeDefined();
    expect(strings.connector.warning).toContain("DEMO ONLY");
  });
});
