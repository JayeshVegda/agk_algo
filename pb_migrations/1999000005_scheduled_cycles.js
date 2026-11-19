migrate((app) => {
  const admin = '@request.auth.role = "admin"';
  const cycles = new Collection({
    name: "signal_cycles",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: admin,
    updateRule: admin,
    fields: [
      { name: "name", type: "text", required: true, max: 100 },
      { name: "starts_at", type: "date", required: true },
      { name: "ends_at", type: "date", required: true },
      { name: "renewals_at", type: "date", required: true },
      { name: "pause_from", type: "date" },
      { name: "pause_until", type: "date" },
      { name: "sr_price", type: "number", required: true, min: 0.01 },
      { name: "vip_price", type: "number", required: true, min: 0.01 },
      { name: "allow_late_join", type: "bool" },
    ],
  });
  app.save(cycles);

  const payments = app.findCollectionByNameOrId("payments");
  payments.fields.add(new Field({ name: "signal_cycle", type: "relation", collectionId: cycles.id, maxSelect: 1 }));
  payments.indexes = [
    ...(payments.indexes || []),
    "CREATE INDEX idx_payments_cycle_membership ON payments (user_email, status, signal_cycle)",
  ];
  app.save(payments);

  const bots = app.findCollectionByNameOrId("bots");
  const download = bots.fields.getByName("download_url");
  if (download) download.hidden = true;
  else bots.fields.add(new Field({ name: "download_url", type: "text", hidden: true }));
  if (!bots.fields.getByName("is_live")) {
    bots.fields.add(new Field({ name: "is_live", type: "bool" }));
  }
  bots.fields.add(new Field({ name: "published_at", type: "date" }));
  app.save(bots);
});
