function publish(e) {
  const auth = e.auth;
  if (!auth || (auth.collection().name !== "_superusers" && auth.getString("role") !== "admin")) {
    throw new ForbiddenError("Sign in as an administrator to publish.");
  }

  const app = e.app;
  const input = e.requestInfo().body || {};
  const key = typeof input.request_key === "string" ? input.request_key : "";
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(key)) {
    throw new BadRequestError("Invalid broadcast request ID.");
  }

  const body = typeof input.body === "string" ? input.body.trim() : "";
  const audience = input.audience;
  const replyTo = typeof input.reply_to === "string" ? input.reply_to : "";
  const attachments = e.findUploadedFiles("attachments") || [];
  const receiptFilter = "author_id = {:author} && request_key = {:key}";
  const params = { author: auth.id, key };
  let result;

  app.runInTransaction((tx) => {
    const existing = tx.findRecordsByFilter("signal_broadcast_receipts", receiptFilter, "", 1, 0, params)[0];
    if (existing) {
      const id = existing.getString("message_id");
      const message = tx.findRecordsByFilter("messages", "id = {:id}", "", 1, 0, { id })[0];
      const content = tx.findRecordsByFilter("message_content", "message = {:id}", "", 1, 0, { id })[0];
      result = message && content ? { message: message.publicExport(), content: content.publicExport() } : { removed: true };
      return;
    }

    if (["all", "sr", "vip"].indexOf(audience) === -1) throw new BadRequestError("Choose a broadcast audience.");
    if (!body && !attachments.length) throw new BadRequestError("Enter a message or attach an image.");
    if (body.length > 6000) throw new BadRequestError("Broadcasts can contain up to 6,000 characters.");
    if (attachments.length > 4) throw new BadRequestError("Attach up to four images.");
    if (replyTo && !tx.findRecordsByFilter("messages", "id = {:id}", "", 1, 0, { id: replyTo }).length) {
      throw new BadRequestError("The original broadcast was removed. Clear the reply to send this as a new post.");
    }

    const message = new Record(tx.findCollectionByNameOrId("messages"));
    message.set("author", auth.collection().name === "users" ? auth.id : "");
    message.set("audience", audience);
    message.set("reply_to", replyTo);
    message.set("has_image", attachments.length > 0);
    tx.save(message);

    const content = new Record(tx.findCollectionByNameOrId("message_content"));
    content.set("message", message.id);
    content.set("body", body);
    if (attachments.length) {
      content.set("attachments", attachments);
      try {
        tx.validate(content);
      } catch {
        throw new BadRequestError("An attachment couldn’t be read. Use PNG, JPEG, WebP, or GIF images up to 8 MB each.");
      }
    }
    tx.save(content);

    const receipt = new Record(tx.findCollectionByNameOrId("signal_broadcast_receipts"));
    receipt.set("author_id", auth.id);
    receipt.set("request_key", key);
    receipt.set("message_id", message.id);
    tx.save(receipt);
    result = { message: message.publicExport(), content: content.publicExport() };
  });

  e.response.header().set("Cache-Control", "private, no-store");
  return e.json(200, result);
}

module.exports = { publish };
