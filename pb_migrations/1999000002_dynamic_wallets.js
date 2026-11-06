/// <reference path="../pb_data/types.d.ts" />

// 1999000002_dynamic_wallets.js
// Crypto wallets become admin-managed rows instead of three fixed
// site_settings columns, so the desk can add/remove networks freely.
//
// Access:
//   wallets list/view  : public (addresses are public data)
//   wallets CUD        : admins / superusers only
// payments.network converts select-enum -> text so custom labels pass.

const ADMIN_ONLY =
  '@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.collectionName = "_superusers")';

migrate((app) => {
  // --- payments.network: select -> text (stash / drop / re-add / restore) ---
  let payments;
  try {
    payments = app.findCollectionByNameOrId("payments");
  } catch {
    payments = null;
  }
  if (payments) {
    const isSelect = (() => {
      try {
        return payments.schema.getFieldByName("network").type === "select";
      } catch {
        return false;
      }
    })();
    if (isSelect) {
      const stash = {};
      for (const r of app.findRecordsByFilter("payments", "id != ''", "-created", 5000, 0)) {
        stash[r.id] = String(r.get("network") || "");
      }
      try { payments.fields.removeByName("network"); } catch (e) {}
      app.save(payments);
      payments.fields.add(new Field({ type: "text", name: "network", required: false, max: 80 }));
      app.save(payments);
      for (const [id, value] of Object.entries(stash)) {
        let r;
        try { r = app.findRecordById("payments", id); } catch { continue; }
        r.set("network", value);
        app.save(r);
      }
    }
  }

  // --- wallets collection ---
  let wallets;
  try {
    wallets = app.findCollectionByNameOrId("wallets");
  } catch {
    wallets = new Collection({
      name: "wallets",
      type: "base",
      fields: [
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
        { type: "text", name: "label", required: true, min: 1, max: 60 },
        { type: "text", name: "address", required: true, min: 10, max: 200 },
        { type: "text", name: "note", required: false, max: 200 },
        { type: "bool", name: "enabled", required: false },
        { type: "number", name: "sort", required: false, onlyInt: true },
      ],
      listRule: "",
      viewRule: "",
      createRule: ADMIN_ONLY,
      updateRule: ADMIN_ONLY,
      deleteRule: ADMIN_ONLY,
    });
    app.save(wallets);

    // Seed one row per legacy site_settings wallet column once.
    let settings;
    try {
      settings = app.findFirstRecordByFilter("site_settings", "id != ''");
    } catch {
      settings = null;
    }
    if (settings) {
      const seed = [
        ["USDT-TRC20", settings.getString("wallet_trc20"), 10],
        ["USDT-BEP20", settings.getString("wallet_bep20"), 20],
        ["USDT-ERC20", settings.getString("wallet_erc20"), 30],
      ];
      for (const [label, address, sort] of seed) {
        if (!address) continue;
        const rec = new Record(wallets);
        rec.set("label", label);
        rec.set("address", address);
        rec.set("enabled", true);
        rec.set("sort", sort);
        app.save(rec);
      }
    }
  }
}, (app) => {
  // Down: drop the wallets collection, restore payments.network as a select
  // (values that are not legacy ones are stashed into admin_notes).
  try {
    const coll = app.findCollectionByNameOrId("wallets");
    app.delete(coll);
  } catch {}

  const LEGACY = ["USDT-TRC20", "USDT-BEP20", "USDT-ERC20", "INR-UPI"];
  let payments;
  try {
    payments = app.findCollectionByNameOrId("payments");
  } catch {
    payments = null;
  }
  if (payments) {
    let isText = false;
    try {
      isText = payments.schema.getFieldByName("network").type === "text";
    } catch {}
    if (isText) {
      const stash = {};
      for (const r of app.findRecordsByFilter("payments", "id != ''", "-created", 5000, 0)) {
        const v = String(r.get("network") || "");
        stash[r.id] = v;
        if (v && !LEGACY.includes(v) && !String(r.get("admin_notes") || "").includes("network=" + v)) {
          r.set("admin_notes", (String(r.get("admin_notes") || "") + " [network=" + v + "]").trim());
          app.save(r);
        }
      }
      try { payments.fields.removeByName("network"); } catch (e) {}
      app.save(payments);
      payments.fields.add(new Field({
        type: "select", name: "network", required: false, maxSelect: 1, values: LEGACY,
      }));
      app.save(payments);
      for (const [id, value] of Object.entries(stash)) {
        let r;
        try { r = app.findRecordById("payments", id); } catch { continue; }
        r.set("network", LEGACY.includes(value) ? value : "");
        app.save(r);
      }
    }
  }
});
