import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  uuid,
  index,
  uniqueIndex,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ==========================================
// 1. Better Auth Core & 2FA Schema
// ==========================================
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const twoFactors = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  verified: boolean("verified").default(false),
  failedVerificationCount: integer("failed_verification_count").default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
});

// ==========================================
// 2. Application Core Schema (Phase 0)
// ==========================================
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  displayName: text("display_name"),
  termsVersion: text("terms_version"),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const termsVersions = pgTable("terms_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: text("version").notNull().unique(),
  body: text("body").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
});

export const termsAcceptances = pgTable("terms_acceptances", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  termsVersion: text("terms_version").notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).defaultNow().notNull(),
  ipHash: text("ip_hash"),
  userAgentHash: text("user_agent_hash"),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    diff: jsonb("diff"),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
    index("audit_log_actor_idx").on(table.actorId),
  ],
);

// ==========================================
// 3. Core Product Schema (Phase 1)
// ==========================================
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  storageKey: text("storage_key").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  sha256: text("sha256").notNull(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  visibility: text("visibility", { enum: ["public", "private"] }).default("private").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code", { enum: ["SR_SIGNAL_BOX", "PERFECT_SIGNAL_BOX"] }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cycles = pgTable(
  "cycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    status: text("status", {
      enum: ["draft", "renewal_open", "running", "closed"],
    }).default("draft").notNull(),
    renewalOpensAt: timestamp("renewal_opens_at", { withTimezone: true }),
    renewalClosesAt: timestamp("renewal_closes_at", { withTimezone: true }),
    renewalAudience: text("renewal_audience", {
      enum: ["previous_members", "everyone"],
    }).default("previous_members").notNull(),
    allowMidCycleJoinOverride: boolean("allow_mid_cycle_join_override").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("cycles_dates_idx").on(table.startsOn, table.endsOn),
    index("cycles_status_idx").on(table.status),
  ],
);

export const cyclePlanPrices = pgTable(
  "cycle_plan_prices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => cycles.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    priceMinor: integer("price_minor").notNull(),
    currency: text("currency").default("USD").notNull(),
  },
  (table) => [
    uniqueIndex("cycle_plan_unique_idx").on(table.cycleId, table.planId),
  ],
);

export const paymentNetworks = pgTable("payment_networks", {
  id: uuid("id").primaryKey().defaultRandom(),
  asset: text("asset").default("USDT").notNull(),
  network: text("network").notNull(), // TRC20, BEP20, ERC20
  label: text("label").notNull(),
  address: text("address").notNull(),
  confirmationsRequired: integer("confirmations_required").default(1).notNull(),
  invoiceTtlMinutes: integer("invoice_ttl_minutes").default(60).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    orderType: text("order_type", { enum: ["enrolment", "bot_purchase"] }).notNull(),
    orderId: uuid("order_id"),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").default("USD").notNull(),
    asset: text("asset").default("USDT").notNull(),
    networkId: uuid("network_id").references(() => paymentNetworks.id, {
      onDelete: "restrict",
    }),
    provider: text("provider", { enum: ["manual_txid", "btcpay"] }).default("manual_txid").notNull(),
    providerInvoiceId: text("provider_invoice_id"),
    txid: text("txid"),
    status: text("status", {
      enum: [
        "pending",
        "awaiting_confirmations",
        "confirmed",
        "expired",
        "underpaid",
        "overpaid",
        "refunded",
        "rejected",
      ],
    }).default("pending").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payments_status_expires_idx").on(table.status, table.expiresAt),
    index("payments_user_idx").on(table.userId),
    uniqueIndex("payments_network_txid_idx")
      .on(table.networkId, table.txid)
      .where(sql`${table.txid} IS NOT NULL`),
  ],
);

export const enrolments = pgTable(
  "enrolments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => cycles.id, { onDelete: "restrict" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
    status: text("status", {
      enum: ["pending", "paid", "refunded", "expired"],
    }).default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("enrolments_user_idx").on(table.userId),
    index("enrolments_cycle_idx").on(table.cycleId),
    uniqueIndex("enrolments_active_unique_idx").on(
      table.userId,
      table.cycleId,
      table.planId,
    ),
  ],
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    externalEventId: text("external_event_id").notNull(),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("payment_events_provider_external_idx").on(
      table.provider,
      table.externalEventId,
    ),
  ],
);

