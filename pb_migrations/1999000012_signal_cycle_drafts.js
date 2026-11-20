migrate((app) => {
  const cycles = app.findCollectionByNameOrId("signal_cycles");
  cycles.fields.add(new Field({ name: "is_draft", type: "bool" }));
  cycles.listRule = 'is_draft = false || @request.auth.role = "admin"';
  cycles.viewRule = cycles.listRule;
  app.save(cycles);

  // Hide the reported test cycle only if there are no active orders to preserve.
  app.db().newQuery(`
    UPDATE signal_cycles SET is_draft = 1
    WHERE name = 'Test Cycle 1795177533' AND NOT EXISTS (
      SELECT 1 FROM payments WHERE signal_cycle = signal_cycles.id AND status != 'rejected'
    )
  `).execute();

  // Enforce the draft/order invariant even if two requests race between
  // validation and saving, or a record is written through an import.
  app.db().newQuery(`
    CREATE TRIGGER signal_cycles_no_active_order_draft
    BEFORE UPDATE OF is_draft ON signal_cycles
    WHEN NEW.is_draft = 1 AND OLD.is_draft = 0 AND EXISTS (
      SELECT 1 FROM payments WHERE signal_cycle = NEW.id AND status != 'rejected'
    )
    BEGIN
      SELECT RAISE(ABORT, 'Signal cycle has active orders');
    END
  `).execute();

  for (const [action, event] of [["insert", "INSERT"], ["update", "UPDATE OF signal_cycle, status"]]) {
    app.db().newQuery(`
      CREATE TRIGGER payments_no_draft_cycle_${action} BEFORE ${event} ON payments
      WHEN NEW.status != 'rejected' AND EXISTS (
        SELECT 1 FROM signal_cycles WHERE id = NEW.signal_cycle AND is_draft = 1
      )
      BEGIN
        SELECT RAISE(ABORT, 'Signal cycle is a draft');
      END
    `).execute();
  }
});
