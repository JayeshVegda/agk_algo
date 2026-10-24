/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(10, new Field({
    "help": "",
    "hidden": false,
    "id": "select1466534506",
    "maxSelect": 1,
    "name": "role",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "user",
      "admin"
    ]
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "help": "",
    "hidden": false,
    "id": "select3713686397",
    "maxSelect": 1,
    "name": "plan",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "NONE",
      "SR_SIGNAL_BOX",
      "PERFECT_SIGNAL_BOX"
    ]
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "help": "",
    "hidden": false,
    "id": "date1598664666",
    "max": "",
    "min": "",
    "name": "cycle_expires_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("select1466534506")

  // remove field
  collection.fields.removeById("select3713686397")

  // remove field
  collection.fields.removeById("date1598664666")

  return app.save(collection)
})
