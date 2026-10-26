/// <reference path="../pb_data/types.d.ts" />
// AKG ALGO: give bot_changes the standard autodate system fields.
migrate((app) => {
  const c = app.findCollectionByNameOrId("bot_changes");
  c.fields.add(new Field({ type: "autodate", name: "created", onCreate: true, onUpdate: false }));
  c.fields.add(new Field({ type: "autodate", name: "updated", onCreate: true, onUpdate: true }));
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("bot_changes");
  try { c.fields.removeByName("created"); } catch (e) {}
  try { c.fields.removeByName("updated"); } catch (e) {}
  app.save(c);
});
