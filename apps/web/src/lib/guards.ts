import { headers } from "next/headers";
import { auth, type User, type Session } from "./auth";
import { getDb, userProfiles } from "@akg/db";
import { eq } from "drizzle-orm";
import {
  hasSignalAccess,
  type PlanTier,
  type UserAccessContext,
} from "@akg/core";
import { getSetting } from "./settings";

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface UserSessionContext {
  user: User;
  session: Session;
  role: "user" | "admin";
  profile: typeof userProfiles.$inferSelect | null;
}

/**
 * Resolves current authenticated session and user profile.
 */
export async function getSessionContext(): Promise<UserSessionContext | null> {
  const reqHeaders = await headers();
  const sessionData = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!sessionData) {
    return null;
  }

  const db = getDb();
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, sessionData.user.id))
    .limit(1);

  const profile = profiles[0] || null;
  const role = (profile?.role as "user" | "admin") || "user";

  return {
    user: sessionData.user,
    session: sessionData.session,
    role,
    profile,
  };
}

/**
 * Guard: Requires an authenticated user session.
 */
export async function requireUser(): Promise<UserSessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) {
    throw new UnauthorizedError("Authentication required");
  }
  return ctx;
}

/**
 * Guard: Requires an admin user with verified 2FA.
 */
export async function requireAdmin(): Promise<UserSessionContext> {
  const ctx = await requireUser();
  if (ctx.role !== "admin") {
    throw new ForbiddenError("Administrative privilege required");
  }

  // Admin 2FA enforcement: Admin accounts must have TOTP enabled
  if (!ctx.user.twoFactorEnabled && process.env.NODE_ENV === "production") {
    throw new ForbiddenError("Administrative Two-Factor Authentication required");
  }

  return ctx;
}

/**
 * Guard: Requires active paid cycle access for the requested signal plan tier.
 */
export async function requireSignalAccess(planTier: PlanTier): Promise<UserSessionContext> {
  const ctx = await requireUser();

  // Load user enrolments
  // In Phase 0, we define the hook to evaluate via hasSignalAccess:
  const businessTimezone = await getSetting("business_timezone");
  const userAccessContext: UserAccessContext = {
    id: ctx.user.id,
    enrolments: [], // When enrolments table is queried in Phase 1
  };

  const hasAccess = hasSignalAccess(userAccessContext, planTier, {
    now: new Date(),
    businessTimezone,
  });

  if (!hasAccess) {
    throw new ForbiddenError("Active subscription for plan tier required");
  }

  return ctx;
}
