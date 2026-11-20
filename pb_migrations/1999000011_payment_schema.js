migrate((app) => {
  const payments = app.findCollectionByNameOrId("payments");
  const ownerOrAdmin = '@request.auth.id != "" && (@request.auth.role = "admin" || user_email = @request.auth.email)';
  payments.listRule = ownerOrAdmin;
  payments.viewRule = ownerOrAdmin;
  if (!payments.fields.getByName("license_key")) {
    payments.fields.add(new Field({ name: "license_key", type: "text" }));
  }
  app.save(payments);
});
