/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text89163564",
        "max": 0,
        "min": 0,
        "name": "user_email",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text2980368679",
        "max": 0,
        "min": 0,
        "name": "account_number",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text1517147638",
        "max": 0,
        "min": 0,
        "name": "server",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select961728715",
        "maxSelect": 1,
        "name": "platform",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "MT4",
          "MT5"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "select2063623452",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "demo_active",
          "pending",
          "completed"
        ]
      }
    ],
    "id": "pbc_491071855",
    "indexes": [],
    "listRule": "@request.auth.id != ''",
    "name": "connector_requests",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
    "viewRule": "@request.auth.id != ''"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_491071855");

  return app.delete(collection);
})
