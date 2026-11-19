function save(e) {
  const body = e.requestInfo().body || {};
  if (Object.prototype.hasOwnProperty.call(body, "download_url")) {
    const url = String(body.download_url || "").trim();
    if (url && !/^https:\/\/[^\s]+$/i.test(url)) {
      throw new BadRequestError("Enter an HTTPS package link.");
    }
    e.record.set("download_url", url);
  }
  const before = e.record.original();
  const published = before ? before.getString("published_at") : "";
  e.record.set("published_at", e.record.getBool("is_live") && !published && (e.record.isNew() || !before || !before.getBool("is_live"))
    ? new Date().toISOString() : published);
  e.next();
}

function owns(app, auth, name) {
  const purchases = app.findRecordsByFilter("payments",
    "user_email = {:email} && status = 'confirmed' && plan ~ {:prefix}", "", 0, 0,
    { email: auth.getString("email"), prefix: "BOT: " + name });
  const prefix = "BOT: " + name;
  return purchases.some((payment) => {
    const plan = payment.getString("plan");
    return plan === prefix || plan.startsWith(prefix + " (");
  });
}

module.exports = { save, owns };
