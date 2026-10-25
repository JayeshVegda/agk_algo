/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_491071855")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
    "listRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || user_email = @request.auth.email)",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || user_email = @request.auth.email)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_491071855")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || @request.auth.collectionName = \"_superusers\")",
    "listRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || @request.auth.collectionName = \"_superusers\")",
    "viewRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
})
