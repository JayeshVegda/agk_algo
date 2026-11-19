onRecordCreateRequest((e) => {
  require(__hooks + "/cycle-editor.js").save(e);
}, "signal_cycles");

onRecordUpdateRequest((e) => {
  require(__hooks + "/cycle-editor.js").save(e);
}, "signal_cycles");

routerAdd("GET", "/api/akg/signal-schedule", (e) => {
  const membership = require(__hooks + "/membership.js");
  const now = Date.now();
  const auth = e.auth;
  const state = membership.schedule(e.app, auth ? auth.getString("email") : "", now);
  const display = (cycle) => cycle ? {
    id: cycle.id,
    name: cycle.getString("name"),
    startsAt: cycle.getString("starts_at"),
    endsAt: cycle.getString("ends_at"),
    renewalsAt: cycle.getString("renewals_at"),
    srPrice: cycle.getFloat("sr_price"),
    vipPrice: cycle.getFloat("vip_price"),
    paused: membership.paused(cycle, now),
    pauseUntil: cycle.getString("pause_until"),
  } : null;
  const legacy = auth && membership.time(auth, "cycle_expires_at") > now ? auth.getString("plan") : "";
  const plan = [state.activePlan, legacy].includes("PERFECT_SIGNAL_BOX") ? "PERFECT_SIGNAL_BOX" : state.activePlan || legacy;
  e.response.header().set("Cache-Control", "private, no-store");
  return e.json(200, {
    active: display(state.active),
    next: display(state.next),
    checkout: display(state.checkout),
    memberCycle: state.activePlan ? display(state.active) : null,
    enrolledNext: state.future ? display(state.next) : null,
    plan,
  });
});

onRecordCreateRequest((e) => {
  require(__hooks + "/bot-publication.js").save(e);
}, "bots");

onRecordUpdateRequest((e) => {
  require(__hooks + "/bot-publication.js").save(e);
}, "bots");

onRecordEnrich((e) => {
  const auth = e.requestInfo && e.requestInfo.auth;
  if (auth && (auth.getString("role") === "admin" || auth.collection().name === "_superusers")) {
    e.record.unhide("download_url");
  } else if (auth && e.record.getString("download_url")) {
    const owns = require(__hooks + "/bot-publication.js").owns;
    if (owns(e.app, auth, e.record.getString("name"))) e.record.unhide("download_url");
  }
  e.next();
}, "bots");
