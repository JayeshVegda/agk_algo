/// <reference path="../pb_data/types.d.ts" />
/**
 * AKG ALGO server-side hooks.
 *
 * Everything here runs on the server, regardless of what the client sends.
 * - users:              clients can never set role/plan/cycle themselves (register or update)
 * - payments:           status is forced to "pending", user_email to the authenticated email,
 *                       plan + amount are validated against server-side prices
 * - payments (approve): pending -> confirmed grants the subscription cycle or issues a
 *                       random license key in one transaction; idempotent
 * - connector_requests: clients cannot forge user_email, status or admin_notes
 *
 * NOTE: each handler is fully self-contained (helpers + constants declared inside)
 * because the JSVM does not reliably share top-level declarations with handler
 * invocations across prewarmed runtimes.
 */

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

onRecordCreateRequest((e) => {
  const auth = e.auth;
  const isManager = auth && (auth.collection().name === "_superusers" || auth.get("role") === "admin");

  if (!isManager) {
    // Self-registration: force safe defaults, ignore whatever the client sent.
    e.record.set("role", "user");
    e.record.set("plan", "NONE");
    e.record.set("cycle_expires_at", "0001-01-01 00:00:00.000Z");
  }
  e.next();
}, "users");

onRecordUpdateRequest((e) => {
  const auth = e.auth;
  const isManager = auth && (auth.collection().name === "_superusers" || auth.get("role") === "admin");

  if (!isManager) {
    // Self-service updates may only touch profile fields (name, avatar, ...).
    // Entitlement fields are restored from the stored record.
    const orig = e.record.original();
    e.record.set("role", orig.get("role"));
    e.record.set("plan", orig.get("plan"));
    e.record.set("cycle_expires_at", orig.get("cycle_expires_at"));
  }
  e.next();
}, "users");

// ---------------------------------------------------------------------------
// payments
// ---------------------------------------------------------------------------

