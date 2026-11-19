migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  // Existing accounts may have no number. The signup hook requires it for new members.
  users.fields.add(new Field({ name: "phone_number", type: "text", max: 16, hidden: true }));
  app.save(users);
});
