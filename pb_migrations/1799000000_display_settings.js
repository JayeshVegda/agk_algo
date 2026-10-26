/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: display settings. display_currency controls how amounts render
// (checkout + admin), landing_announcement renders as a strip on the public
// home page, auto_pin_trade_alerts sets the composer's default.
migrate((app) => {
  const s = app.findCollectionByNameOrId("site_settings");
  const add = (f) => { if (!s.fields.some((x) => x.name === f.name)) s.fields.add(new Field(f)); };
  add({ type: "select", name: "display_currency", maxSelect: 1, values: ["BOTH", "USD", "INR"] });
  add({ type: "text", name: "landing_announcement", max: 300 });
  add({ type: "bool", name: "auto_pin_trade_alerts" });
  app.save(s);
}, (app) => {
  const s = app.findCollectionByNameOrId("site_settings");
  for (const n of ["display_currency", "landing_announcement", "auto_pin_trade_alerts"]) {
    const f = s.fields.find((x) => x.name === n);
    if (f) s.fields.remove(f);
  }
  app.save(s);
});
