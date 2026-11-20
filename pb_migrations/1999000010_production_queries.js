migrate((app) => {
  const content = app.findCollectionByNameOrId("message_content");
  const legacy = '@request.auth.plan != "" && @request.auth.plan != "NONE" && @request.auth.cycle_expires_at > @now';
  const access = '@request.auth.id != "" && (@request.auth.role = "admin" || message.audience = "all"' +
    ' || (message.audience = "sr" && ((' + legacy + ') || @collection.active_signal_access.sr_member ?= @request.auth.id))' +
    ' || (message.audience = "vip" && ((' + legacy + ' && @request.auth.plan = "PERFECT_SIGNAL_BOX")' +
    ' || @collection.active_signal_access.vip_member ?= @request.auth.id)))';
  content.listRule = access;
  content.viewRule = access;
  content.addIndex("idx_message_content_message", false, "message", "");
  app.save(content);

  const messages = app.findCollectionByNameOrId("messages");
  messages.addIndex("idx_messages_created", false, "created", "");
  app.save(messages);

  const notifications = app.findCollectionByNameOrId("notifications");
  notifications.addIndex("idx_notifications_user_created", false, "user, created", "");
  notifications.addIndex("idx_notifications_dedupe_key", false, "dedupe_key", "");
  app.save(notifications);
});
