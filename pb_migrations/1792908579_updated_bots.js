/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1454544717")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1454544717")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || @request.auth.collectionName = \"_superusers\")",
    "deleteRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || @request.auth.collectionName = \"_superusers\")",
    "updateRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || @request.auth.collectionName = \"_superusers\")"
  }, collection)

  return app.save(collection)
})
