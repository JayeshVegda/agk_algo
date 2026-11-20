const SIGNAL_PLANS = ["SR_SIGNAL_BOX", "PERFECT_SIGNAL_BOX"];
const CYCLE_MS = 30 * 86400000;

function time(record, field) {
  return Date.parse(record.getString(field).replace(" ", "T"));
}

function windowOpen(cycle, now) {
  return !cycle.getBool("is_draft") && time(cycle, "ends_at") > now;
}

function paused(cycle, now) {
  return time(cycle, "pause_from") <= now && time(cycle, "pause_until") > now;
}

function schedule(app, email, now) {
  const stamp = new Date(now).toISOString().replace("T", " ");
  const cycles = app.findRecordsByFilter("signal_cycles", "is_draft = false && ends_at > {:now}", "starts_at", 100, 0, { now: stamp });
  const active = cycles.find((cycle) => time(cycle, "starts_at") <= now);
  const next = cycles.find((cycle) => time(cycle, "starts_at") > now);
  const eligible = [active, next].filter((cycle) => cycle && windowOpen(cycle, now));
  const enrolled = email ? app.findRecordsByFilter("payments",
    "user_email = {:email} && status = 'confirmed' && signal_cycle.ends_at > {:now}",
    "-created", 0, 0, { email, now: stamp }) : [];
  const checkoutOptions = eligible.filter((cycle) => !enrolled.some((p) => p.getString("signal_cycle") === cycle.id));
  const checkout = checkoutOptions[0];
  const activePlan = !active || paused(active, now) ? "" :
    enrolled.filter((p) => p.getString("signal_cycle") === active.id).reduce((plan, p) =>
      plan === SIGNAL_PLANS[1] ? plan : p.getString("plan"), "");
  const future = enrolled.find((p) => next && p.getString("signal_cycle") === next.id);
  return { active, next, checkout, checkoutOptions, activePlan, future };
}

function applyLegacy(app, payment, direction) {
  const email = payment.getString("user_email");
  const user = app.findFirstRecordByFilter("users", "email = {:email}", { email });
  const now = Date.now();
  const expiry = time(user, "cycle_expires_at") || 0;
  const next = direction > 0 ? Math.max(expiry, now) + CYCLE_MS : Math.max(now, expiry - CYCLE_MS);
  user.set("cycle_expires_at", new Date(next).toISOString());
  if (direction > 0) user.set("plan", payment.getString("plan"));
  app.save(user);
}

function licenseKey(plan) {
  const match = plan.match(/BOT:\s*(.+?)\s*(?:\(([^#)]+)(?:#[^)]+)?\)|$)/);
  if (!match) throw new BadRequestError("Invalid bot purchase format.");
  const platform = (match[2] || "").replace(/[^A-Z0-9]/gi, "").toUpperCase() || "EA";
  const random = $security.randomString(8).toUpperCase();
  return "AKG-" + platform + "-" + random.slice(0, 4) + "-" + random.slice(4, 8);
}

module.exports = { SIGNAL_PLANS, CYCLE_MS, time, windowOpen, paused, schedule, applyLegacy, licenseKey };
