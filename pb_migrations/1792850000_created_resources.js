/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: resources collection — previously only created out-of-band by
// scripts/setup_pb.py, which broke fresh installs (the later updated_resources
// migration expects this collection id to exist). Idempotent.
migrate((app) => {
  const exists = (() => {
    try { app.findCollectionByNameOrId("pbc_3607231689"); return true; } catch { return false; }
  })();
  if (exists) return;

  const collection = new Collection({
    "name": "resources",
    "id": "pbc_3607231689",
    "type": "base",
    "system": false,
    "fields": [
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text1383243412",
        "max": 0,
        "min": 0,
        "name": "title",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
      },
      {
        "help": "",
        "hidden": false,
        "id": "select8751791276",
        "maxSelect": 1,
        "name": "category",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["social", "useful_link", "software"],
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text5622175798",
        "max": 0,
        "min": 0,
        "name": "url",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text9917559862",
        "max": 0,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text6069490245",
        "max": 0,
        "min": 0,
        "name": "icon",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text2292640023",
        "max": 0,
        "min": 0,
        "name": "badge",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
      },
      {
        "help": "",
        "hidden": false,
        "id": "number4054640474",
        "name": "sort_order",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number",
      },
      {
        "help": "",
        "hidden": false,
        "id": "bool9547599724",
        "name": "is_active",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool",
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate",
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate",
      }
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
    "indexes": []
  });

  return app.save(collection);
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("pbc_3607231689"));
  } catch {
    // already gone
  }
});