onRecordCreateRequest((e) => {
  const PLAN_PRICES = { SR_SIGNAL_BOX: 10, PERFECT_SIGNAL_BOX: 20 };

  if (!e.auth) throw new BadRequestError("Authentication required.");

  const isManager =
    e.auth.collection().name === "_superusers" || e.auth.get("role") === "admin";

  if (!isManager) {
    // The ledger entry always belongs to the authenticated account; admins may
    // file a payment on behalf of a customer, so their provided email is kept.
    e.record.set("user_email", e.auth.get("email"));
    e.record.set("status", "pending");

    // Alert every admin in real time: a member filed a payment for review.
    try {
      const col = $app.findCollectionByNameOrId("notifications");
      const admins = $app.findRecordsByFilter("users", "role = 'admin'", "-created", 50, 0);
      for (const admin of admins) {
        const n = new Record(col);
        n.set("user", admin.id);
        n.set("title", "New Payment Submitted");
        n.set("body", e.auth.get("email") + " filed " + e.record.get("plan") + " (" + e.record.get("amount") + " USDT). TXID: " + (e.record.get("txid") || "-"));
        n.set("type", "payment_submitted");
        n.set("read", false);
        $app.save(n);
      }
    } catch (err) {
      console.log("akg: admin payment alert failed:", err);
    }
  }

  // Validate plan + amount against server-side prices (clients cannot pay $1 for a $299 bot).
  const plan = e.record.get("plan") || "";
  const amount = Number(e.record.get("amount") || 0);
  let expected = 0;

  if (PLAN_PRICES.hasOwnProperty(plan)) {
    expected = PLAN_PRICES[plan];
  } else if (plan.indexOf("BOT:") === 0) {
    const m = plan.match(/BOT:\s*(.+?)\s*\(/);
    if (!m) throw new BadRequestError("Invalid bot purchase format.");
    let bot;
    try {
      bot = $app.findFirstRecordByFilter("bots", "name = {:name}", { name: m[1] });
    } catch {
      throw new BadRequestError("Unknown bot: " + m[1]);
    }
    expected = Number(bot.get("price") || 0);
  } else {
    throw new BadRequestError("Unknown plan.");
  }

  if (amount !== expected) {
    throw new BadRequestError(
      "Amount " + amount + " USDT does not match the price of the selected plan (" + expected + " USDT)."
    );
  }

  // Manager filed an already-confirmed payment (offline settlement): run the
  // same grant logic the approval transition uses, before the record is saved.
  if (isManager && e.record.get("status") === "confirmed") {
    const DAY_MS = 30 * 24 * 60 * 60 * 1000;

    if (plan === "SR_SIGNAL_BOX" || plan === "PERFECT_SIGNAL_BOX") {
      let userNotFound = false;
      $app.runInTransaction((tx) => {
        let user;
        try {
          user = tx.findFirstRecordByFilter("users", "email = {:email}", { email: e.record.get("user_email") });
        } catch {
          userNotFound = true;
          return;
        }
        const currentRaw = user.get("cycle_expires_at");
        const current = currentRaw && typeof currentRaw.string === "function"
          ? currentRaw.string()
          : String(currentRaw || "");
        let base = Date.now();
        if (current && current.indexOf("0001-01-01") !== 0) {
          const parsed = new Date(current.replace(" ", "T"));
          if (!isNaN(parsed.getTime()) && parsed.getTime() > base) base = parsed.getTime();
        }
        user.set("plan", plan);
        user.set("cycle_expires_at", new Date(base + DAY_MS).toISOString());
        tx.save(user);
      });
      if (userNotFound) {
        throw new BadRequestError(
          "Cannot confirm: no user account exists for " + e.record.get("user_email") + "."
        );
      }
    } else if (plan.indexOf("BOT:") === 0) {
      const m = plan.match(/BOT:\s*(.+?)\s*\(([^#)]+)#([^)]+)\)/);
      if (m) {
        const platform = m[2].trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "EA";
        const acc = (m[3].trim().replace(/\D/g, "") || "000000").slice(-3);
        const rand = $security.randomString(8).toUpperCase();
        e.record.set("license_key", "AKG-" + platform + "-" + acc + "-" + rand.slice(0, 4) + "-" + rand.slice(4, 8));
      }
    }
  }

  e.next();
}, "payments");

onRecordUpdateRequest((e) => {
  const DAY_MS = 30 * 24 * 60 * 60 * 1000;
  const orig = e.record.original();
  const was = orig.get("status") || "";
  const now = e.record.get("status") || "";

  const notifyUser = (email, title, body, type, dedupeKey) => {
    try {
      const u = $app.findFirstRecordByFilter("users", "email = {:email}", { email: email });
      const col = $app.findCollectionByNameOrId("notifications");
      const n = new Record(col);
      n.set("user", u.id);
      n.set("title", title);
      n.set("body", body || "");
      n.set("type", type);
      n.set("read", false);
      if (dedupeKey) n.set("dedupe_key", dedupeKey);
      $app.save(n);
    } catch (err) {
      console.log("akg: user notification failed:", err);
    }
  };

  // Rejection: tell the member what happened and why (admin_notes).
  if (now === "rejected" && was !== "rejected") {
    const reason = e.record.get("admin_notes") || "";
    notifyUser(
      e.record.get("user_email") || "",
      "Payment Rejected",
      "Your " + e.record.get("plan") + " payment was rejected by the desk." + (reason ? " Reason: " + reason : ""),
      "payment_rejected"
    );
    e.next();
    return;
  }

  // Only act on a pending -> confirmed transition (idempotent approvals).
  if (was === "confirmed" || now !== "confirmed") {
    e.next();
    return;
  }

  const plan = e.record.get("plan") || "";
  const email = e.record.get("user_email") || "";

  // Subscription payment: extend/activate the member's 30-day cycle atomically.
  if (plan === "SR_SIGNAL_BOX" || plan === "PERFECT_SIGNAL_BOX") {
    let userNotFound = false;
    $app.runInTransaction((tx) => {
      let user;
      try {
        user = tx.findFirstRecordByFilter("users", "email = {:email}", { email: email });
      } catch (err) {
        userNotFound = true;
        return;
      }

      const currentRaw = user.get("cycle_expires_at");
      const current = currentRaw && typeof currentRaw.string === "function"
        ? currentRaw.string()
        : String(currentRaw || "");
      let base = Date.now();
      if (current && current.indexOf("0001-01-01") !== 0) {
        const parsed = new Date(current.replace(" ", "T"));
        if (!isNaN(parsed.getTime()) && parsed.getTime() > base) {
          base = parsed.getTime();
        }
      }
      const expiry = new Date(base + DAY_MS);

      user.set("plan", plan);
      user.set("cycle_expires_at", expiry.toISOString());
      tx.save(user);
    });
    if (userNotFound) {
      throw new BadRequestError(
        "Cannot approve: no user account exists for " + email + ". Reject or delete this payment."
      );
    }
    notifyUser(
      email,
      "Payment Approved — Signals Unlocked",
      "Your " + plan + " membership is active for 30 days. Welcome to the desk.",
      "payment_approved"
    );
    e.next();
    return;
  }

  // Bot license payment: issue a random server-side license key bound to the account.
  if (plan.indexOf("BOT:") === 0) {
    const m = plan.match(/BOT:\s*(.+?)\s*\(([^#)]+)#([^)]+)\)/);
    if (!m) throw new BadRequestError("Invalid bot purchase record; cannot issue a license key.");

    const platform = m[2].trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() || "EA";
    const acc = (m[3].trim().replace(/\D/g, "") || "000000").slice(-3);
    const rand = $security.randomString(8).toUpperCase();
    const key = "AKG-" + platform + "-" + acc + "-" + rand.slice(0, 4) + "-" + rand.slice(4, 8);

    e.record.set("license_key", key);
    notifyUser(
      e.record.get("user_email") || "",
      "License Issued — " + m[1].trim(),
      "Your bot license is ready: " + key + ". Download it anytime from My Account.",
      "license_issued"
    );
    e.next();
    return;
  }

  e.next();
}, "payments");

// ---------------------------------------------------------------------------
// connector_requests
// ---------------------------------------------------------------------------

onRecordCreateRequest((e) => {
  if (!e.auth) throw new BadRequestError("Authentication required.");
  const isManager =
    e.auth.collection().name === "_superusers" || e.auth.get("role") === "admin";

  if (!isManager) {
    e.record.set("user_email", e.auth.get("email"));
    e.record.set("status", "pending_review");
    e.record.set("admin_notes", "");
  }
  e.next();
}, "connector_requests");

// ---------------------------------------------------------------------------
// Gated EA binary downloads
// ---------------------------------------------------------------------------
// Bot binaries live in ./private_downloads (outside the public web root) and
// are served only to authenticated buyers with a confirmed "BOT: ..." payment,
// or to managers. The setup guide stays public under pb_public/downloads.

routerAdd("GET", "/api/akg/download/{name}", (e) => {
  const auth = e.auth;
  if (!auth) {
    e.json(401, { message: "Sign in and purchase this bot to download it." });
    return;
  }

  const name = e.request.pathValue("name") || "";
  if (!/^[a-z0-9_]+\.ex[45]$/.test(name)) {
    e.json(404, { message: "Unknown download." });
    return;
  }

  const isManager =
    auth.collection().name === "_superusers" || auth.get("role") === "admin";

  if (!isManager) {
    const slug = name.replace(/\.ex[45]$/, "").replace(/_(mt4|mt5)$/, "");
    const slugify = (s) =>
      String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

    let bot = null;
    try {
      const bots = $app.findRecordsByFilter("bots", "id != ''", "-created", 500, 0);
      bot = bots.find((b) => slugify(b.get("name")) === slug) || null;
    } catch {
      bot = null;
    }
    if (!bot) {
      e.json(404, { message: "Unknown download." });
      return;
    }

    let purchases = [];
    try {
      purchases = $app.findRecordsByFilter(
        "payments",
        "user_email = {:email} && status = 'confirmed' && plan ~ {:bot}",
        "-created", 1, 0,
        { email: auth.get("email"), bot: "BOT: " + bot.get("name") + " (" }
      );
    } catch {
      purchases = [];
    }
    if (purchases.length === 0) {
      e.json(403, { message: "This binary requires a confirmed license for " + bot.get("name") + "." });
      return;
    }
  }

  return e.fileFS($os.dirFS("./private_downloads"), name);
});

// ---------------------------------------------------------------------------
// connector_requests status changes
// ---------------------------------------------------------------------------

onRecordUpdateRequest((e) => {
  const orig = e.record.original();
  const was = orig.get("status") || "";
  const now = e.record.get("status") || "";
  if (was === now) {
    e.next();
    return;
  }

  try {
    const u = $app.findFirstRecordByFilter("users", "email = {:email}", { email: e.record.get("user_email") || "" });
    const col = $app.findCollectionByNameOrId("notifications");
    const n = new Record(col);
    n.set("user", u.id);
    n.set("title", "Connector Update");
    n.set("body", "Your bridge request status changed: " + was + " → " + now + "." + (e.record.get("admin_notes") ? " Note: " + e.record.get("admin_notes") : ""));
    n.set("type", "connector_update");
    n.set("read", false);
    $app.save(n);
  } catch (err) {
    console.log("akg: connector notification failed:", err);
  }
  e.next();
}, "connector_requests");

// ---------------------------------------------------------------------------
// Membership expiry reminders (daily)
// ---------------------------------------------------------------------------
// Creates in-app reminders 7 / 3 / 1 / 0 days before the 30-day cycle ends,
// plus one "expired today" notice. dedupe_key makes re-runs idempotent.

cronAdd("akg_expiry_reminders", "17 3 * * *", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  let members = [];
  try {
    members = $app.findRecordsByFilter(
      "users",
      "plan != '' && plan != 'NONE'",
      "-created", 500, 0
    );
  } catch (err) {
    console.log("akg: expiry scan failed:", err);
    return;
  }

  const col = $app.findCollectionByNameOrId("notifications");
  for (const u of members) {
    const raw = u.get("cycle_expires_at");
    const s = raw && typeof raw.string === "function" ? raw.string() : String(raw || "");
    if (!s || s.indexOf("0001-01-01") === 0) continue;
    const expiry = new Date(s.replace(" ", "T")).getTime();
    if (isNaN(expiry)) continue;

    const diffDays = Math.floor((expiry - now) / DAY_MS); // >=0 unexpired, -1 = expired today
    let title = null;
    let daysLabel = null;

    if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
      daysLabel = String(diffDays);
      title = "Membership Expiring in " + diffDays + " Day" + (diffDays === 1 ? "" : "s");
    } else if (diffDays === 0) {
      daysLabel = "0";
      title = "Membership Expires Today";
    } else if (diffDays === -1) {
      daysLabel = "expired";
      title = "Membership Expired";
    }
    if (!title) continue;

    const expiryDay = s.split(" ")[0];
    const dedupeKey = "expiry_" + u.id + "_" + expiryDay + "_" + daysLabel;
    let existing = null;
    try {
      existing = $app.findFirstRecordByFilter("notifications", "dedupe_key = {:k}", { k: dedupeKey });
    } catch {
      existing = null;
    }
    if (existing) continue;

    const n = new Record(col);
    n.set("user", u.id);
    n.set("title", title);
    n.set("body", diffDays < 0
      ? "Your " + u.get("plan") + " cycle has ended. Renew now to keep your signal access."
      : "Your " + u.get("plan") + " cycle ends " + expiryDay + ". Buy next month from My Account to stay locked in.");
    n.set("type", "plan_expiry");
    n.set("read", false);
    n.set("dedupe_key", dedupeKey);
    try {
      $app.save(n);
    } catch (err) {
      console.log("akg: expiry notification failed:", err);
    }
  }
});
