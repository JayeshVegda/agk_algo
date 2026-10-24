export interface SignalWithOutcome {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  planTier: "SR_SIGNAL_BOX" | "PERFECT_SIGNAL_BOX";
  publishedAt: Date | string | null;
  outcome?: {
    outcome: "win" | "loss" | "breakeven" | "cancelled";
    resultPips: number | null;
    resultR: number | null;
    closedAt: Date | string | null;
  } | null;
}

export interface MonthlySignalSummary {
  totalCount: number;
  closedCount: number;
  wins: number;
  losses: number;
  breakeven: number;
  cancelled: number;
  winRatePercent: number;
  totalPips: number;
  totalR: number;
}

/**
 * Computes monthly statistical summary from signal outcome rows.
 * Excludes cancelled signals from win rate calculation.
 */
export function computeMonthlySignalSummary(
  signalsList: SignalWithOutcome[],
): MonthlySignalSummary {
  let wins = 0;
  let losses = 0;
  let breakeven = 0;
  let cancelled = 0;
  let totalPips = 0;
  let totalR = 0;

  for (const sig of signalsList) {
    if (!sig.outcome) continue;

    const { outcome, resultPips, resultR } = sig.outcome;
    if (resultPips != null) totalPips += resultPips;
    if (resultR != null) totalR += resultR;

    switch (outcome) {
      case "win":
        wins++;
        break;
      case "loss":
        losses++;
        break;
      case "breakeven":
        breakeven++;
        break;
      case "cancelled":
        cancelled++;
        break;
    }
  }

  const decisiveOutcomes = wins + losses;
  const winRatePercent =
    decisiveOutcomes > 0 ? Number(((wins / decisiveOutcomes) * 100).toFixed(1)) : 0;

  return {
    totalCount: signalsList.length,
    closedCount: wins + losses + breakeven + cancelled,
    wins,
    losses,
    breakeven,
    cancelled,
    winRatePercent,
    totalPips,
    totalR,
  };
}
