function update(e) {
  const membership = require(__hooks + "/membership.js");
  const app = e.app;
  const body = e.requestInfo().body || {};
  const changesStatus = Object.prototype.hasOwnProperty.call(body, "status") ||
    Object.prototype.hasOwnProperty.call(body, "status+") || Object.prototype.hasOwnProperty.call(body, "status-");
  let notice;
  app.runInTransaction((tx) => {
    // Reload inside the transaction so retries use the committed payment state.
    const before = tx.findRecordById("payments", e.record.id);
    const previous = before.getString("status");
    const requested = changesStatus ? e.record.getString("status") : previous;
    e.record.set("status", requested);
    const plan = before.getString("plan");
    const email = before.getString("user_email");
    const cycle = before.getString("signal_cycle");
    const signal = membership.SIGNAL_PLANS.includes(plan);
    for (const field of ["plan", "user_email", "signal_cycle"]) e.record.set(field, before.get(field));

    if (previous !== requested && requested === "confirmed") {
      if (signal && cycle) {
        if (tx.findRecordById("signal_cycles", cycle).getBool("is_draft")) {
          throw new BadRequestError("Publish the signal cycle before approving its payment.");
        }
        tx.findFirstRecordByFilter("users", "email = {:email}", { email });
        notice = ["Signal cycle approved", "Your account shows when this signal cycle starts and ends.", "payment_approved"];
      } else if (signal) {
        membership.applyLegacy(tx, before, 1);
        notice = ["Payment approved", "Your signal membership was extended by 30 days.", "payment_approved"];
      } else if (plan.startsWith("BOT:")) {
        const key = membership.licenseKey(plan);
        e.record.set("license_key", key);
        notice = ["Robot license issued", "Your license key and downloads are available in My Account.", "license_issued"];
      }
    }
    if (previous === "confirmed" && requested !== "confirmed") {
      if (signal && !cycle) membership.applyLegacy(tx, before, -1);
      if (plan.startsWith("BOT:")) {
        e.record.set("license_key", "");
        e.record.set("bound_account", "");
        e.record.set("bound_at", "");
      }
    } else if (previous === "confirmed" && plan.startsWith("BOT:")) {
      e.record.set("license_key", before.get("license_key"));
      e.record.set("bound_account", before.get("bound_account"));
      e.record.set("bound_at", before.get("bound_at"));
    }
    if (requested === "rejected" && previous !== requested) {
      const reason = e.record.getString("admin_notes");
      notice = ["Payment rejected", reason || "The desk rejected your payment.", "payment_rejected"];
    }
    e.app = tx;
    try { e.next(); } finally { e.app = app; }
  });
  if (notice) notify(app, e.record.getString("user_email"), notice);
}

function notify(app, email, notice) {
  try {
    const user = app.findFirstRecordByFilter("users", "email = {:email}", { email });
    const notification = new Record(app.findCollectionByNameOrId("notifications"));
    notification.set("user", user.id);
    notification.set("title", notice[0]);
    notification.set("body", notice[1]);
    notification.set("type", notice[2]);
    app.save(notification);
  } catch (err) {
    console.log("akg: payment notification failed:", err);
  }
}

module.exports = { update, notify };
