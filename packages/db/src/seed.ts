import { getDb } from "./index";
import {
  settings,
  termsVersions,
  plans,
  cycles,
  paymentNetworks,
  bots,
  signals,
  signalOutcomes,
  messages,
  users,
  userProfiles,
  accounts,
} from "./schema/index";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function seed() {
  const db = getDb();

  console.log("Seeding base database records...");

  // Better-Auth hashed password for "root"
  const passwordHash =
    "097cd27233e32cae3ee92667a47f80b3:1c10fa9dfdb460bac72a7a6a0146d41cb2030d88e08f007475944118eb140c742327a468c20a19f4154a5bfe8be41df5f93583d2aaf1404e4001002ac52f592a";

  // 0. Seed Admin & Demo User Accounts
  await db
    .insert(users)
    .values([
      {
        id: "admin-system",
        name: "Lead Administrator",
        email: "admin@akgalgo.local",
        emailVerified: true,
      },
      {
        id: "trader-demo",
        name: "Alex Trader",
        email: "user@akgalgo.local",
        emailVerified: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(accounts)
    .values([
      {
        id: "acc-admin",
        accountId: "admin-system",
        providerId: "credential",
        userId: "admin-system",
        password: passwordHash,
      },
      {
        id: "acc-trader",
        accountId: "trader-demo",
        providerId: "credential",
        userId: "trader-demo",
        password: passwordHash,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(userProfiles)
    .values([
      {
        userId: "admin-system",
        role: "admin",
        displayName: "Lead Administrator",
        termsVersion: "1.0",
        termsAcceptedAt: new Date(),
      },
      {
        userId: "trader-demo",
        role: "user",
        displayName: "Alex Trader",
        termsVersion: "1.0",
        termsAcceptedAt: new Date(),
      },
    ])
    .onConflictDoNothing();

  // 1. Settings
  await db
    .insert(settings)
    .values([
      { key: "business_timezone", value: "UTC" },
      { key: "allow_mid_cycle_join", value: true },
      { key: "archive_visible_when_inactive", value: true },
      { key: "reminder_days", value: [7, 3, 1] },
      {
        key: "paused_banner_text",
        value: "The current cycle has concluded. The next trading cycle opens soon.",
      },
    ])
    .onConflictDoNothing();

  // 2. Terms
  await db
    .insert(termsVersions)
    .values({
      version: "1.0",
      body: "Institutional Terms of Service and Risk Disclosures: Algorithmic trading involves high market volatility.",
    })
    .onConflictDoNothing();

  // 3. Plans
  await db
    .insert(plans)
    .values([
      {
        code: "SR_SIGNAL_BOX",
        name: "SR Signal Box",
        description: "Support & Resistance high-probability setups",
      },
      {
        code: "PERFECT_SIGNAL_BOX",
        name: "Perfect Signal Box",
        description: "Institutional momentum breakout tier",
      },
    ])
    .onConflictDoNothing();

  // 4. Payment Networks
  await db
    .insert(paymentNetworks)
    .values([
      {
        asset: "USDT",
        network: "TRC20",
        label: "USDT (TRON - TRC20)",
        address: "TYDnyHNBYK2UX7nMzBdpmaDT4GdfsGY72E",
        confirmationsRequired: 1,
        invoiceTtlMinutes: 60,
        enabled: true,
      },
      {
        asset: "USDT",
        network: "BEP20",
        label: "USDT (BNB Smart Chain - BEP20)",
        address: "0x71C8366420A092c5566363573275720fb4697523",
        confirmationsRequired: 3,
        invoiceTtlMinutes: 60,
        enabled: true,
      },
    ])
    .onConflictDoNothing();

  // 5. Cycles (Worked Example from docs/02-BUSINESS-RULES.md)
  await db
    .insert(cycles)
    .values([
      {
        name: "Cycle 1 (Sep - Oct)",
        startsOn: "2026-09-08",
        endsOn: "2026-10-08",
        status: "closed",
      },
      {
        name: "Cycle 2 (Active Market Cycle)",
        startsOn: "2026-10-20",
        endsOn: "2026-11-20",
        status: "running",
      },
      {
        name: "Cycle 3 (Next Cycle)",
        startsOn: "2026-11-25",
        endsOn: "2026-12-25",
        status: "renewal_open",
      },
    ])
    .onConflictDoNothing();

  // 6. Bots
  await db
    .insert(bots)
    .values([
      {
        name: "AKG Gold Trap EA",
        description: "Specialized XAUUSD institutional supply/demand breakout strategy for MT4 & MT5.",
        platform: "both",
        priceMinor: 9900,
        currency: "USD",
        active: true,
      },
      {
        name: "AKG FX Momentum Hunter",
        description: "Trend-continuation algorithmic advisor for EURUSD, GBPUSD and USDJPY.",
        platform: "MT5",
        priceMinor: 14900,
        currency: "USD",
        active: true,
      },
      {
        name: "AKG Asian Session Scalper",
        description: "Low-drawdown mean-reversion Asian session expert advisor.",
        platform: "MT4",
        priceMinor: 7900,
        currency: "USD",
        active: true,
      },
    ])
    .onConflictDoNothing();

  // 7. Seed Broadcast Messages
  await db
    .insert(messages)
    .values([
      {
        authorId: "admin-system",
        body: "Welcome to AKG ALGO. Daily market alerts and execution parameters are updated during active London and New York trading sessions.",
        audienceType: "all",
        pinned: true,
        requiresAck: false,
      },
      {
        authorId: "admin-system",
        body: "Cycle 2 is currently active. Ensure your MetaTrader terminal chart template is updated to v2.1.",
        audienceType: "active_subscribers",
        pinned: false,
        requiresAck: true,
      },
    ])
    .onConflictDoNothing();

  // 8. Sample Signals with Outcomes
  const sampleSignals = [
    {
      symbol: "EURUSD",
      direction: "BUY" as const,
      entry: "1.08500",
      stopLoss: "1.08200",
      takeProfits: ["1.08800", "1.09200"],
      planTier: "SR_SIGNAL_BOX" as const,
      status: "published" as const,
      publishedAt: new Date("2026-10-15T09:00:00Z"),
    },
    {
      symbol: "XAUUSD",
      direction: "BUY" as const,
      entry: "2720.50",
      stopLoss: "2708.00",
      takeProfits: ["2735.00", "2750.00"],
      planTier: "PERFECT_SIGNAL_BOX" as const,
      status: "published" as const,
      publishedAt: new Date("2026-10-21T13:30:00Z"),
    },
    {
      symbol: "GBPUSD",
      direction: "SELL" as const,
      entry: "1.30200",
      stopLoss: "1.30550",
      takeProfits: ["1.29800", "1.29400"],
      planTier: "PERFECT_SIGNAL_BOX" as const,
      status: "published" as const,
      publishedAt: new Date("2026-10-22T08:00:00Z"),
    },
  ];

  for (const s of sampleSignals) {
    const [inserted] = await db.insert(signals).values(s).returning();
    if (inserted) {
      await db
        .insert(signalOutcomes)
        .values({
          signalId: inserted.id,
          outcome: "win",
          resultPips: 65,
          resultR: 2,
        })
        .onConflictDoNothing();
    }
  }

  console.log("Base database seeding completed successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
