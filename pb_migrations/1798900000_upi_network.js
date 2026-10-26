/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: allow the INR-UPI settlement network on payments (GPay orders).
migrate((app) => {
  const p = app.findCollectionByNameOrId("payments");
  const f = p.fields.find((x) => x.name === "network");
  if (!f) return;
  f.values = Array.from(new Set([...(f.values || []), "USDT-TRC20", "USDT-BEP20", "USDT-ERC20", "INR-UPI"]));
  app.save(p);
}, (app) => {
  const p = app.findCollectionByNameOrId("payments");
  const f = p.fields.find((x) => x.name === "network");
  if (f) { f.values = ["USDT-TRC20", "USDT-BEP20", "USDT-ERC20"]; app.save(p); }
});
