export type PlanTier = "SR_SIGNAL_BOX" | "PERFECT_SIGNAL_BOX";

export type EnrolmentStatus = "pending" | "paid" | "refunded" | "expired";

export type CycleStatus = "draft" | "renewal_open" | "running" | "closed";

export interface CycleEnrolment {
  id: string;
  userId: string;
  cycleId: string;
  planTier: PlanTier;
  status: EnrolmentStatus;
  cycle: {
    id: string;
    startsOn: string; // YYYY-MM-DD
    endsOn: string; // YYYY-MM-DD (inclusive)
    status: CycleStatus;
  };
}

export interface UserAccessContext {
  id: string;
  enrolments: CycleEnrolment[];
}

export interface AccessCheckOptions {
  /**
   * The current timestamp (UTC Date object).
   */
  now: Date;
  /**
   * The business timezone IANA identifier (e.g. 'UTC', 'America/New_York').
   */
  businessTimezone: string;
}

/**
 * Converts a UTC Date into the local 'YYYY-MM-DD' date string within the target IANA timezone.
 */
export function getDateInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Truth decision on whether a user has access to signals for a given tier at a given time.
 * One tier per enrolment; PERFECT_SIGNAL_BOX does NOT include SR_SIGNAL_BOX by default (Decision D1).
 */
export function hasSignalAccess(
  user: UserAccessContext | null | undefined,
  planTier: PlanTier,
  options: AccessCheckOptions,
): boolean {
  if (!user || !user.enrolments || user.enrolments.length === 0) {
    return false;
  }

  const currentDateStr = getDateInTimezone(options.now, options.businessTimezone);

  return user.enrolments.some((enrolment) => {
    // 1. Must be paid
    if (enrolment.status !== "paid") {
      return false;
    }

    // 2. Must match the exact requested tier (Decision D1: one tier per enrolment)
    if (enrolment.planTier !== planTier) {
      return false;
    }

    // 3. Cycle must not be draft or closed
    const cycle = enrolment.cycle;
    if (cycle.status === "draft" || cycle.status === "closed") {
      return false;
    }

    // 4. Current date must fall within [startsOn, endsOn] (inclusive)
    if (currentDateStr < cycle.startsOn || currentDateStr > cycle.endsOn) {
      return false;
    }

    return true;
  });
}
