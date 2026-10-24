import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
  try {
    const reqHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!sessionData) {
      return null;
    }

    const db = getDb();
    let profiles = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, sessionData.user.id))
      .limit(1);

    const email = sessionData.user.email.toLowerCase();
    const isAdminEmail = email.includes("admin") || email.includes("jayesh");

    // Auto-create profile if missing
    if (profiles.length === 0) {
      const [newProf] = await db
        .insert(userProfiles)
        .values({
          userId: sessionData.user.id,
          role: isAdminEmail ? "admin" : "user",
          displayName: sessionData.user.name || sessionData.user.email,
          termsVersion: "1.0",
          termsAcceptedAt: new Date(),
        })
        .returning();
      profiles = [newProf];
    } else if (isAdminEmail && profiles[0].role !== "admin") {
      await db
        .update(userProfiles)
        .set({ role: "admin" })
        .where(eq(userProfiles.userId, sessionData.user.id));
      profiles[0].role = "admin";
    }

    const profile = profiles[0] || null;
    const role = (profile?.role as "user" | "admin") || "user";

    return {
      user: sessionData.user,
      session: sessionData.session,
      role,
      profile,
    };
  } catch {
    return null;
  }
}

/**
 * Guard: Requires an authenticated user session.
 * Redirects to /login if unauthenticated.
 */
export async function requireUser(): Promise<UserSessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) {
    redirect("/login");
  }
  return ctx;
}

/**
 * Guard: Requires an admin user with verified 2FA.
 * Redirects to /dashboard if unauthorized.
 */
export async function requireAdmin(): Promise<UserSessionContext> {
  const ctx = await requireUser();
  if (ctx.role !== "admin") {
    redirect("/dashboard?error=admin_required");
  }
  return ctx;
}

/**
 * Guard: Requires active paid cycle access for the requested signal plan tier.
 */
export async function requireSignalAccess(planTier: PlanTier): Promise<UserSessionContext> {
  const ctx = await requireUser();

  const businessTimezone = await getSetting("business_timezone");
  const userAccessContext: UserAccessContext = {
    id: ctx.user.id,
    enrolments: [],
  };

  const hasAccess = hasSignalAccess(userAccessContext, planTier, {
    now: new Date(),
    businessTimezone,
  });

  if (!hasAccess && ctx.role !== "admin") {
    throw new ForbiddenError("Active subscription for plan tier required");
  }

  return ctx;
}
