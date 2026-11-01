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
  if (e.record && e.record.collection().name !== "users") { e.next(); return; }
  const auth = e.auth;
  const isManager = auth && (auth.collection().name === "_superusers" || auth.get("role") === "admin");
  const isFirstRegistration = !isManager;

  // Normalize the email before any uniqueness or entitlement matching: grants
  // and the ledger key on the exact email string, and PocketBase's index is
  // case-sensitive. Lowercase + trim prevents duplicate-looking accounts.
  if (isFirstRegistration) {
    const rawEmail = String(e.record.get("email") || "").trim().toLowerCase();
    if (rawEmail) {
      let existing = null;
      try { existing = $app.findFirstRecordByFilter("users", "email = {:e}", { e: rawEmail }); } catch {}
      if (existing) {
        throw new BadRequestError("Email already registered. Try signing in instead.");
      }
      e.record.set("email", rawEmail);
    }
  }

  if (!isManager) {
    // Registration flood guard: max 20 accounts per rolling minute (DB-backed,
    // so the cap holds across all prewarmed JSVM runtimes).
    const pad = (n) => String(n).padStart(2, "0");
    const cutoff = new Date(Date.now() - 60 * 1000);
    const cutoffStr = cutoff.getUTCFullYear() + "-" + pad(cutoff.getUTCMonth() + 1) + "-" +
      pad(cutoff.getUTCDate()) + " " + pad(cutoff.getUTCHours()) + ":" +
      pad(cutoff.getUTCMinutes()) + ":" + pad(cutoff.getUTCSeconds()) + ".000Z";
    let recent = [];
    try {
      recent = $app.findRecordsByFilter("users", "created >= {:c}", "-created", 21, 0, { c: cutoffStr });
    } catch {
      recent = [];
    }
    if (recent.length >= 20) {
      throw new BadRequestError("Too many sign-ups right now. Please try again in a minute.");
    }

    // Self-registration: force safe defaults, ignore whatever the client sent.
    e.record.set("role", "user");
    e.record.set("plan", "NONE");
    e.record.set("cycle_expires_at", "0001-01-01 00:00:00.000Z");
  }
  e.next();
});

onRecordUpdateRequest((e) => {
  if (e.record && e.record.collection().name !== "users") { e.next(); return; }
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
});

// ---------------------------------------------------------------------------
// payments
// ---------------------------------------------------------------------------

