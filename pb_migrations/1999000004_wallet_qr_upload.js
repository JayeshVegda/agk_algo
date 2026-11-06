// 1999000004_wallet_qr_upload.js
// Lets the desk attach its own QR image to a settlement wallet instead of
// relying on the auto-generated one from the address (some wallets share
// static merchant QRs). Stored inline as a data URI; checkout prefers it.

migrate((app) => {
  let wallets;
  try {
    wallets = app.findCollectionByNameOrId("wallets");
  } catch {
    return;
  }
  const has = (() => {
    try {
      return !!wallets.schema.getFieldByName("qr_image");
    } catch {
      return false;
    }
  })();
  if (has) return;
  wallets.fields.add(new Field({ type: "text", name: "qr_image", required: false, max: 262144 }));
  app.save(wallets);
}, (app) => {
  let wallets;
  try {
    wallets = app.findCollectionByNameOrId("wallets");
  } catch {
    return;
  }
  try {
    wallets.fields.removeByName("qr_image");
    app.save(wallets);
  } catch {}
});
