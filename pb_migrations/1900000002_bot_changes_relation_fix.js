/// <reference path="../pb_data/types.d.ts" />

// 1900000002_bot_changes_relation_fix.js
// Fixes two defects from 1900000000:
//  1. bot_changes.bot was created as a plain text field (the raw Collection
//     constructor silently ignored the relation-only options), so relation
//     validation, cascade delete, and admin-editor semantics never applied.
//     Recreate it as a real relation -> bots (cascadeDelete, required) and
//     restore the existing values; dangling values become deleted records.
//  2. bots numeric fields had no range validators (QA accepted price=-50).
migrate((app) => {
  // ---- bots: add min/max validators via field options ----
  const setRange = (fieldName, min, max) => {
    const c = app.findCollectionByNameOrId("bots");
    const f = c.fields.getByName(fieldName);
    if (!f || f.type() !== "number") return;
    if (min !== null) f["min"] = min;
    if (max !== null) f["max"] = max;
    app.save(c);
  };
  setRange("price", 0, null);
  setRange("pair_", null, null); // no-op guard for stray
  setRange("win_rate", 0, 100);
  setRange("drawdown", 0, 100);
  setRange("profit_factor", 0, null);
  setRange("min_lot", 0, null);

  // ---- bot_changes: retype bot to real relation ----
  const changes = app.findCollectionByNameOrId("bot_changes");
  const botField = changes.fields.getByName("bot");
  if (botField && botField.type() !== "relation") {
    const bots = app.findCollectionByNameOrId("bots");

    const stash = {}; // change id -> bot id (or null for dangling)
    const ids = {};   // bot id -> exists?
    const botsRecords = app.findRecordsByFilter("bots", "id != ''", "", 5000, 0);
    for (const b of botsRecords) ids[b.id] = true;

    const rows = app.findRecordsByFilter("bot_changes", "id != ''", "", 5000, 0);
    for (const r of rows) {
      const v = r.get("bot");
      stash[r.id] = v && ids[String(v).trim()] ? String(v).trim() : null;
    }

    // the (bot, version) unique index blocks the drop of the bot column —
    // park it while the field is swapped, then restore it at the end.
    const INDEX_NAME = "idx_bot_changes_bot_version";
    const INDEX_SQL = "CREATE UNIQUE INDEX `idx_bot_changes_bot_version` ON `bot_changes` (`bot`, `version`)";
    let parkedIndex = {};
    changes.indexes = changes.indexes.filter((ix) => {
      const name = String(ix).match(/INDEX\s+`?(\w+)`?/)?.[1] || "";
      if (name === INDEX_NAME) { parkedIndex = { sql: ix }; return false; }
      return true;
    });
    app.save(changes);

    changes.fields.removeByName("bot");
    app.save(changes);

    changes.fields.add(new Field({
      type: "relation",
      name: "bot",
      collectionId: bots.id,
      maxSelect: 1,
      required: true,
      cascadeDelete: true,
    }));
    app.save(changes);

    // restore values; delete rows whose bot no longer resolves (orphans)
    for (const r of app.findRecordsByFilter("bot_changes", "id != ''", "", 5000, 0)) {
      if (!stash[r.id]) { app.delete(r); continue; }
      r.set("bot", stash[r.id]);
      app.save(r);
    }

    changes.indexes = changes.indexes.concat([INDEX_SQL]);
    app.save(changes);
  }
}, (app) => {
  // rollback: keep as-is (forward-only fix)
});
