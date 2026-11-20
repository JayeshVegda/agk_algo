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
    // The collection field is hidden, so take the value from the signup body.
    const phone = String((e.requestInfo().body || {}).phone_number || "").trim().replace(/[\s().-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new BadRequestError("Enter a phone number with its country code, such as +91 98765 43210.");
    }
    e.record.set("phone_number", phone);
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

  const membership = require(__hooks + "/membership.js");

  if (!e.auth) throw new BadRequestError("Authentication required.");

  const isManager =
    e.auth.collection().name === "_superusers" || e.auth.get("role") === "admin";

  if (!isManager) {
    // The ledger entry always belongs to the authenticated account; admins may
    // file a payment on behalf of a customer, so their provided email is kept.
    e.record.set("user_email", e.auth.get("email"));
    e.record.set("status", "pending");
    e.record.set("license_key", "");
    e.record.set("bound_account", "");
    e.record.set("bound_at", "");

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

    e.record.set("admin_notes", "");
  }

  const reference = e.record.getString("txid").trim();
  const method = e.record.getString("method");
  const network = e.record.getString("network").trim();
  const isUpi = method === "upi" || network === "INR-UPI";
  const body = e.requestInfo().body || {};
  const alreadyPaid = body.already_paid === true;
  const settings = e.app.findRecordsByFilter("site_settings", "", "", 1, 0)[0];
  const rate = settings ? settings.getFloat("usdt_inr_rate") : 0;
  if (!isManager) {
    if (!network || (method !== (isUpi ? "upi" : "crypto")) || (isUpi && network !== "INR-UPI")) {
      throw new BadRequestError("Choose a valid payment method and network.");
    }
    const enabled = isUpi
      ? settings && settings.getBool("inr_enabled") && settings.getString("upi_id").trim() && rate > 0
      : settings && settings.getBool("crypto_enabled") &&
        e.app.findRecordsByFilter("wallets", "enabled = true && label = {:network} && address != ''", "", 1, 0, { network }).length > 0;
    if (!enabled && !alreadyPaid) {
      throw new BadRequestError("This payment method is unavailable. If you already sent money, choose I already paid for help.");
    }
  }
  e.record.set("network", network);
  if (!isManager && !(isUpi ? /^[0-9]{8,30}$/ : /^[a-zA-Z0-9]{20,128}$/).test(reference)) {
    throw new BadRequestError("Enter the full payment reference from your wallet or UPI app.");
  }
  e.record.set("txid", reference);
  if (isUpi) {
    e.record.set("method", "upi");
    e.record.set("network", "INR-UPI");
  }

  // Validate plan + amount against server-side prices (clients cannot pay $1 for a $299 bot).
  const plan = e.record.get("plan") || "";
  const amount = Number(e.record.get("amount") || 0);
  let expected = 0;
  let paymentCycle;
  let needsReview = !isManager && alreadyPaid;

  if (membership.SIGNAL_PLANS.includes(plan)) {
    const now = Date.now();
    const id = e.record.getString("signal_cycle");
    const cycle = id ? e.app.findRecordById("signal_cycles", id) :
      isManager ? membership.schedule(e.app, e.record.getString("user_email"), now).checkout : null;
    if (!cycle || cycle.getBool("is_draft")) {
      throw new BadRequestError("Select a signal cycle that has opened for payments.");
    }
    paymentCycle = cycle;
    e.record.set("signal_cycle", cycle.id);
    expected = cycle.getFloat(plan === membership.SIGNAL_PLANS[0] ? "sr_price" : "vip_price");
    const dateChanged = ["starts_at", "ends_at"].some((field) =>
      body[field] && Date.parse(String(body[field]).replace(" ", "T")) !== membership.time(cycle, field));
    const cycleChanged = !membership.windowOpen(cycle, now) || amount !== expected || dateChanged;
    if (cycleChanged && !isManager && !alreadyPaid) {
      throw new BadRequestError("This cycle or price changed. If you already paid, submit your reference for review.");
    }
    needsReview = needsReview || cycleChanged;
  } else if (plan.indexOf("BOT:") === 0) {
    e.record.set("signal_cycle", "");
    const m = plan.match(/BOT:\s*(.+?)\s*(?:\(|$)/);
    if (!m) throw new BadRequestError("Invalid bot purchase format.");
    let bot;
    try {
      bot = !isManager && body.bot_id
        ? e.app.findRecordById("bots", String(body.bot_id))
        : e.app.findFirstRecordByFilter("bots", "name = {:name}", { name: m[1].trim() });
    } catch {
      throw new BadRequestError("Unknown bot: " + m[1].trim());
    }
    if (!isManager && !alreadyPaid && !bot.getBool("is_live")) throw new BadRequestError("This robot is unavailable.");
    if (!isManager) {
      e.record.set("plan", "BOT: " + bot.getString("name") + " (" + (bot.getString("platform") || "EA") + ")");
    }
    expected = bot.getFloat("price");
  } else {
    throw new BadRequestError("Unknown plan.");
  }

  if (amount !== expected && !needsReview) {
    throw new BadRequestError(
      "Amount " + amount + " USDT does not match the price of the selected plan (" + expected + " USDT)."
    );
  }

  if (needsReview) {
    e.record.set("status", "pending");
    e.record.set("admin_notes", "Manual payment review requested. Verify the destination, actual amount and order eligibility before approving.");
  }
  e.record.set("amount", expected);
  if (isUpi) {
    if (rate > 0) {
      e.record.set("inr_amount", Math.round(expected * rate));
    } else if (needsReview) {
      e.record.set("inr_amount", 0);
      e.record.set("admin_notes", e.record.getString("admin_notes") + " The INR rate is unavailable.");
    } else {
      throw new BadRequestError("The UPI exchange rate is unavailable. Contact the desk with your payment reference.");
    }
  } else {
    e.record.set("inr_amount", 0);
  }

  const confirmed = isManager && e.record.getString("status") === "confirmed";
  if (confirmed) {
    if (plan.startsWith("BOT:")) e.record.set("license_key", membership.licenseKey(plan));
    else e.app.findFirstRecordByFilter("users", "email = {:email}", { email: e.record.getString("user_email") });
  }
  try {
    if (paymentCycle) {
      const app = e.app;
      app.runInTransaction((tx) => {
        const current = tx.findRecordById("signal_cycles", paymentCycle.id);
        if (current.getBool("is_draft")) throw new BadRequestError("This signal cycle is unavailable.");
        const moved = ["starts_at", "ends_at", "sr_price", "vip_price"].some((field) =>
          current.getString(field) !== paymentCycle.getString(field));
        if (moved) {
          throw new BadRequestError("The cycle changed. Refresh and submit your reference for review if you already paid.");
        }
        e.app = tx;
        try { e.next(); } finally { e.app = app; }
      });
    } else {
      e.next();
    }
  } catch (error) {
    if (String(error).includes("Payment reference already submitted")) {
      throw new BadRequestError("This payment reference is already in the ledger.");
    }
    throw error;
  }
  if (confirmed) {
    const notice = plan.startsWith("BOT:")
      ? ["Robot license issued", "Your license key and downloads are available in My Account.", "license_issued"]
      : ["Signal cycle approved", "Your account shows when this signal cycle starts and ends.", "payment_approved"];
    require(__hooks + "/payment-approval.js").notify(e.app, e.record.getString("user_email"), notice);
  }
  if (!isManager) {
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
});

onRecordUpdateRequest((e) => {
  require(__hooks + "/payment-approval.js").update(e);
}, "payments");

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

    if (!require(__hooks + "/bot-publication.js").owns(e.app, auth, bot.getString("name"))) {
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
  const { findExpiries } = require(__hooks + "/membership-expiry.js");
  const col = $app.findCollectionByNameOrId("notifications");
  let after = "";
  while (true) {
    const members = findExpiries($app, now, now - DAY_MS, now + 8 * DAY_MS, after, 200);
    if (!members.length) break;
    for (const u of members) {
      const s = u.expiry;
      const expiry = Date.parse(s.replace(" ", "T"));
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
        ? "Your " + u.plan + " cycle has ended. Check Signal Plans for the next cycle."
        : "Your " + u.plan + " cycle ends " + expiryDay + ". Check your renewal status in My Account.");
      n.set("type", "plan_expiry");
      n.set("read", false);
      n.set("dedupe_key", dedupeKey);
      try {
        $app.save(n);
      } catch (err) {
        console.log("akg: expiry notification failed:", err);
      }
    }
    after = members[members.length - 1].id;
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
  const key = $os.getenv("AKG_CRED_KEY");
  let password = "";
  if (enc) {
    try {
      password = $security.decrypt(enc, key);
    } catch {
      password = "(undecryptable - key changed?)";
    }
  }

  e.response.header().set("Cache-Control", "private, no-store");
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

  const key = $os.getenv("AKG_CRED_KEY");
  if (!/^[!-~]{32}$/.test(key)) {
    e.json(503, { message: "Managed-account applications are temporarily unavailable. Contact the desk for help." });
    return;
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
  rec.set("account_password", "enc:" + $security.encrypt(String(data.password), key));
  $app.save(rec);

  e.json(200, { id: rec.id, message: "Application received. The desk will review your account." });
  } catch (err) {
    e.json(400, { message: "apply error: " + String(err && err.message ? err.message : err) });
  }
});

