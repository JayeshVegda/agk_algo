/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: site_settings — server-side wallet addresses so payment addresses
// can be rotated from the admin side without a frontend redeploy.
// Read: public (checkout needs to display them). Write: admins only.
migrate((app) => {
  const exists = (() => {
    try { app.findCollectionByNameOrId("site_settings"); return true; } catch { return false; }
  })();
  if (exists) return;

  const collection = new Collection({
    "createRule": "@request.auth.role = 'admin'",
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": false,
        "type": "text"
      },
      { "type": "autodate", "name": "created", "onCreate": true, "onUpdate": false },
      { "type": "autodate", "name": "updated", "onCreate": true, "onUpdate": true },
      {
        "type": "text",
        "name": "wallet_trc20",
        "required": false,
        "max": 120,
        "presentable": true,
      },
      {
        "type": "text",
        "name": "wallet_bep20",
        "required": false,
        "max": 120,
        "presentable": true,
      },
      {
        "type": "text",
        "name": "wallet_erc20",
        "required": false,
        "max": 120,
        "presentable": true,
      },
    ],
    "id": "pbc_akgsitesettings",
    "indexes": [],
    "listRule": "",
    "name": "site_settings",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = 'admin'",
    "viewRule": "",
  });

  app.save(collection);
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("site_settings"));
  } catch {
    // already gone
  }
});
