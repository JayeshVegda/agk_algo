import type { CycleStatus } from "./access";

export interface CycleDates {
  startsOn: string; // YYYY-MM-DD
  endsOn: string; // YYYY-MM-DD
}

export interface ExistingCycle {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: CycleStatus;
}

export class CycleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CycleValidationError";
  }
}

/**
 * Validates that cycle start and end dates are valid YYYY-MM-DD strings and endsOn >= startsOn.
 */
export function validateCycleDates(dates: CycleDates): void {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dates.startsOn) || !dateRegex.test(dates.endsOn)) {
    throw new CycleValidationError("Dates must be valid YYYY-MM-DD format");
  }

  if (dates.endsOn < dates.startsOn) {
    throw new CycleValidationError("Cycle end date cannot be earlier than start date");
  }
}

/**
 * Checks whether two closed intervals [s1, e1] and [s2, e2] overlap.
 */
export function doIntervalsOverlap(a: CycleDates, b: CycleDates): boolean {
  return a.startsOn <= b.endsOn && a.endsOn >= b.startsOn;
}

/**
 * Verifies that a new or modified cycle does not overlap with any existing non-closed cycle,
 * unless explicit admin override is granted.
 */
export function validateCycleOverlap(
  candidate: CycleDates & { id?: string },
  existingCycles: ExistingCycle[],
  allowOverlapOverride = false,
): void {
  if (allowOverlapOverride) {
    return;
  }

  for (const existing of existingCycles) {
    if (candidate.id && existing.id === candidate.id) {
      continue;
    }
    // Only active/scheduled cycles enforce overlap restrictions
    if (existing.status === "closed" || existing.status === "draft") {
      continue;
    }

    if (doIntervalsOverlap(candidate, existing)) {
      throw new CycleValidationError(
        `Cycle dates (${candidate.startsOn} to ${candidate.endsOn}) overlap with existing cycle '${existing.name}' (${existing.startsOn} to ${existing.endsOn})`,
      );
    }
  }
}

/**
 * Validates allowed status transitions for a cycle.
 */
export function validateCycleStatusTransition(
  fromStatus: CycleStatus,
  toStatus: CycleStatus,
): void {
  if (fromStatus === toStatus) return;

  const allowed: Record<CycleStatus, CycleStatus[]> = {
    draft: ["renewal_open", "running", "closed"],
    renewal_open: ["running", "closed"],
    running: ["closed"],
    closed: [],
  };

  if (!allowed[fromStatus].includes(toStatus)) {
    throw new CycleValidationError(
      `Illegal cycle status transition from '${fromStatus}' to '${toStatus}'`,
    );
  }
}

/**
 * Determines whether a user is eligible to enrol in a cycle during its renewal window.
 */
export function isUserEligibleForRenewal(
  hasPreviousPaidEnrolment: boolean,
  renewalAudience: "previous_members" | "everyone",
): boolean {
  if (renewalAudience === "everyone") {
    return true;
  }
  return hasPreviousPaidEnrolment;
}
