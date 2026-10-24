import { describe, expect, it } from "vitest";
import {
  validateCycleDates,
  validateCycleOverlap,
  validateCycleStatusTransition,
  isUserEligibleForRenewal,
  CycleValidationError,
} from "./cycles";

describe("cycle business logic", () => {
  it("accepts valid dates where endsOn >= startsOn", () => {
    expect(() =>
      validateCycleDates({ startsOn: "2026-10-01", endsOn: "2026-10-31" }),
    ).not.toThrow();
  });

  it("rejects invalid date order", () => {
    expect(() =>
      validateCycleDates({ startsOn: "2026-10-31", endsOn: "2026-10-01" }),
    ).toThrow(CycleValidationError);
  });

  it("detects overlapping cycle dates", () => {
    const existing = [
      {
        id: "c1",
        name: "Cycle 1",
        startsOn: "2026-09-08",
        endsOn: "2026-10-08",
        status: "running" as const,
      },
    ];

    expect(() =>
      validateCycleOverlap(
        { startsOn: "2026-10-05", endsOn: "2026-11-05" },
        existing,
        false,
      ),
    ).toThrow(CycleValidationError);
  });

  it("allows overlap when admin override is explicitly true", () => {
    const existing = [
      {
        id: "c1",
        name: "Cycle 1",
        startsOn: "2026-09-08",
        endsOn: "2026-10-08",
        status: "running" as const,
      },
    ];

    expect(() =>
      validateCycleOverlap(
        { startsOn: "2026-10-05", endsOn: "2026-11-05" },
        existing,
        true,
      ),
    ).not.toThrow();
  });

  it("allows non-overlapping cycles with gaps", () => {
    const existing = [
      {
        id: "c1",
        name: "Cycle 1",
        startsOn: "2026-09-08",
        endsOn: "2026-10-08",
        status: "running" as const,
      },
    ];

    // Gap from 9 Oct to 19 Oct, new starts 20 Oct
    expect(() =>
      validateCycleOverlap(
        { startsOn: "2026-10-20", endsOn: "2026-11-20" },
        existing,
        false,
      ),
    ).not.toThrow();
  });

  it("validates status transitions", () => {
    expect(() => validateCycleStatusTransition("draft", "renewal_open")).not.toThrow();
    expect(() => validateCycleStatusTransition("renewal_open", "running")).not.toThrow();
    expect(() => validateCycleStatusTransition("running", "closed")).not.toThrow();
    expect(() => validateCycleStatusTransition("closed", "running")).toThrow(CycleValidationError);
  });

  it("enforces renewal audience rules", () => {
    expect(isUserEligibleForRenewal(false, "previous_members")).toBe(false);
    expect(isUserEligibleForRenewal(true, "previous_members")).toBe(true);
    expect(isUserEligibleForRenewal(false, "everyone")).toBe(true);
  });
});
