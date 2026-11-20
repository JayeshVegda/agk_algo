migrate((app) => {
  // Keep receipts after a broadcast is deleted so retrying cannot recreate it.
  app.save(new Collection({
    name: "signal_broadcast_receipts",
    type: "base",
    fields: [
      { name: "author_id", type: "text", required: true },
      { name: "request_key", type: "text", required: true, max: 36 },
      { name: "message_id", type: "text", required: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_signal_broadcast_request ON signal_broadcast_receipts (author_id, request_key)"],
  }));
});
