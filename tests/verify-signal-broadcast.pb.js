$app.rootCmd.addCommand(new Command({
  use: "verify-signal-broadcast",
  run: () => {
    // Run this command against the disposable CI database after migrations.
    const publish = require(__hooks + "/signal-broadcast.js").publish;
    function assert(ok, message) { if (!ok) throw new Error(message); }
    const admin = new Record($app.findCollectionByNameOrId("users"));
    admin.set("email", "broadcast-probe@example.test");
    admin.set("role", "admin");
    admin.setPassword("Synthetic-test-only-2026");
    $app.save(admin);
    const member = new Record($app.findCollectionByNameOrId("users"));
    member.set("email", "member-probe@example.test");
    member.setPassword("Synthetic-test-only-2026");
    $app.save(member);
    const key = (n) => "00000000-1111-4222-8333-" + String(n).padStart(12, "0");
    const head = new Map();
    function attempt(user, id, extra = {}, attachments = []) {
      return publish({
        auth: user, app: $app, requestInfo: () => ({ body: { request_key: key(id), audience: "vip", body: "test", ...extra } }),
        findUploadedFiles: () => attachments, response: { header: () => head },
        json: (status, result) => ({status, result}),
      });
    }
    const count = (table) => $app.findRecordsByFilter(table, "", "", 0, 0).length;
    const checkTotals = (n) => {
      for (const name of ["messages", "message_content", "signal_broadcast_receipts"]) assert(count(name) === n, name + " expected " + n + ", got " + count(name));
    };
    function denied(fn) {
      try { fn(); } catch (error) { return error; }
      throw new Error("Expected failure");
    }
    assert(String(denied(() => attempt(member, 1))).includes("administrator"), "Member publish should be forbidden");
    assert(String(denied(() => attempt(admin, 2, {body:" "}))).includes("attach an image"), "Blank input accepted");
    assert(String(denied(() => attempt(admin, 3, {reply_to:"notfoundreply01"}))).includes("original broadcast"), "Missing reply accepted");
    checkTotals(0);

    const first = attempt(admin, 4);
    assert(first.status === 200 && first.result.message.id && first.result.content.body === "test" &&
        first.result.content.collectionName === "message_content", "Missing publish receipt or content");
    assert(head.get("Cache-Control") === "private, no-store", "Publish should not be cached");
    const repeat = attempt(admin, 4, {body:"a changed retry"});
    assert(repeat.result.message.id === first.result.message.id && repeat.result.content.body === "test", "Retry changed original");
    checkTotals(1);
    const info = new RequestInfo({auth:member});
    const content = $app.findRecordById("message_content", first.result.content.id);
    assert(!$app.canAccessRecord(content, info, content.collection().viewRule), "VIP content leaked to member");

    const png = [137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,4,0,0,0,181,28,12,2,0,0,0,11,73,68,65,84,120,218,99,252,255,31,0,3,3,2,0,239,151,169,156,0,0,0,0,73,69,78,68,174,66,96,130];
    const image = $filesystem.fileFromBytes(png, "fixture.png");
    const imageOnly = attempt(admin, 5, {body:"", reply_to:first.result.message.id}, [image]);
    assert(imageOnly.result.content.attachments?.length === 1 && imageOnly.result.message.has_image &&
        imageOnly.result.message.reply_to === first.result.message.id, "Image-only reply not saved");
    checkTotals(2);
    const failure = denied(() => attempt(admin, 6, {}, [$filesystem.fileFromBytes("not an image", "fixture.txt")]));
    assert(String(failure).includes("attachment couldn’t be read"), "Expected an actionable attachment error");
    checkTotals(2);
    $app.delete($app.findRecordById("messages", first.result.message.id));
    const deleted = attempt(admin, 4);
    assert(deleted.result.removed && count("messages") === 1 && count("signal_broadcast_receipts") === 2,
      "Deleted broadcast was republished");
    console.log("PASS admin authorization, blank and reply validation, immediate acknowledgement, retry deduplication, VIP gate, real image-only reply, attachment failure rollback, deleted retry");
  },
}));
