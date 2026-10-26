/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: operational settings. The payments hook reads max_pending_payments
// (flood guard), the managed-apply route reads default_user_share, and the
// checkout reads crypto_enabled + checkout_note live.
migrate((app) => {
  const s = app.findCollectionByNameOrId("site_settings");
  const add = (f) => { if (!s.fields.some((x) => x.name === f.name)) s.fields.add(new Field(f)); };
  add({ type: "number", name: "max_pending_payments", min: 1, max: 20 });
  add({ type: "bool", name: "crypto_enabled" });
  add({ type: "text", name: "checkout_note", max: 400 });
  add({ type: "number", name: "default_user_share", min: 10, max: 90 });
  app.save(s);
}, (app) => {
  const s = app.findCollectionByNameOrId("site_settings");
  for (const n of ["max_pending_payments", "crypto_enabled", "checkout_note", "default_user_share"]) {
    const f = s.fields.find((x) => x.name === n);
    if (f) s.fields.remove(f);
  }
  app.save(s);
});
