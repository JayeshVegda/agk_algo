/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
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
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "_clone_4CBN",
        "max": 0,
        "min": 0,
        "name": "symbol",
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
        "id": "_clone_uJWR",
        "maxSelect": 1,
        "name": "direction",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "BUY",
          "SELL"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "_clone_sm8e",
        "maxSelect": 1,
        "name": "plan_tier",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "SR_SIGNAL_BOX",
          "PERFECT_SIGNAL_BOX"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "_clone_KYlp",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "active",
          "closed",
          "cancelled"
        ]
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "_clone_CyTU",
        "max": 0,
        "min": 0,
        "name": "pnl",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "_clone_IRVJ",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "_clone_HhgH",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2909366005",
    "indexes": [],
    "listRule": "",
    "name": "signal_previews",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT signals.id, signals.symbol, signals.direction, signals.plan_tier, signals.status, signals.pnl, signals.created, signals.updated FROM signals",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2909366005");

  return app.delete(collection);
})
