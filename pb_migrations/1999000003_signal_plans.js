/// <reference path="../pb_data/types.d.ts" />

// 1999000003_signal_plans.js
// The two subscription plans become editable from Admin Settings: name, price
// and one-line pitch. Stable ids (SR_SIGNAL_BOX / PERFECT_SIGNAL_BOX) stay
// fixed — they gate roles, grants and analytics everywhere else.

migrate((app) => {
  let settings;
  try {
    settings = app.findFirstRecordByFilter("site_settings", "id != ''");
  } catch {
    settings = null;
  }
  if (!settings) return;

  const coll = app.findCollectionByNameOrId("site_settings");
  const has = (name) => {
    try { return coll.schema.getFieldByName(name) !== null; } catch { return false; }
  };

  const FIELDS = [
    { name: "plan_sr_name", max: 80 },
    { name: "plan_sr_blurb", max: 240 },
    { name: "plan_vip_name", max: 80 },
    { name: "plan_vip_blurb", max: 240 },
  ];
  let added = false;
  for (const f of FIELDS) {
    if (!has(f.name)) {
      coll.fields.add(new Field({ type: "text", name: f.name, required: false, max: f.max }));
      added = true;
    }
  }
  for (const p of ["plan_sr_price", "plan_vip_price"]) {
    if (!has(p)) {
      coll.fields.add(new Field({ type: "number", name: p, required: false, min: 0 }));
      added = true;
    }
  }
  if (added) app.save(coll);

  // Reload: after the schema change the previously loaded record cannot bind
  // its new fields yet.
  settings = app.findFirstRecordByFilter("site_settings", "id != ''");

  // Seed the current copy so nothing looks empty on first open.
  const setIfEmpty = (field, value) => {
    if (!settings.getString(field)) settings.set(field, value);
  };
  setIfEmpty("plan_sr_name", "SR Signal Box");
  setIfEmpty(
    "plan_sr_blurb",
    "Desk-tested signals for a focused watchlist. Real-time entries, stops and targets across FX and crypto."
  );
  setIfEmpty("plan_vip_name", "Perfect Signal Box");
  setIfEmpty(
    "plan_vip_blurb",
    "For serious business. Includes the whole desks coverage plus priority briefings and 1:1 desk guidance etc."
  );
  if (!Number(settings.get("plan_sr_price"))) settings.set("plan_sr_price", 10);
  if (!Number(settings.get("plan_vip_price"))) settings.set("plan_vip_price", 20);
  app.save(settings);
}, (app) => {
  let settings;
  try {
    settings = app.findFirstRecordByFilter("site_settings", "id != ''");
  } catch {
    settings = null;
  }
  if (!settings) return;

  const coll = app.findCollectionByNameOrId("site_settings");
  for (const n of ["plan_sr_name", "plan_sr_blurb", "plan_sr_price", "plan_vip_name", "plan_vip_blurb", "plan_vip_price"]) {
    try { coll.fields.removeByName(n); } catch {}
  }
  app.save(coll);
});
