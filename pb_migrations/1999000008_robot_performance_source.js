migrate((app) => {
  const bots = app.findCollectionByNameOrId("bots");
  bots.fields.add(new Field({ name: "performance_type", type: "select", values: ["backtest", "live"], maxSelect: 1 }));
  bots.fields.add(new Field({ name: "performance_start", type: "text", max: 10, pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" }));
  bots.fields.add(new Field({ name: "performance_end", type: "text", max: 10, pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" }));
  bots.fields.add(new Field({ name: "performance_source", type: "url" }));
  app.save(bots);
});
