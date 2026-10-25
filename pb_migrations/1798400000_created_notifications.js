/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: notifications collection + payments.admin_notes (rejection reason).
migrate((app) => {
  // 1. payments.admin_notes: server/admin-only reason shown to the user on rejection.
  const payments = app.findCollectionByNameOrId("pbc_631030571");
  let hasNotes = false;
  for (const f of payments.fields) {
    if (f.name === "admin_notes") { hasNotes = true; break; }
  }
  if (!hasNotes) {
    payments.fields.add(new Field({
      type: "text",
      name: "admin_notes",
      required: false,
    }));
    app.save(payments);
  }

  // 2. notifications: per-user in-app notification feed (realtime via SSE).
  //    dedupe_key prevents the expiry cron from re-sending the same reminder.
  const users = app.findCollectionByNameOrId("users");
  const exists = (() => {
    try { app.findCollectionByNameOrId("notifications"); return true; } catch { return false; }
  })();
  if (!exists) {
    const notifications = new Collection({
      name: "notifications",
      type: "base",
      fields: [
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
        { type: "relation", name: "user", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
        { type: "text", name: "title", required: true, max: 120 },
        { type: "text", name: "body", required: false, max: 500 },
        { type: "select", name: "type", required: true, maxSelect: 1, values: [
          "payment_submitted", "payment_approved", "payment_rejected",
          "license_issued", "plan_expiry", "connector_update", "admin_alert",
        ]},
        { type: "bool", name: "read", required: false },
        { type: "text", name: "dedupe_key", required: false, max: 200 },
      ],
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: null, // only server hooks create notifications
      updateRule: '@request.auth.id != "" && user = @request.auth.id', // mark as read
      deleteRule: '@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.collectionName = "_superusers")',
    });
    app.save(notifications);
  }
}, (app) => {
  // Revert: drop notifications, remove admin_notes.
  try {
    const n = app.findCollectionByNameOrId("notifications");
    app.delete(n);
  } catch {}
  const payments = app.findCollectionByNameOrId("pbc_631030571");
  payments.fields.removeByValue("admin_notes");
  app.save(payments);
})