// ---------------------------------------------------------------------------
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
    const now = Date.now();
    const membership = require(__hooks + "/membership.js");
    const cycles = new Map();
    const schedule = new Map();
    const stamp = new Date(now).toISOString().replace("T", " ");
    const available = e.app.findRecordsByFilter("signal_cycles", "ends_at > {:now}", "starts_at", 0, 0, { now: stamp });
    for (const cycle of available) cycles.set(cycle.id, cycle);
    const enrollments = e.app.findRecordsByFilter("payments",
      "status = 'confirmed' && signal_cycle.ends_at > {:now}", "", 0, 0, { now: stamp });
    for (const payment of enrollments) {
      const cycle = cycles.get(payment.getString("signal_cycle"));
      if (!cycle || membership.time(cycle, "starts_at") > now || membership.paused(cycle, now)) continue;
      schedule.set(payment.getString("user_email"), { plan: payment.getString("plan"), ends: cycle.getString("ends_at") });
    }
    const rows = $app.findRecordsByFilter("users", "", "-created", 5000, 0).map((u) => {
      const email = u.getString("email");
      const enrolled = schedule.get(email);
      const legacyPlan = u.getString("plan");
      const legacyEnd = u.getString("cycle_expires_at");
      const legacyActive = membership.SIGNAL_PLANS.includes(legacyPlan) && membership.time(u, "cycle_expires_at") > now;
      const useScheduled = enrolled && (!legacyActive || (legacyPlan === enrolled.plan
        ? Date.parse(enrolled.ends.replace(" ", "T")) > membership.time(u, "cycle_expires_at")
        : enrolled.plan === "PERFECT_SIGNAL_BOX"));
      return {
        id: u.id,
        effective_plan: useScheduled ? enrolled.plan : legacyPlan,
        effective_cycle_expires_at: useScheduled ? enrolled.ends : legacyEnd,
        email: String(u.get("email") || ""),
        phone_number: u.getString("phone_number"),
        name: String(u.get("name") || ""),
        verified: !!u.get("verified"),
        role: String(u.get("role") || ""),
        plan: String(u.get("plan") || ""),
        cycle_expires_at: String(u.get("cycle_expires_at") || ""),
        created: String(u.get("created") || ""),
      };
    });
    e.response.header().set("Cache-Control", "private, no-store");
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

  const counts = new DynamicModel({
    pending: 0, confirmed: 0, rejected: 0, paymentTotal: 0,
    revenue: -0, revenue24: -0,
    revenue7: -0, revenue30: -0,
  });
  e.app.db().newQuery(`
    SELECT COUNT(*) AS paymentTotal,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
      COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
      COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0) AS revenue,
      COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed' AND created >= {:day}), 0) AS revenue24,
      COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed' AND created >= {:week}), 0) AS revenue7,
      COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed' AND created >= {:month}), 0) AS revenue30
    FROM payments
  `).bind({ day: iso(now - DAY_MS), week: iso(now - 7 * DAY_MS), month: iso(now - 30 * DAY_MS) }).one(counts);

  const { findExpiries } = require(__hooks + "/membership-expiry.js");
  const expiring = findExpiries(e.app, now, now, now + 3 * DAY_MS, "", 10, true)
    .map(({ id, email, plan, expiry }) => ({ id, email, plan, cycle_expires_at: expiry }));
  const users = new DynamicModel({ total: 0, active: 0 });
  e.app.db().newQuery(`
    SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE
      (plan IN ('SR_SIGNAL_BOX', 'PERFECT_SIGNAL_BOX') AND cycle_expires_at > {:now})
      OR id IN (SELECT sr_member FROM active_signal_access)
    ) AS active FROM users WHERE role != 'admin'
  `).bind({ now: nowIso }).one(users);

  const room = new DynamicModel({ last7d: 0 });
  e.app.db().newQuery("SELECT COUNT(*) AS last7d FROM messages WHERE created >= {:week}")
    .bind({ week: iso(now - 7 * DAY_MS) }).one(room);

  const connectors = new DynamicModel({ pending: 0, trading: 0, total: 0 });
  e.app.db().newQuery(`
    SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status IN ('pending_review', 'pending')) AS pending,
      COUNT(*) FILTER (WHERE status = 'trading') AS trading FROM connector_requests
  `).one(connectors);

  e.json(200, {
    payments: { pending: counts.pending, confirmed: counts.confirmed, rejected: counts.rejected, total: counts.paymentTotal },
    revenue: { total: counts.revenue, last24h: counts.revenue24, last7d: counts.revenue7, last30d: counts.revenue30 },
    users: { total: users.total, active: users.active },
    room: { last7d: room.last7d },
    connectors: { pending: connectors.pending, trading: connectors.trading, total: connectors.total },
    expiring,
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

  if (!rec.getBool("pinned")) { e.next(); return; }

  const app = e.app;
  app.runInTransaction((tx) => {
    const others = tx.findRecordsByFilter("messages", "pinned = true && id != {:id}", "", 0, 0, { id: rec.id });
    for (const other of others) {
      other.set("pinned", false);
      tx.save(other);
    }
    e.app = tx;
    try { e.next(); } finally { e.app = app; }
  });
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

  // Check the same collection rule that protects the message body and files.
  const contentCollection = e.app.findCollectionByNameOrId("message_content");
  const content = e.app.findFirstRecordByFilter(contentCollection, "message = {:id}", { id: msg.id });
  const mayRead = auth.collection().name === "_superusers" ||
    e.app.canAccessRecord(content, e.requestInfo(), contentCollection.viewRule);
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