export const signals = pgTable(
  "signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    symbol: text("symbol").notNull(),
    direction: text("direction", { enum: ["BUY", "SELL"] }).notNull(),
    entry: text("entry").notNull(),
    stopLoss: text("stop_loss").notNull(),
    takeProfits: jsonb("take_profits").notNull(),
    note: text("note"),
    imageFileId: uuid("image_file_id").references(() => files.id, { onDelete: "set null" }),
    planTier: text("plan_tier", {
      enum: ["SR_SIGNAL_BOX", "PERFECT_SIGNAL_BOX"],
    }).notNull(),
    status: text("status", { enum: ["draft", "published", "cancelled"] })
      .default("draft")
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("signals_tier_published_idx").on(table.planTier, table.publishedAt),
    index("signals_published_idx").on(table.publishedAt),
  ],
);

export const signalOutcomes = pgTable("signal_outcomes", {
  signalId: uuid("signal_id")
    .primaryKey()
    .references(() => signals.id, { onDelete: "cascade" }),
  outcome: text("outcome", {
    enum: ["win", "loss", "breakeven", "cancelled"],
  }).notNull(),
  resultPips: integer("result_pips"),
  resultR: integer("result_r"),
  closedAt: timestamp("closed_at", { withTimezone: true }).defaultNow().notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 4. Communication & Content Schema (Phase 2)
// ==========================================
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    attachmentFileId: uuid("attachment_file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    audienceType: text("audience_type", {
      enum: ["all", "active_subscribers", "cycle", "plan_tier", "single_user"],
    }).default("all").notNull(),
    audienceRef: text("audience_ref"),
    pinned: boolean("pinned").default(false).notNull(),
    requiresAck: boolean("requires_ack").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_pinned_created_idx").on(table.pinned, table.createdAt),
  ],
);

export const messageReads = pgTable(
  "message_reads",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seenAt: timestamp("seen_at", { withTimezone: true }).defaultNow().notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("message_reads_pk").on(table.messageId, table.userId),
    index("message_reads_user_idx").on(table.userId),
  ],
);

export const brokerLinks = pgTable("broker_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  logoFileId: uuid("logo_file_id").references(() => files.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind", { enum: ["pdf", "video"] }).notNull(),
  title: text("title").notNull(),
  urlOrFileId: text("url_or_file_id").notNull(),
  visibility: text("visibility", { enum: ["public", "subscribed"] }).default("subscribed").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const newsPosts = pgTable("news_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const socialLinks = pgTable("social_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull(), // whatsapp, telegram, youtube, instagram, facebook
  url: text("url").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const socialPosts = pgTable("social_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull(),
  title: text("title").notNull(),
  imageFileId: uuid("image_file_id").references(() => files.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 5. Bot Store Schema (Phase 3)
// ==========================================
export const bots = pgTable("bots", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  platform: text("platform", { enum: ["MT4", "MT5", "both"] }).notNull(),
  priceMinor: integer("price_minor").notNull(),
  currency: text("currency").default("USD").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const botFiles = pgTable("bot_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  botId: uuid("bot_id")
    .notNull()
    .references(() => bots.id, { onDelete: "cascade" }),
  platform: text("platform", { enum: ["MT4", "MT5"] }).notNull(),
  storageKey: text("storage_key").notNull(),
  size: integer("size").notNull(),
  sha256: text("sha256").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const botLicenses = pgTable("bot_licenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  botId: uuid("bot_id")
    .notNull()
    .references(() => bots.id, { onDelete: "restrict" }),
  licenseKey: text("license_key").notNull().unique(),
  boundAccountNumber: text("bound_account_number"),
  rebindCount: integer("rebind_count").default(0).notNull(),
  status: text("status", { enum: ["active", "revoked"] }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 6. Connector Demo Schema (Phase 5)
// ==========================================
export const connectorRequests = pgTable("connector_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform", { enum: ["MT4", "MT5"] }).notNull(),
  accountNumber: text("account_number").notNull(),
  server: text("server").notNull(),
  secretCiphertext: text("secret_ciphertext").notNull(),
  secretNonce: text("secret_nonce").notNull(),
  keyVersion: integer("key_version").default(1).notNull(),
  status: text("status", { enum: ["pending", "active", "disconnected"] })
    .default("pending")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
