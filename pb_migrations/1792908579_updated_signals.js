/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1207876327")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
    "listRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || (@request.auth.cycle_expires_at > @now && @request.auth.plan != \"\" && @request.auth.plan != \"NONE\" && (@request.auth.plan = \"PERFECT_SIGNAL_BOX\" || plan_tier = \"SR_SIGNAL_BOX\")))",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || (@request.auth.cycle_expires_at > @now && @request.auth.plan != \"\" && @request.auth.plan != \"NONE\" && (@request.auth.plan = \"PERFECT_SIGNAL_BOX\" || plan_tier = \"SR_SIGNAL_BOX\")))"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1207876327")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || @request.auth.collectionName = \"_superusers\")",
    "deleteRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || @request.auth.collectionName = \"_superusers\")",
    "listRule": "",
    "updateRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || @request.auth.collectionName = \"_superusers\")",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
