import { describe, expect, it } from "vitest";
import {
  hasSignalAccess,
  type UserAccessContext,
  type CycleEnrolment,
} from "./access";

describe("hasSignalAccess", () => {
  const c1: CycleEnrolment["cycle"] = {
    id: "cycle-1",
    startsOn: "2026-09-08",
    endsOn: "2026-10-08",
    status: "running",
  };

  const c2: CycleEnrolment["cycle"] = {
    id: "cycle-2",
    startsOn: "2026-10-20",
    endsOn: "2026-11-20",
    status: "running",
  };

  const userPaidC1: UserAccessContext = {
    id: "user-a",
    enrolments: [
      {
        id: "enr-1",
        userId: "user-a",
        cycleId: "cycle-1",
        planTier: "SR_SIGNAL_BOX",
        status: "paid",
        cycle: c1,
      },
    ],
  };

  const userPaidC1AndC2: UserAccessContext = {
    id: "user-b",
    enrolments: [
      {
        id: "enr-1",
        userId: "user-b",
        cycleId: "cycle-1",
        planTier: "SR_SIGNAL_BOX",
        status: "paid",
        cycle: c1,
      },
      {
        id: "enr-2",
        userId: "user-b",
        cycleId: "cycle-2",
        planTier: "SR_SIGNAL_BOX",
        status: "paid",
        cycle: c2,
      },
    ],
  };

  it("denies access before cycle start (7 Sep)", () => {
    const now = new Date("2026-09-07T12:00:00Z");
    expect(
      hasSignalAccess(userPaidC1, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(false);
  });

  it("grants access on first day of cycle (8 Sep)", () => {
    const now = new Date("2026-09-08T00:00:01Z");
    expect(
      hasSignalAccess(userPaidC1, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(true);
  });

  it("grants access on last day of cycle (8 Oct)", () => {
    const now = new Date("2026-10-08T23:59:59Z");
    expect(
      hasSignalAccess(userPaidC1, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(true);
  });

  it("denies access on day after cycle ends (9 Oct)", () => {
    const now = new Date("2026-10-09T00:00:01Z");
    expect(
      hasSignalAccess(userPaidC1, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(false);
  });

  it("denies access during gap (9 Oct - 19 Oct)", () => {
    const now = new Date("2026-10-15T12:00:00Z");
    expect(
      hasSignalAccess(userPaidC1AndC2, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(false);
  });

  it("on 20 Oct: User A (not renewed) has no access, User B (renewed) has access", () => {
    const now = new Date("2026-10-20T10:00:00Z");
    expect(
      hasSignalAccess(userPaidC1, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(false);
    expect(
      hasSignalAccess(userPaidC1AndC2, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(true);
  });

  it("denies access after C2 closes (21 Nov)", () => {
    const now = new Date("2026-11-21T00:00:01Z");
    expect(
      hasSignalAccess(userPaidC1AndC2, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(false);
  });

  it("denies access if cycle status is draft", () => {
    const userDraft: UserAccessContext = {
      id: "user-draft",
      enrolments: [
        {
          id: "enr-d",
          userId: "user-draft",
          cycleId: "cycle-draft",
          planTier: "SR_SIGNAL_BOX",
          status: "paid",
          cycle: {
            id: "cycle-draft",
            startsOn: "2026-09-08",
            endsOn: "2026-10-08",
            status: "draft",
          },
        },
      ],
    };
    const now = new Date("2026-09-15T12:00:00Z");
    expect(
      hasSignalAccess(userDraft, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(false);
  });

  it("denies access if enrolment status is pending, refunded, or expired", () => {
    const now = new Date("2026-09-15T12:00:00Z");
    for (const status of ["pending", "refunded", "expired"] as const) {
      const userInvalid: UserAccessContext = {
        id: "user-inv",
        enrolments: [
          {
            id: "enr-inv",
            userId: "user-inv",
            cycleId: "cycle-1",
            planTier: "SR_SIGNAL_BOX",
            status,
            cycle: c1,
          },
        ],
      };
      expect(
        hasSignalAccess(userInvalid, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
      ).toBe(false);
    }
  });

  it("denies access if tier does not match (PERFECT does not grant SR)", () => {
    const userPerfect: UserAccessContext = {
      id: "user-perf",
      enrolments: [
        {
          id: "enr-p",
          userId: "user-perf",
          cycleId: "cycle-1",
          planTier: "PERFECT_SIGNAL_BOX",
          status: "paid",
          cycle: c1,
        },
      ],
    };
    const now = new Date("2026-09-15T12:00:00Z");
    expect(
      hasSignalAccess(userPerfect, "SR_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(false);
    expect(
      hasSignalAccess(userPerfect, "PERFECT_SIGNAL_BOX", { now, businessTimezone: "UTC" }),
    ).toBe(true);
  });

  it("respects business timezone across midnight boundary", () => {
    // 2026-10-08 20:00:00 UTC is:
    // 2026-10-09 01:30:00 in Asia/Kolkata (+05:30) -> Cycle C1 endsOn was 2026-10-08, so in Kolkata it is expired!
    const boundaryUtc = new Date("2026-10-08T20:00:00Z");
    expect(
      hasSignalAccess(userPaidC1, "SR_SIGNAL_BOX", {
        now: boundaryUtc,
        businessTimezone: "Asia/Kolkata",
      }),
    ).toBe(false);

    // In UTC, 2026-10-08T20:00:00Z is still 8 Oct, so valid in UTC
    expect(
      hasSignalAccess(userPaidC1, "SR_SIGNAL_BOX", {
        now: boundaryUtc,
        businessTimezone: "UTC",
      }),
    ).toBe(true);
  });
});
