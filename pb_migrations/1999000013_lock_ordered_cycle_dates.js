migrate((app) => {
  app.db().newQuery(`
    CREATE TRIGGER signal_cycles_lock_ordered_dates
    BEFORE UPDATE OF starts_at, ends_at ON signal_cycles
    WHEN (NEW.starts_at != OLD.starts_at OR NEW.ends_at != OLD.ends_at) AND EXISTS (
      SELECT 1 FROM payments WHERE signal_cycle = OLD.id AND status != 'rejected'
    )
    BEGIN
      SELECT RAISE(ABORT, 'Signal cycle dates are locked by active orders');
    END
  `).execute();
});
