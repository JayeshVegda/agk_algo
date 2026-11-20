const { time, CYCLE_MS } = require(__hooks + "/membership.js");
const IST_OFFSET = 19800000;

function stamp(ms) {
  return new Date(ms).toISOString();
}

function indiaDay(ms) {
  return stamp(ms + IST_OFFSET).slice(0, 10);
}

function cycleBounds(app, now) {
  const published = "is_draft = false";
  const params = { now: stamp(now).replace("T", " ") };
  const before = app.findRecordsByFilter("signal_cycles", published + " && starts_at <= {:now}", "-ends_at", 1, 0, params)[0];
  const next = app.findRecordsByFilter("signal_cycles", published + " && starts_at > {:now}", "starts_at", 1, 0, params)[0];
  return { before, next };
}

function saveCycle(app, record, start, now, previous) {
  const isNew = !record;
  const cycle = record || new Record(app.findCollectionByNameOrId("signal_cycles"));
  cycle.set("name", "Signal cycle from " + indiaDay(start));
  cycle.set("starts_at", stamp(start));
  cycle.set("ends_at", stamp(start + CYCLE_MS));
  cycle.set("renewals_at", stamp(Math.min(start, now)));
  cycle.set("allow_late_join", true);
  cycle.set("pause_from", "");
  cycle.set("pause_until", "");
  if (isNew) {
    const settings = previous ? null : app.findRecordsByFilter("site_settings", "", "", 1, 0)[0];
    cycle.set("sr_price", previous?.getFloat("sr_price") || settings?.getFloat("plan_sr_price") || 10);
    cycle.set("vip_price", previous?.getFloat("vip_price") || settings?.getFloat("plan_vip_price") || 20);
  }
  app.save(cycle);
  return cycle;
}

function ensure(app, now) {
  const state = cycleBounds(app, now);
  if (!state.before || state.next) return;

  app.runInTransaction((tx) => {
    const { before, next } = cycleBounds(tx, now);
    if (!before || next) return;
    const boundary = time(before, "ends_at");
    if (boundary > now) {
      saveCycle(tx, null, boundary, now, before);
    } else {
      // Resume from the current 30-day block after extended downtime.
      const start = boundary + Math.floor((now - boundary) / CYCLE_MS) * CYCLE_MS;
      const active = saveCycle(tx, null, start, now, before);
      saveCycle(tx, null, start + CYCLE_MS, now, active);
    }
  });
}

function setNextStart(app, input, now) {
  const date = typeof input === "string" ? input : "";
  const start = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(date + "T00:00:00+05:30") : NaN;
  if (!Number.isFinite(start) || indiaDay(start) !== date || start < Date.parse(indiaDay(now) + "T00:00:00+05:30")) {
    throw new BadRequestError("Choose a valid start date today or later.");
  }

  app.runInTransaction((tx) => {
    const { before, next } = cycleBounds(tx, now);
    if (before && start < time(before, "ends_at")) {
      throw new BadRequestError("The next cycle must start after the current cycle ends.");
    }
    if (next && time(next, "starts_at") === start) return;
    if (next && tx.findRecordsByFilter("payments", "signal_cycle = {:id} && status != 'rejected'", "", 1, 0, { id: next.id }).length) {
      throw new BadRequestError("This cycle already has orders. Its start date is locked.");
    }
    const conflicts = tx.findRecordsByFilter("signal_cycles",
      "is_draft = false && id != {:id} && starts_at < {:end} && ends_at > {:start}", "", 1, 0,
      { id: next?.id || "", start: stamp(start).replace("T", " "), end: stamp(start + CYCLE_MS).replace("T", " ") });
    if (conflicts.length) throw new BadRequestError("The selected dates overlap " + conflicts[0].getString("name") + ".");
    saveCycle(tx, next, start, now, before);
  });
  ensure(app, now);
}

module.exports = { ensure, setNextStart };
