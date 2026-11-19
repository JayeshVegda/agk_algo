migrate((app) => {
  // Preserve historical duplicates. Enforce uniqueness when a new reference
  // enters the active ledger or a rejected reference is restored.
  app.db().newQuery(`
    CREATE INDEX idx_payments_normalized_reference ON payments (lower(trim(txid)))
    WHERE status <> 'rejected' AND trim(txid) <> ''
  `).execute();

  for (const [event, match] of [
    ["INSERT", ""],
    ["UPDATE OF txid, status", "AND (OLD.status = 'rejected' OR lower(trim(OLD.txid)) <> lower(trim(NEW.txid)))"],
  ]) {
    const action = event.startsWith("INSERT") ? "insert" : "update";
    app.db().newQuery(`
      CREATE TRIGGER payments_reference_${action} BEFORE ${event} ON payments
      WHEN NEW.status <> 'rejected' AND trim(NEW.txid) <> '' ${match}
        AND EXISTS (
          SELECT 1 FROM payments
          WHERE status <> 'rejected' AND trim(txid) <> '' AND id <> NEW.id
          AND lower(trim(txid)) = lower(trim(NEW.txid))
        )
      BEGIN
        SELECT RAISE(ABORT, 'Payment reference already submitted');
      END
    `).execute();
  }
});
