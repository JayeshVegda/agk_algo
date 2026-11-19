const { time } = require(__hooks + "/membership.js");

function save(e) {
  const record = e.record;
  const start = time(record, "starts_at");
  const end = time(record, "ends_at");
  const renewals = time(record, "renewals_at");
  const pauseFrom = time(record, "pause_from");
  const pauseUntil = time(record, "pause_until");
  if (!(end > start && renewals <= start)) {
    throw new BadRequestError("Choose an end date on or after the start date and open renewals by the start date.");
  }
  if ((record.getString("pause_from") || record.getString("pause_until")) &&
      !(pauseFrom >= start && pauseUntil > pauseFrom && pauseUntil <= end)) {
    throw new BadRequestError("Choose both pause dates within the cycle.");
  }
  const app = e.app;
  app.runInTransaction((tx) => {
    const overlaps = tx.findRecordsByFilter("signal_cycles",
      "id != {:id} && starts_at < {:end} && ends_at > {:start}", "", 1, 0,
      { id: record.id, start: record.getString("starts_at"), end: record.getString("ends_at") });
    if (overlaps.length) throw new BadRequestError("These dates overlap " + overlaps[0].getString("name") + ".");
    e.app = tx;
    try { e.next(); } finally { e.app = app; }
  });
}

module.exports = { save };
