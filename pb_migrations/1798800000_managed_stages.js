/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: extend the managed-account stage select with the trading lifecycle
// (trading / settlement / paused) used by the admin workflow.
migrate((app) => {
  const c = app.findCollectionByNameOrId("connector_requests");
  const f = c.fields.find((x) => x.name === "status");
  if (!f) return;
  const target = ["pending", "pending_review", "in_progress", "connected", "trading", "settlement", "paused", "rejected"];
  const merged = Array.from(new Set([...(f.values || []), ...target]));
  f.values = merged;
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("connector_requests");
  const f = c.fields.find((x) => x.name === "status");
  if (f) {
    f.values = ["pending", "pending_review", "in_progress", "connected", "rejected"];
    app.save(c);
  }
});