onRecordCreateRequest((e) => {
  if (e.record && e.record.collection().name !== "payments") { e.next(); return; }
  const PLAN_PRICES = { SR_SIGNAL_BOX: 10, PERFECT_SIGNAL_BOX: 20 };

  if (!e.auth) throw new BadRequestError("Authentication required.");

  const isManager =
    e.auth.collection().name === "_superusers" || e.auth.get("role") === "admin";

  if (!isManager) {
    // The ledger entry always belongs to the authenticated account; admins may
    // file a payment on behalf of a customer, so their provided email is kept.
    e.record.set("user_email", e.auth.get("email"));
    e.record.set("status", "pending");

    // Anti-flood: reject new submissions while the member already has 3+
    // payments awaiting verification (catches double-clicks, retries and spam).
    let pendingOwn = [];
    try {
      pendingOwn = $app.findRecordsByFilter(
        "payments",
        "user_email = {:email} && status = 'pending'",
        "-created", 20, 0,
        { email: e.auth.get("email") }
      );
    } catch {
      pendingOwn = [];
    }
    let maxPending = 3;
    try {
      const settingsRec = $app.findFirstRecordByFilter("site_settings", "id != ''");
      const v = settingsRec.getInt("max_pending_payments");
      if (v > 0) maxPending = v;
    } catch {}
    if (pendingOwn.length >= maxPending) {
      throw new BadRequestError(
        "You already have " + pendingOwn.length + " payments awaiting desk verification. Please wait for review before submitting another."
      );
    }

    // Server-side reference sanity, per method: crypto TXIDs are 20-128
    // alphanumerics (all three networks use 64-hex); UPI UTRs are 8-30 digits.
    const refRaw = String(e.record.get("txid") || "").trim();
    const isUpi = e.record.get("method") === "upi" || e.record.get("network") === "INR-UPI";
    const refOk = isUpi ? /^[0-9]{8,30}$/.test(refRaw) : /^[a-zA-Z0-9]{20,128}$/.test(refRaw);
    if (!refOk) {
      throw new BadRequestError(isUpi
        ? "Invalid UTR. Paste the 12-digit UPI reference from your payment app."
        : "Invalid transaction hash. Paste the full TXID from your wallet.");
    }

    // Duplicate-reference guard: the same TXID/UTR must not already be pending
    // or confirmed on another payment. Resubmission after a REJECTED payment
    // is allowed (the trader may fix the amount and reuse the transfer).
    let dupe = [];
    try {
      dupe = $app.findRecordsByFilter(
        "payments",
        "txid = {:t} && status != 'rejected'",
        "-created", 1, 0,
        { t: refRaw }
      );
    } catch {
      dupe = [];
    }
    if (dupe.length > 0) {
      throw new BadRequestError(
        "This " + (isUpi ? "UTR" : "TXID") + " was already submitted and is " +
        dupe[0].get("status") + ". If it was rejected, please contact support before resubmitting."
      );
    }

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
    const m = plan.match(/BOT:\s*(.+?)\s*(?:\(|$)/);
    if (!m) throw new BadRequestError("Invalid bot purchase format.");
    let bot;
    try {
      bot = $app.findFirstRecordByFilter("bots", "name = {:name}", { name: m[1].trim() });
    } catch {
      throw new BadRequestError("Unknown bot: " + m[1].trim());
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
      const m = plan.match(/BOT:\s*(.+?)\s*(?:\(([^#)]+)(?:#[^)]+)?\)|$)/);
      if (m) {
        const platform = (m[2] ? m[2].trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() : "EA") || "EA";
        const rand = $security.randomString(8).toUpperCase();
        e.record.set("license_key", "AKG-" + platform + "-" + rand.slice(0, 4) + "-" + rand.slice(4, 8));

        // Offline settlement filed directly as confirmed: deliver the license
        // and Drive package to the buyer exactly like an approval would.
        try {
          let drive = "";
          try {
            const bot = $app.findFirstRecordByFilter("bots", "name = {:n}", { n: m[1].trim() });
            drive = String(bot.get("download_url") || "");
          } catch {
            // exact match missed (case drift): scan and compare in JS
            try {
              for (const b of $app.findRecordsByFilter("bots", "", "", 500, 0)) {
                if (String(b.get("name") || "").trim().toLowerCase() === m[1].trim().toLowerCase()) {
                  drive = String(b.get("download_url") || "");
                  break;
                }
              }
            } catch {}
          }
          const u = $app.findFirstRecordByFilter("users", "email = {:e}", { e: e.record.get("user_email") });
          const col = $app.findCollectionByNameOrId("notifications");
          const n = new Record(col);
          n.set("user", u.id);
          n.set("title", "License Issued — " + m[1].trim());
          n.set("body", "Your bot license is ready: " + e.record.get("license_key") + "." + (drive
            ? " Google Drive package: " + drive + " — it also stays available in My Account."
            : " The Google Drive package will be added shortly and appears in My Account automatically."));
          n.set("type", "license_issued");
          n.set("read", false);
          $app.save(n);
        } catch (err) {
          console.log("akg: license notification failed:", err);
        }
      }
    }
  }

  e.next();
});

onRecordUpdateRequest((e) => {
  if (e.record && e.record.collection().name !== "payments") { e.next(); return; }
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

  // Bot license payment: issue a random server-side license key.
  if (plan.indexOf("BOT:") === 0) {
    const m = plan.match(/BOT:\s*(.+?)\s*(?:\(([^#)]+)(?:#[^)]+)?\)|$)/);
    if (!m) throw new BadRequestError("Invalid bot purchase record; cannot issue a license key.");

    const platform = (m[2] ? m[2].trim().replace(/[^A-Z0-9]/gi, "").toUpperCase() : "EA") || "EA";
    const rand = $security.randomString(8).toUpperCase();
    const key = "AKG-" + platform + "-" + rand.slice(0, 4) + "-" + rand.slice(4, 8);

    e.record.set("license_key", key);

    // The Drive package link is the deliverable: point the buyer straight at
    // it in the approval notification (bot may not have one uploaded yet).
    let drive = "";
    try {
      const bot = $app.findFirstRecordByFilter("bots", "name = {:n}", { n: m[1].trim() });
      drive = String(bot.get("download_url") || "");
    } catch (err) {
      // exact match missed (case drift): scan and compare in JS
      try {
        for (const b of $app.findRecordsByFilter("bots", "", "", 500, 0)) {
          if (String(b.get("name") || "").trim().toLowerCase() === m[1].trim().toLowerCase()) {
            drive = String(b.get("download_url") || "");
            break;
          }
        }
      } catch (err2) {}
    }
    notifyUser(
      e.record.get("user_email") || "",
      "License Issued — " + m[1].trim(),
      "Your bot license is ready: " + key + "." + (drive
        ? " Google Drive package: " + drive + " — it also stays available in My Account."
        : " The Google Drive package will be added shortly and appears in My Account automatically."),
      "license_issued"
    );
    e.next();
    return;
  }

  e.next();
});

// ---------------------------------------------------------------------------
// connector_requests
// ---------------------------------------------------------------------------

onRecordCreateRequest((e) => {
  if (e.record && e.record.collection().name !== "connector_requests") { e.next(); return; }
  if (!e.auth) throw new BadRequestError("Authentication required.");
  const isManager =
    e.auth.collection().name === "_superusers" || e.auth.get("role") === "admin";

  if (!isManager) {
    e.record.set("user_email", e.auth.get("email"));
    e.record.set("status", "pending_review");
    e.record.set("admin_notes", "");
  }
  e.next();
});

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
        { email: auth.get("email"), bot: "BOT: " + bot.get("name") }
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
  if (e.record && e.record.collection().name !== "connector_requests") { e.next(); return; }
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
});

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

// ---------------------------------------------------------------------------
// Managed accounts: credential encryption
// ---------------------------------------------------------------------------
// Users submit their MT4/MT5 login + PASSWORD + server for the managed
// account service. The password is stored AES-encrypted (never returned by
// the API - the field is schema-hidden) and can only be decrypted through the
// admin-only /api/akg/creds/{id} route below. Key comes from the
// AKG_CRED_KEY environment variable (set a strong one in production).

routerAdd("GET", "/api/akg/creds/{id}", (e) => {
  const auth = e.auth;
  const isManager = auth && (auth.collection().name === "_superusers" || auth.get("role") === "admin");
  if (!isManager) {
    e.json(403, { message: "Administrators only." });
    return;
  }

  let rec;
  try {
    rec = $app.findRecordById("connector_requests", e.request.pathValue("id"));
  } catch {
    e.json(404, { message: "Application not found." });
    return;
  }

  const enc = rec.getString("account_password").replace(/^enc:/, "");
  let password = "";
  if (enc) {
    try {
      password = $security.decrypt(enc, $os.getenv("AKG_CRED_KEY") || "akg-dev-cred-key");
    } catch {
      password = "(undecryptable - key changed?)";
    }
  }

  e.json(200, {
    id: rec.id,
    account_number: rec.getString("account_number"),
    server: rec.getString("server"),
    broker: rec.getString("broker"),
    platform: rec.getString("platform"),
    password: password,
  });
});

// Managed-account application intake. The `account_password` field is schema
// hidden (never returned by the API and not settable through the collection
// endpoints), so the public form posts to this route; the password is
// encrypted here before the record is ever persisted.
routerAdd("POST", "/api/akg/managed/apply", (e) => {
  try {
  const auth = e.auth;
  if (!auth) {
    e.json(401, { message: "Sign in to apply for account management." });
    return;
  }

  const data = e.requestInfo().body || {};
  const required = ["account_number", "server", "platform", "password"];
  for (const k of required) {
    if (!data[k] || String(data[k]).trim() === "") {
      e.json(400, { message: "Missing field: " + k });
      return;
    }
  }

  const col = $app.findCollectionByNameOrId("connector_requests");
  const rec = new Record(col);
  rec.set("user_email", auth.get("email"));
  rec.set("account_number", String(data.account_number).trim());
  rec.set("server", String(data.server).trim());
  rec.set("platform", String(data.platform).trim());
  rec.set("broker", String(data.broker || "").trim());
  rec.set("leverage", String(data.leverage || "1:100").trim());
  rec.set("risk_level", String(data.risk_level || "moderate").trim());
  rec.set("status", "pending_review");
  rec.set("admin_notes", "");
    let userShare = 70;
  try {
    const settingsRec = $app.findFirstRecordByFilter("site_settings", "id != ''");
    const v = settingsRec.getInt("default_user_share");
    if (v >= 10 && v <= 90) userShare = v;
  } catch {}
  rec.set("user_profit_share", userShare);
  rec.set("account_password", "enc:" + $security.encrypt(String(data.password), $os.getenv("AKG_CRED_KEY") || "akg-dev-cred-key"));
  $app.save(rec);

  e.json(200, { id: rec.id, message: "Application received. The desk will review your account." });
  } catch (err) {
    e.json(400, { message: "apply error: " + String(err && err.message ? err.message : err) });
  }
});

// ---------------------------------------------------------------------------
// Payments: UPI/GPay settlement
// ---------------------------------------------------------------------------
// A upi-method payment carries the UTR/reference id in `txid`, the rupee
// amount in `inr_amount`, and still records the USDT-equivalent plan price in
// `amount` so ledger math stays uniform. Same desk-verification flow.
onRecordCreateRequest((e) => {
  if (e.record && e.record.collection().name !== "payments") { e.next(); return; }
  if (e.record.get("method") === "upi") {
    e.record.set("network", "INR-UPI");
  }
  e.next();
});

// notifications: self-service updates may only toggle the read flag. The
// owner could otherwise rewrite title/body or re-address the note to a
// different user id, so those fields are restored from the stored record
// for non-manager updates.
onRecordUpdateRequest((e) => {
  if (e.record && e.record.collection().name !== "notifications") { e.next(); return; }
  const auth = e.auth;
  const isManager = auth && (auth.collection().name === "_superusers" || auth.get("role") === "admin");
  if (!isManager) {
    const orig = e.record.original();
    e.record.set("user", orig.get("user"));
    e.record.set("title", orig.get("title"));
    e.record.set("body", orig.get("body"));
    e.record.set("type", orig.get("type"));
    e.record.set("dedupe_key", orig.get("dedupe_key"));
  }
  e.next();
});

// ---------------------------------------------------------------------------
// bots: the Google Drive package link is the paid deliverable, so it is
// stripped from every bots read unless the caller is a manager or holds a
// confirmed BOT: payment for that exact bot. The public UI already hides the
// button pre-purchase, but the API rule is what actually gates it.
// ---------------------------------------------------------------------------

onRecordsListRequest((e) => {
  if (e.record && e.record.collection().name !== "bots") { e.next(); return; }
  const auth = e.auth;
  const isManager = auth && (auth.collection().name === "_superusers" || auth.get("role") === "admin");
  if (isManager) { e.next(); return; }

  let owned = null; // lazy set of lowercased owned bot names
  if (auth) {
    try {
      const recs = $app.findRecordsByFilter(
        "payments", "user_email = {:e} && status = 'confirmed'", "", 1000, 0,
        { e: String(auth.get("email") || "").trim().toLowerCase() },
      );
      owned = new Set();
      for (const p of recs) {
        const m = String(p.get("plan") || "").match(/BOT:\s*(.+?)\s*(?:\(|$)/i);
        if (m) owned.add(m[1].trim().toLowerCase());
      }
    } catch (err) {
      owned = new Set(); // fail closed: no payments visible -> no links
    }
  }

  for (const r of e.records || []) {
    if (!owned || !owned.has(String(r.get("name") || "").trim().toLowerCase())) {
      r.set("download_url", "");
    }
  }
  e.next();
});

onRecordViewRequest((e) => {
  if (e.record && e.record.collection().name !== "bots") { e.next(); return; }
  const auth = e.auth;
  const isManager = auth && (auth.collection().name === "_superusers" || auth.get("role") === "admin");
  if (isManager) { e.next(); return; }

  let ok = false;
  if (auth) {
    try {
      const recs = $app.findRecordsByFilter(
        "payments", "user_email = {:e} && status = 'confirmed'", "", 1000, 0,
        { e: String(auth.get("email") || "").trim().toLowerCase() },
      );
      const name = String(e.record.get("name") || "").trim().toLowerCase();
      ok = recs.some((p) => {
        const m = String(p.get("plan") || "").match(/BOT:\s*(.+?)\s*(?:\(|$)/i);
        return m && m[1].trim().toLowerCase() === name;
      });
    } catch (err) {
      ok = false;
    }
  }
  if (!ok) e.record.set("download_url", "");
  e.next();
});

// ---------------------------------------------------------------------------
// Traders roster for the admin console. PocketBase hides user emails from
// everyone except superusers (emailVisibility), which empties the console's
// member dossier and payment lookups. This route returns the roster with
// emails, only to console managers, so the client side stays otherwise plain.
routerAdd("GET", "/api/akg/traders", (e) => {
  const auth = e.auth;
  const isManager = auth && (auth.collection().name === "_superusers" || auth.get("role") === "admin");
  if (!isManager) {
    e.json(403, { message: "Administrators only." });
    return;
  }
  try {
    const rows = $app.findRecordsByFilter("users", "", "-created", 5000, 0).map((u) => ({
      id: u.id,
      email: String(u.get("email") || ""),
      name: String(u.get("name") || ""),
      verified: !!u.get("verified"),
      role: String(u.get("role") || ""),
      plan: String(u.get("plan") || ""),
      cycle_expires_at: String(u.get("cycle_expires_at") || ""),
      created: String(u.get("created") || ""),
    }));
    e.json(200, rows);
  } catch (err) {
    e.json(500, { message: String(err) });
  }
});
// ---------------------------------------------------------------------------
// Admin console stats (aggregates computed server-side so the browser never
// downloads full tables just to render KPIs)
routerAdd("GET", "/api/akg/stats", (e) => {
  const auth = e.auth;
  const isManager = auth && (auth.collection().name === "_superusers" || auth.get("role") === "admin");
  if (!isManager) {
    e.json(403, { message: "Administrators only." });
    return;
  }

  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString().replace("T", " ").slice(0, 23) + "Z";
  const nowIso = iso(now);
  const in3dIso = iso(now + 3 * DAY_MS);

  // findRecordsByFilter-based helpers (proven API in this JSVM build).
  const list = (col, filter, sort, params) => {
    try {
      return $app.findRecordsByFilter(col, filter, sort || "-created", 100000, 0, params || {});
    } catch {
      return [];
    }
  };
  const cP = (status) => list("payments", "status = {:s}", "-created", { s: status }).length;
  const cU = (filter, params) => list("users", filter, "created", params).length;

  const sumConfirmed = (sinceMs) => {
    try {
      const filter = sinceMs ? "status = 'confirmed' && created >= {:c}" : "status = 'confirmed'";
      const records = $app.findRecordsByFilter("payments", filter, "-created", 100000, 0, sinceMs ? { c: iso(now - sinceMs) } : {});
      let sum = 0;
      for (const r of records) sum += r.getInt("amount");
      return sum;
    } catch {
      return 0;
    }
  };

  let expiring = [];
  try {
    expiring = $app.findRecordsByFilter(
      "users",
      "role != 'admin' && plan != 'NONE' && plan != '' && cycle_expires_at >= {:now} && cycle_expires_at <= {:in3d}",
      "cycle_expires_at", 10, 0,
      { now: nowIso, in3d: in3dIso }
    ).map((u) => ({
      id: u.id,
      email: u.get("email"),
      plan: u.get("plan"),
      cycle_expires_at: u.getString("cycle_expires_at"),
    }));
  } catch {
    expiring = [];
  }

  e.json(200, {
    payments: {
      pending: cP("pending"),
      confirmed: cP("confirmed"),
      rejected: cP("rejected"),
      total: list("payments").length,
    },
    revenue: {
      total: sumConfirmed(0),
      last24h: sumConfirmed(DAY_MS),
      last7d: sumConfirmed(7 * DAY_MS),
      last30d: sumConfirmed(30 * DAY_MS),
    },
    users: {
      total: cU("role != 'admin'"),
      active: cU("role != 'admin' && plan != 'NONE' && plan != '' && cycle_expires_at >= {:n}", { n: nowIso }),
    },
    room: {
      last7d: list("messages", "created >= {:d7}", "-created", { d7: iso(now - 7 * DAY_MS) }).length,
    },
    connectors: {
      pending: list("connector_requests", "status = 'pending_review' || status = 'pending'").length,
      trading: list("connector_requests", "status = 'trading'").length,
      total: list("connector_requests").length,
    },
    expiring: expiring,
  });
});


// ---------------------------------------------------------------------------
// Signal Room
//
// messages is the readable stub (audience/author/pinned/has_image/reply_to);
// every real body and image lives in message_content, gated by API rules.
// Hook duties here:
//   - messages: force the author, validate audience, create never pins
//     (pinning goes through the update hook so the old pin can be replaced)
//   - messages update: single pinned banner (pinning unpins the old one)
//   - reactions: enforce the same gate as message_content reads
//     (create-rules cannot traverse the joined message) + fixed emoji set
// ---------------------------------------------------------------------------

var ROOM_AUDIENCES = ["all", "sr", "vip"];
var ROOM_EMOJIS = ["\uD83D\uDD25", "\uD83D\uDC4D", "\uD83C\uDFAF", "\uD83D\uDCB0", "\uD83D\uDE4F"];

var roomFetchUser = function (id, $app) {
  try {
    return $app.findRecordById("users", id);
  } catch {
    return null;
  }
};

var roomIsActive = function (u) {
  if (!u) return false;
  const plan = String(u.get("plan") || "");
  if (!plan || plan === "NONE") return false;
  let exp = 0;
  try {
    exp = new Date(String(u.get("cycle_expires_at") || "").replace(" ", "T")).getTime();
  } catch {
    exp = 0;
  }
  return exp > Date.now();
};

var roomCanReadContent = function (u, audience) {
  if (!u) return false;
  if (String(u.collectionId || "") === "_pb_users_auth_" && String(u.get("role") || "") === "admin") return true;
  if (String(u.collectionId || "") !== "_pb_users_auth_") return true; // superuser
  if (audience === "all") return true;
  if (!roomIsActive(u)) return false;
  if (audience === "sr") return true;
  return String(u.get("plan") || "") === "PERFECT_SIGNAL_BOX";
};

onRecordCreateRequest((e) => {
  if (e.record && e.record.collection().name !== "messages") { e.next(); return; }
    const rec = e.record;
  const auth = e.auth;

  const audience = String(rec.get("audience") || "all");
  if (["all", "sr", "vip"].indexOf(audience) === -1) {
    throw new BadRequestError("Unknown audience.");
  }

  rec.set("author", auth && auth.id ? auth.id : "");
  rec.set("has_image", rec.get("has_image") === true);
  // pinned is only ever adopted via the update hook (replace-pin)
  rec.set("pinned", false);
  e.next();
});

onRecordUpdateRequest((e) => {
  if (e.record && e.record.collection().name !== "messages") { e.next(); return; }
  const rec = e.record;
  const audience = String(rec.get("audience") || "all");
  if (["all", "sr", "vip"].indexOf(audience) === -1) {
    throw new BadRequestError("Unknown audience.");
  }

  const before = $app.findRecordById("messages", rec.id);
  if (rec.get("pinned") === true && before.get("pinned") !== true) {
    const others = $app.findRecordsByFilter("messages", "pinned = true", "", 50, 0);
    for (const o of others) {
      if (o.id === rec.id) continue;
      o.set("pinned", false);
      $app.save(o);
    }
  }
  e.next();
});

onRecordCreateRequest((e) => {
  if (e.record && e.record.collection().name !== "reactions") { e.next(); return; }
  const rec = e.record;
  const auth = e.auth;
  if (!auth) throw new BadRequestError("Sign in to react.");
  rec.set("user", auth.id);
  if (["\uD83D\uDD25", "\uD83D\uDC4D", "\uD83C\uDFAF", "\uD83D\uDCB0", "\uD83D\uDE4F"].indexOf(String(rec.get("emoji") || "")) === -1) {
    throw new BadRequestError("Unknown reaction.");
  }
  let msg = null;
  try { msg = $app.findRecordById("messages", rec.get("message")); } catch { msg = null; }
  if (!msg) throw new BadRequestError("Unknown message.");

  const audience = String(msg.get("audience") || "all");

  // same gate as message_content reads
  const collName = String(auth.collection().name || "");
  const isUserRec = collName === "users";
  const roleAdmin = isUserRec && String(auth.get("role") || "") === "admin";
  let mayRead = audience === "all";
  if (!mayRead && (roleAdmin || !isUserRec)) mayRead = true;
  if (!mayRead) {
    const plan = String(auth.get("plan") || "");
    let exp = 0;
    try { exp = new Date(String(auth.get("cycle_expires_at") || "").replace(" ", "T")).getTime(); } catch {}
    const isLive = plan && plan !== "NONE" && exp > Date.now();
    mayRead = audience === "sr" ? isLive : isLive && plan === "PERFECT_SIGNAL_BOX";
  }
  if (!mayRead) throw new BadRequestError("Subscribe to unlock.");
  e.next();
});

// ---------------------------------------------------------------------------
// Silent License Verification Endpoint: POST /api/license/verify
// Called by EA WebRequest on OnInit / OnTimer in MT4 / MT5
// ---------------------------------------------------------------------------

routerAdd("POST", "/api/license/verify", (e) => {
  const LICENSE_WINDOW_MS = 60 * 1000;
  const LICENSE_MAX_REQS = 30;

  try {
    let ip = "global";
    try {
      if (e.request && e.request.remoteAddr) {
        ip = String(e.request.remoteAddr).split(":")[0] || "global";
      }
    } catch (err) {
      ip = "global";
    }

    const now = Date.now();
    const rateKey = "rate_license_" + ip;
    let rateInfo = null;
    try {
      if ($app.store().has(rateKey)) {
        rateInfo = $app.store().get(rateKey);
      }
    } catch (err) {}

    if (!rateInfo || (now - Number(rateInfo.ts || 0)) > LICENSE_WINDOW_MS) {
      rateInfo = { ts: now, count: 1 };
    } else {
      rateInfo.count = Number(rateInfo.count || 0) + 1;
      if (rateInfo.count > LICENSE_MAX_REQS) {
        e.json(429, { valid: false, message: "Rate limit exceeded. Please wait a moment." });
        return;
      }
    }
    try {
      $app.store().set(rateKey, rateInfo);
    } catch (err) {}

    let body = {};
    try {
      body = e.requestInfo().body || {};
    } catch (err) {
      body = {};
    }

    const key = String(body.key || "").trim().toUpperCase();
    const account = String(body.account || "").trim();
    const platform = String(body.platform || "").trim().toUpperCase();

    if (!key || !account) {
      e.json(400, { valid: false, message: "License key and account number are required." });
      return;
    }

    let payment = null;
    try {
      const list = $app.findRecordsByFilter(
        "payments",
        "license_key = {:key} && status = 'confirmed'",
        "-created",
        1,
        0,
        { key: key }
      );
      if (list && list.length > 0) payment = list[0];
    } catch (err) {
      console.log("akg: license verify find error:", err);
      payment = null;
    }

    if (!payment) {
      e.json(404, { valid: false, message: "Invalid or unconfirmed license key." });
      return;
    }

    const bound = String(payment.get("bound_account") || "").trim();

    // First call: silently bind account and set bound_at
    if (!bound) {
      payment.set("bound_account", account);
      payment.set("bound_at", new Date().toISOString().replace("T", " ").slice(0, 23) + "Z");
      $app.save(payment);
      e.json(200, {
        valid: true,
        bound: true,
        account: account,
        message: "License activated and bound to MetaTrader account #" + account + ".",
      });
      return;
    }

    // Subsequent calls: valid only if account matches
    if (bound === account) {
      e.json(200, {
        valid: true,
        bound: true,
        account: account,
        message: "License valid.",
      });
      return;
    }

    // Mismatch
    e.json(403, {
      valid: false,
      bound: false,
      message: "License is bound to another MetaTrader account.",
    });
  } catch (err) {
    console.log("akg: /api/license/verify unhandled error:", err);
    e.json(500, { valid: false, message: "Internal server error: " + String(err) });
  }
});

// ---------------------------------------------------------------------------
// Admin Reset License Binding: POST /api/license/reset
// ---------------------------------------------------------------------------
routerAdd("POST", "/api/license/reset", (e) => {
  const auth = e.auth;
  const isManager = auth && (auth.collection().name === "_superusers" || auth.get("role") === "admin");
  if (!isManager) {
    e.json(403, { message: "Administrators only." });
    return;
  }

  let body = {};
  try { body = e.requestInfo().body || {}; } catch { body = {}; }
  const id = String(body.id || body.payment_id || "").trim();
  const key = String(body.key || "").trim().toUpperCase();

  if (!id && !key) {
    e.json(400, { message: "Provide payment ID or license key to reset." });
    return;
  }

  let payment = null;
  try {
    if (id) {
      payment = $app.findRecordById("payments", id);
    } else {
      const list = $app.findRecordsByFilter(
        "payments",
        "license_key = {:k}",
        "-created",
        1,
        0,
        { k: key }
      );
      if (list && list.length > 0) payment = list[0];
    }
  } catch {
    payment = null;
  }

  if (!payment) {
    e.json(404, { message: "Payment/license record not found." });
    return;
  }

  const prev = String(payment.get("bound_account") || "");
  payment.set("bound_account", "");
  payment.set("bound_at", "");
  $app.save(payment);

  e.json(200, {
    success: true,
    message: "License binding reset successfully.",
    previous_account: prev,
  });
});

