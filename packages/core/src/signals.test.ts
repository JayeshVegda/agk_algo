import { describe, expect, it } from "vitest";
import { computeMonthlySignalSummary, type SignalWithOutcome } from "./signals";

describe("monthly signal summary computations", () => {
  it("computes accurate wins, losses, winRate and pips from fixtures", () => {
    const fixtureSignals: SignalWithOutcome[] = [
      {
        id: "s1",
        symbol: "EURUSD",
        direction: "BUY",
        planTier: "SR_SIGNAL_BOX",
        publishedAt: "2026-10-01T10:00:00Z",
        outcome: {
          outcome: "win",
          resultPips: 45,
          resultR: 2,
          closedAt: "2026-10-01T15:00:00Z",
        },
      },
      {
        id: "s2",
        symbol: "GBPUSD",
        direction: "SELL",
        planTier: "SR_SIGNAL_BOX",
        publishedAt: "2026-10-02T10:00:00Z",
        outcome: {
          outcome: "win",
          resultPips: 60,
          resultR: 3,
          closedAt: "2026-10-02T16:00:00Z",
        },
      },
      {
        id: "s3",
        symbol: "USDJPY",
        direction: "BUY",
        planTier: "SR_SIGNAL_BOX",
        publishedAt: "2026-10-03T10:00:00Z",
        outcome: {
          outcome: "loss",
          resultPips: -30,
          resultR: -1,
          closedAt: "2026-10-03T14:00:00Z",
        },
      },
      {
        id: "s4",
        symbol: "XAUUSD",
        direction: "BUY",
        planTier: "SR_SIGNAL_BOX",
        publishedAt: "2026-10-04T10:00:00Z",
        outcome: {
          outcome: "cancelled",
          resultPips: 0,
          resultR: 0,
          closedAt: "2026-10-04T12:00:00Z",
        },
      },
    ];

    const summary = computeMonthlySignalSummary(fixtureSignals);
    expect(summary.totalCount).toBe(4);
    expect(summary.wins).toBe(2);
    expect(summary.losses).toBe(1);
    expect(summary.cancelled).toBe(1);
    expect(summary.totalPips).toBe(75);
    expect(summary.totalR).toBe(4);
    // winRate = 2 / (2 + 1) * 100 = 66.7%
    expect(summary.winRatePercent).toBe(66.7);
  });
});
