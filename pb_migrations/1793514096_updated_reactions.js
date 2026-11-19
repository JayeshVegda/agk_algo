/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findAllCollections().find((item) => item.id === "pbc_1549310251")
  // Fresh installs create reactions in 1999000000_signal_room.js.
  if (!collection) return

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findAllCollections().find((item) => item.id === "pbc_1549310251")
  if (!collection) return

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && user = @request.auth.id"
  }, collection)

  return app.save(collection)
})
