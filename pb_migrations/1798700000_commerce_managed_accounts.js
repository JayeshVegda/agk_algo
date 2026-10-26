/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: commerce + managed-accounts schema.
// - site_settings: UPI/GPay details, QR image, INR rate, support contacts
// - connector_requests: encrypted broker password (hidden field), broker name,
//   profit split for the managed-account service (70/30 default)
// - payments: settlement method (crypto | upi) + INR amount for GPay orders
migrate((app) => {
  const addField = (collection, field) => {
    const exists = collection.fields.some((f) => f.name === field.name);
    if (!exists) {
      collection.fields.add(new Field(field));
      return true;
    }
    return false;
  };

  // 1. site_settings
  try {
    const s = app.findCollectionByNameOrId("site_settings");
    let changed = false;
    changed = addField(s, { type: "text", name: "upi_id", max: 120 }) || changed;
    changed = addField(s, { type: "text", name: "payee_name", max: 120 }) || changed;
    changed = addField(s, { type: "text", name: "upi_qr_url", max: 100000 }) || changed;
    changed = addField(s, { type: "text", name: "support_email", max: 160 }) || changed;
    changed = addField(s, { type: "text", name: "support_phone", max: 40 }) || changed;
    changed = addField(s, { type: "number", name: "usdt_inr_rate", min: 0 }) || changed;
    changed = addField(s, { type: "bool", name: "inr_enabled" }) || changed;
    if (changed) app.save(s);
  } catch {}

  // 2. connector_requests: hidden password + broker + profit split + stage
  try {
    const c = app.findCollectionByNameOrId("connector_requests");
    let changed = false;
    // Hidden field: writable via API, never returned in responses (admins use
    // the decrypt endpoint). The create/update hook stores it AES-encrypted.
    changed = addField(c, { type: "text", name: "account_password", hidden: true, max: 500 }) || changed;
    changed = addField(c, { type: "text", name: "broker", max: 120 }) || changed;
    changed = addField(c, { type: "number", name: "user_profit_share", min: 0, max: 100 }) || changed;
    if (changed) app.save(c);
  } catch {}

  // 3. payments: method + INR amount
  try {
    const p = app.findCollectionByNameOrId("payments");
    let changed = false;
    changed = addField(p, { type: "select", name: "method", maxSelect: 1, values: ["crypto", "upi"] }) || changed;
    changed = addField(p, { type: "number", name: "inr_amount", min: 0 }) || changed;
    if (changed) app.save(p);
  } catch {}
}, (app) => {
  // best-effort down: remove added fields
  const drop = (colName, names) => {
    try {
      const col = app.findCollectionByNameOrId(colName);
      let changed = false;
      for (const n of names) {
        const f = col.fields.find((x) => x.name === n);
        if (f) { col.fields.remove(f); changed = true; }
      }
      if (changed) app.save(col);
    } catch {}
  };
  drop("site_settings", ["upi_id", "payee_name", "upi_qr_url", "support_email", "support_phone", "usdt_inr_rate", "inr_enabled"]);
  drop("connector_requests", ["account_password", "broker", "user_profit_share"]);
  drop("payments", ["method", "inr_amount"]);
});
