/// <reference path="../pb_data/types.d.ts" />

// 1999000000_signal_room.js
// Signals Desk -> broadcast Signal Room.
//   messages        - chat feed stub (audience, author, reply_to, pinned, has_image)
//   message_content - GATED 1:1 body + protected image attachments
//   reactions       - emoji counters, unique per (message,user,emoji)
// Legacy `signals` / `signal_coords` / `signal_previews` are flattened into the
// room and then deleted; nothing structured survives the migration.
//
// Access:
//   messages list/view          : any logged-in user
//   message_content list/view   : admins OR audience="all" for anyone logged-in
//                                 OR active-member (sr feed OR PERFECT plan for vip)
//   messages/message_content CUD: admins only
//   reactions list              : any logged-in user, CUD own rows only

const ANY_AUTH = '@request.auth.id != ""';
const ADMIN_ONLY = '@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.collectionName = "_superusers")';
const SUB_ACTIVE = '@request.auth.plan != "" && @request.auth.plan != "NONE" && @request.auth.cycle_expires_at > @now';
const CONTENT_READ = ANY_AUTH + ' && (' + ADMIN_ONLY +
  ' || message.audience = "all"' +
  ' || (' + SUB_ACTIVE + ' && (message.audience = "sr" || (message.audience = "vip" && @request.auth.plan = "PERFECT_SIGNAL_BOX"))))';

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  let messages;
  try {
    messages = app.findCollectionByNameOrId("messages");
  } catch {
    messages = new Collection({
      name: "messages",
      type: "base",
      fields: [
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
        { type: "relation", name: "author", required: false, collectionId: users.id, maxSelect: 1 },
        { type: "select", name: "audience", required: true, maxSelect: 1, values: ["all", "sr", "vip"] },
        { type: "bool", name: "pinned", required: false },
        { type: "bool", name: "has_image", required: false },
      ],
      listRule: ANY_AUTH,
      viewRule: ANY_AUTH,
      createRule: ADMIN_ONLY,
      updateRule: ADMIN_ONLY,
      deleteRule: ADMIN_ONLY,
    });
    app.save(messages);

    // self-relation needs the saved collection id first
    messages.fields.add(new Field({ type: "relation", name: "reply_to", required: false, collectionId: messages.id, maxSelect: 1 }));
    app.save(messages);
  }

  const messageId = messages.id;

  let content;
  try {
    content = app.findCollectionByNameOrId("message_content");
  } catch {
    content = new Collection({
      name: "message_content",
      type: "base",
      fields: [
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
        { type: "relation", name: "message", required: true, collectionId: messageId, maxSelect: 1, cascadeDelete: true },
        { type: "text", name: "body", required: false, max: 6000 },
        { type: "file", name: "attachments", required: false, maxSelect: 4, maxSize: 8388608, mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"], thumbs: ["320x480", "720x1280"], protected: true },
      ],
      listRule: CONTENT_READ,
      viewRule: CONTENT_READ,
      createRule: ADMIN_ONLY,
      updateRule: ADMIN_ONLY,
      deleteRule: ADMIN_ONLY,
    });
    app.save(content);
  }

  let reactions;
  try {
    reactions = app.findCollectionByNameOrId("reactions");
  } catch {
    reactions = new Collection({
      name: "reactions",
      type: "base",
      fields: [
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "relation", name: "message", required: true, collectionId: messageId, maxSelect: 1, cascadeDelete: true },
        { type: "relation", name: "user", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
        { type: "select", name: "emoji", required: true, maxSelect: 1, values: ["\uD83D\uDD25", "\uD83D\uDC4D", "\uD83C\uDFAF", "\uD83D\uDCB0", "\uD83D\uDE4F"] },
      ],
      listRule: ANY_AUTH,
      viewRule: ANY_AUTH,
      createRule: ADMIN_ONLY,
      updateRule: "",
      deleteRule: 'user = @request.auth.id',
      indexes: ["CREATE UNIQUE INDEX idx_reactions_unique ON reactions (message, user, emoji)"],
    });
    app.save(reactions);
  }
  // create: any auth (hook forces user = auth.id, admin-gates the pool)
  reactions.createRule = '@request.auth.id != ""';
  reactions.deleteRule = 'user = @request.auth.id';
  app.save(reactions);

  // ---------- flatten legacy signals ----------
  let legacy = null;
  try {
    legacy = app.findCollectionByNameOrId("signals");
  } catch {
    legacy = null;
  }

  if (legacy) {
    const contentCollection = app.findCollectionByNameOrId("message_content");
    const rows = app.findRecordsByFilter("signals", "", "-created", 5000, 0);
    for (const s of rows) {
      const tier = String(s.get("plan_tier") || "SR_SIGNAL_BOX");
      const audience = tier === "PERFECT_SIGNAL_BOX" ? "vip" : "sr";

      const lines = [];
      const push = (v) => {
        const str = String(v || "").trim();
        if (str) lines.push(str);
      };
      push(s.get("symbol"));
      push(s.get("direction"));
      push((s.get("entry") ? "Entry " + s.get("entry") : ""));
      push((s.get("stop_loss") ? "SL " + s.get("stop_loss") : ""));
      push((s.get("take_profit_1") ? "TP1 " + s.get("take_profit_1") : ""));
      push((s.get("take_profit_2") ? "TP2 " + s.get("take_profit_2") : ""));
      push(s.get("notes"));
      const pnl = String(s.get("pnl") || "").trim();
      if (pnl) push("Result: " + pnl);

      const m = new Record(messages);
      m.set("audience", audience);
      m.set("has_image", false);
      if (s.get("created")) m.set("created", s.get("created"));
      try {
        const author = s.get("author");
        if (author) m.set("author", author);
      } catch {}
      app.save(m);

      const c = new Record(contentCollection);
      c.set("message", m.id);
      c.set("body", lines.join("\n"));
      app.save(c);
    }
  }

  // ---------- drop the old desk ----------
  const drop = (name) => {
    try {
      app.delete(app.findCollectionByNameOrId(name));
    } catch {}
  };
  drop("signal_coords");
  drop("signal_previews");
  drop("signals");
  drop("message_secret");
}, (app) => {});
