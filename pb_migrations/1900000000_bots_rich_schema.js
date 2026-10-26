/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: bots product richness migration.
// - bots: typed stat fields (number), pairs/features/gallery as json arrays,
//   new spec fields (timeframes select, trading_style, requirements, backtest context).
// - bot_changes: related release-notes collection (relation -> bots).
// This is a retype migration: values are stashed, the field defs are replaced,
// then parsed values are written back per record.
const TF_VALUES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];

const parseList = (v) => {
  if (Array.isArray(v)) return v;
  const s = String(v || "").trim();
  if (!s || s === "[]") return [];
  if (s.startsWith("[")) { try { const j = JSON.parse(s); return Array.isArray(j) ? j : []; } catch (e) { /* fallthrough */ } }
  return s.split(/[\n,]/).map((t) => t.trim()).filter(Boolean);
};

const parseNum = (v) => {
  const n = parseFloat(String(v || "").replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
};

migrate((app) => {
  // stash current values before retyping
  const stash = {};
  const records = app.findRecordsByFilter("bots", "id != ''", "-created", 500, 0);
  for (const r of records) {
    stash[r.id] = {
      win_rate: parseNum(r.get("win_rate")),
      profit_factor: parseNum(r.get("profit_factor")),
      drawdown: parseNum(r.get("drawdown")),
      pairs: parseList(r.get("pairs")),
      features: parseList(r.get("features")),
      gallery: parseList(r.get("gallery")),
    };
  }

  const c = app.findCollectionByNameOrId("bots");

  // PB forbids in-place type changes: drop the field, save, then re-add typed,
  // save again, and finally restore the stashed values record-by-record.
  const dropField = (name) => {
    try { c.fields.removeByName(name); } catch (e) {}
  };
  ["win_rate", "profit_factor", "drawdown", "pairs", "features", "gallery"].forEach(dropField);
  app.save(c);

  const addField = (def) => c.fields.add(new Field(def));
  addField({ type: "number", name: "win_rate", min: 0, max: 100, required: false });
  addField({ type: "number", name: "profit_factor", min: 0, max: 100, required: false });
  addField({ type: "number", name: "drawdown", min: 0, max: 100, required: false });
  addField({ type: "json", name: "pairs", required: false });
  addField({ type: "json", name: "features", required: false });
  addField({ type: "json", name: "gallery", required: false });

  // new product-spec fields (fill by admin; UI renders gracefully when empty)
  addField({ type: "select", name: "timeframes", required: false, maxSelect: 4, values: TF_VALUES });
  addField({ type: "text", name: "trading_style", max: 120, required: false });
  addField({ type: "text", name: "backtest_span", max: 120, required: false });
  addField({ type: "number", name: "backtest_trades", min: 0, required: false, onlyInt: true });
  addField({ type: "number", name: "min_lot", min: 0, max: 100, required: false });
  addField({ type: "text", name: "leverage", max: 40, required: false });
  addField({ type: "text", name: "broker_note", max: 400, required: false });

  app.save(c);

  // write parsed values back
  for (const [id, s] of Object.entries(stash)) {
    let r;
    try { r = app.findRecordById("bots", id); } catch (e) { continue; }
    r.set("win_rate", s.win_rate);
    r.set("profit_factor", s.profit_factor);
    r.set("drawdown", s.drawdown);
    r.set("pairs", s.pairs);
    r.set("features", s.features);
    r.set("gallery", s.gallery);
    app.save(r);
  }

  // related release-notes collection: admin-managed, public read
  let hasChanges = false;
  try { app.findCollectionByNameOrId("bot_changes"); hasChanges = true; } catch (e) {}
  if (!hasChanges) {
    const bots = app.findCollectionByNameOrId("bots");
    const changes = new Collection({
      name: "bot_changes",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers'",
      deleteRule: "@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers'",
      indexes: ["CREATE UNIQUE INDEX idx_bot_changes_bot_version ON bot_changes (bot, version)"],
      fields: [
        { type: "text", name: "bot", collectionId: bots.id, maxSelect: 1, required: true, cascadeDelete: true },
        { type: "text", name: "version", min: 0, max: 24, required: true },
        { type: "date", name: "released", required: false },
        { type: "text", name: "summary", min: 0, max: 600, required: true },
      ],
    });
    app.save(changes);
  }
}, (app) => {
  // down: remove the changes collection, retype stats/arrays back to text
  const changes = app.findCollectionByNameOrId("bot_changes");
  if (changes) app.delete(changes);

  const stash = {};
  const records = app.findRecordsByFilter("bots", "id != ''", "-created", 500, 0);
  for (const r of records) {
    stash[r.id] = {
      win_rate: r.get("win_rate"),
      profit_factor: r.get("profit_factor"),
      drawdown: r.get("drawdown"),
      pairs: r.get("pairs"),
      features: r.get("features"),
      gallery: r.get("gallery"),
    };
  }
  const c = app.findCollectionByNameOrId("bots");
  // add() replaces matched names; but for back-typing we must first DROP the
  // typed field so the inserted text field is a fresh definition.
  const swapBack = (name, max) => {
    try { c.fields.removeByName(name); } catch (e) {}
    c.fields.add(new Field({ type: "text", name: name, required: false, max: max || 0 }));
  };
  swapBack("win_rate"); swapBack("profit_factor"); swapBack("drawdown");
  swapBack("pairs"); swapBack("features"); swapBack("gallery");
  for (const n of ["timeframes", "trading_style", "backtest_span", "backtest_trades", "min_lot", "leverage", "broker_note"]) {
    try { c.fields.removeByName(n); } catch (e) {}
  }
  app.save(c);
  for (const [id, s] of Object.entries(stash)) {
    let r;
    try { r = app.findRecordById("bots", id); } catch (e) { continue; }
    r.set("win_rate", s.win_rate == null ? "" : `${s.win_rate}%`);
    r.set("profit_factor", s.profit_factor == null ? "" : String(s.profit_factor));
    r.set("drawdown", s.drawdown == null ? "" : `${s.drawdown}%`);
    r.set("pairs", Array.isArray(s.pairs) ? s.pairs.join(", ") : "");
    r.set("features", Array.isArray(s.features) ? s.features.join(", ") : "");
    r.set("gallery", JSON.stringify(Array.isArray(s.gallery) ? s.gallery : []));
    app.save(r);
  }
});
