migrate((app) => {
  const payments = app.findCollectionByNameOrId("payments");
  const index = "CREATE UNIQUE INDEX idx_payments_cycle_order ON payments (user_email, signal_cycle) WHERE signal_cycle != '' AND status != 'rejected'";
  payments.indexes = [...(payments.indexes || []).filter((entry) => !entry.includes("idx_payments_cycle_order")), index];
  app.save(payments);

  // Resolve the member, payment, dates, and tier in the same database row.
  const now = "strftime('%Y-%m-%d %H:%M:%fZ', 'now')";
  app.save(new Collection({
    name: "active_signal_access",
    type: "view",
    viewQuery: `SELECT p.id, u.id AS sr_member, v.id AS vip_member
      FROM payments p
      JOIN users u ON u.email = p.user_email
      LEFT JOIN users v ON v.id = u.id AND p.plan = 'PERFECT_SIGNAL_BOX'
      JOIN signal_cycles c ON c.id = p.signal_cycle
      WHERE p.status = 'confirmed' AND p.plan IN ('SR_SIGNAL_BOX', 'PERFECT_SIGNAL_BOX')
        AND c.starts_at <= ${now} AND c.ends_at > ${now}
        AND (c.pause_from = '' OR c.pause_from > ${now} OR c.pause_until <= ${now})`,
  }));

  const admin = '@request.auth.role = "admin"';
  const legacy = '@request.auth.plan != "" && @request.auth.plan != "NONE" && @request.auth.cycle_expires_at > @now';
  const content = app.findCollectionByNameOrId("message_content");
  content.listRule = '@request.auth.id != "" && (' + admin + ' || message.audience = "all"' +
    ' || (message.audience = "sr" && ((' + legacy + ') || @collection.active_signal_access.sr_member ?= @request.auth.id))' +
    ' || (message.audience = "vip" && ((' + legacy + ' && @request.auth.plan = "PERFECT_SIGNAL_BOX")' +
    ' || @collection.active_signal_access.vip_member ?= @request.auth.id)))';
  content.viewRule = content.listRule;
  app.save(content);
});
