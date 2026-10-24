import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { getDb, users, sessions, accounts, verifications, twoFactors } from "@akg/db";
import { logger } from "./logger";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "default-secret-change-me-long-random-string",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
      twoFactor: twoFactors,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // will enable with SMTP configured
    sendResetPassword: async ({ user, url }) => {
      logger.info({ email: user.email, url }, "Password reset requested");
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      logger.info({ email: user.email, url }, "Email verification requested");
    },
  },
  plugins: [
    twoFactor({
      issuer: "AKG ALGO",
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days default
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
