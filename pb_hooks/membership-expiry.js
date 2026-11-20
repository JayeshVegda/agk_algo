// A member with overlapping grants keeps access through the latest end date.
// Scheduled grants participate once their cycle starts. Pauses affect current
// access but do not change a cycle's expiry or renewal date.
function findExpiries(app, now, from, to, after, pageSize, sortByExpiry = false) {
  const stamp = (ms) => new Date(ms).toISOString().replace("T", " ");
  const rows = arrayOf(new DynamicModel({ id: "", email: "", expiry: "", plan: "" }));
  const order = sortByExpiry ? "expiry, id" : "id";
  app.db().newQuery(`
    WITH grants AS (
      SELECT id, email, cycle_expires_at AS expiry, plan
      FROM users WHERE role != 'admin' AND plan IN ('SR_SIGNAL_BOX', 'PERFECT_SIGNAL_BOX')
      UNION ALL
      SELECT u.id, u.email, c.ends_at, p.plan
      FROM payments p
      JOIN users u ON u.email = p.user_email
      JOIN signal_cycles c ON c.id = p.signal_cycle
      WHERE p.status = 'confirmed' AND u.role != 'admin' AND c.starts_at <= {:now}
        AND p.plan IN ('SR_SIGNAL_BOX', 'PERFECT_SIGNAL_BOX')
    ), latest AS (
      SELECT *, row_number() OVER (PARTITION BY id ORDER BY expiry DESC, plan = 'PERFECT_SIGNAL_BOX' DESC) AS rank
      FROM grants WHERE id > {:after} AND expiry >= {:from}
    )
    SELECT id, email, expiry, plan FROM latest WHERE rank = 1 AND expiry <= {:to}
    ORDER BY ${order} LIMIT {:limit}
  `).bind({ now: stamp(now), from: stamp(from), to: stamp(to), after, limit: pageSize }).all(rows);
  return rows;
}

module.exports = { findExpiries };
