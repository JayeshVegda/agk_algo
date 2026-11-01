/// <reference path="../pb_data/types.d.ts" />

// 1999000001_ea_store_silent_binding.js
// EA Store updates & Silent Binding:
//   - payments: add `bound_account` and `bound_at` for hardware/account silent binding
//   - bots: add `is_live` (boolean, default true) and `backtest_image` (file attachment)

migrate((app) => {
  // 1. Update payments
  try {
    const payments = app.findCollectionByNameOrId("payments");
    let hasBoundAccount = false;
    let hasBoundAt = false;
    for (const f of payments.fields) {
      if (f.name === "bound_account") hasBoundAccount = true;
      if (f.name === "bound_at") hasBoundAt = true;
    }
    if (!hasBoundAccount) {
      payments.fields.add(new Field({
        type: "text",
        name: "bound_account",
        required: false,
      }));
    }
    if (!hasBoundAt) {
      payments.fields.add(new Field({
        type: "text",
        name: "bound_at",
        required: false,
      }));
    }
    app.save(payments);
  } catch (err) {
    console.log("payments migration error:", err);
  }

  // 2. Update bots
  try {
    const bots = app.findCollectionByNameOrId("bots");
    let hasIsLive = false;
    let hasBacktestImage = false;
    for (const f of bots.fields) {
      if (f.name === "is_live") hasIsLive = true;
      if (f.name === "backtest_image") hasBacktestImage = true;
    }
    if (!hasIsLive) {
      bots.fields.add(new Field({
        type: "bool",
        name: "is_live",
        required: false,
      }));
    }
    if (!hasBacktestImage) {
      bots.fields.add(new Field({
        type: "file",
        name: "backtest_image",
        required: false,
        maxSelect: 1,
        mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
      }));
    }
    app.save(bots);

    // Set existing bots to is_live = true by default
    const existing = app.findRecordsByFilter("bots", "", "", 500, 0);
    for (const b of existing) {
      if (b.get("is_live") === null || b.get("is_live") === undefined || b.get("is_live") === false) {
        b.set("is_live", true);
        app.save(b);
      }
    }
  } catch (err) {
    console.log("bots migration error:", err);
  }
}, (app) => {
  // Revert
  try {
    const payments = app.findCollectionByNameOrId("payments");
    payments.fields.removeByName("bound_account");
    payments.fields.removeByName("bound_at");
    app.save(payments);
  } catch {}
  try {
    const bots = app.findCollectionByNameOrId("bots");
    bots.fields.removeByName("is_live");
    bots.fields.removeByName("backtest_image");
    app.save(bots);
  } catch {}
});
