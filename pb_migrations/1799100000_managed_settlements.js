/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: managed-account profit-split settlements. One record per
// settlement period per account: balances, gross profit, and the 70/30 split.
// Traders can read their own settlements (via the account relation), only the
// desk can write.
migrate((app) => {
  const exists = (() => {
    try { app.findCollectionByNameOrId("managed_settlements"); return true; } catch { return false; }
  })();
  if (exists) return;

  const connectors = app.findCollectionByNameOrId("connector_requests");
  const col = new Collection({
    name: "managed_settlements",
    type: "base",
    fields: [
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      { type: "relation", name: "account", required: true, collectionId: connectors.id, cascadeDelete: true, maxSelect: 1 },
      { type: "text", name: "period_start", required: true, max: 20 },
      { type: "text", name: "period_end", required: true, max: 20 },
      { type: "number", name: "start_balance" },
      { type: "number", name: "end_balance" },
      { type: "number", name: "gross_profit" },
      { type: "number", name: "user_share_pct" },
      { type: "number", name: "user_amount" },
      { type: "number", name: "desk_amount" },
      { type: "select", name: "status", required: true, maxSelect: 1, values: ["due", "paid"] },
      { type: "text", name: "note", max: 400 },
    ],
    listRule: "@request.auth.id != '' && (@request.auth.role = 'admin' || account.user_email = @request.auth.email)",
    viewRule: "@request.auth.id != '' && (@request.auth.role = 'admin' || account.user_email = @request.auth.email)",
    createRule: "@request.auth.role = 'admin'",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
  });
  app.save(col);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("managed_settlements")); } catch {}
});
