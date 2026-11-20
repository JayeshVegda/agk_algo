// Discovery requests for resources the site does not publish must not fall
// through to index.html when PocketBase runs in SPA mode.
for (const path of ["/.well-known/ard.json", "/.well-known/ai-catalog.json", "/.well-known/agent-resources.json", "/ard.json"]) {
  routerAdd("GET", path, (e) => e.json(404, { message: "Discovery manifest not available." }));
}

routerUse((e) => {
  if (/^\/(?:admin|account|checkout)(?:\/|$)/.test(e.request.url.path)) {
    e.response.header().set("X-Robots-Tag", "noindex");
  }
  e.next();
});

for (const route of ["/{$}", "/bots", "/bots/{$}", "/pricing", "/pricing/{$}"]) {
  routerAdd("GET", route, (e) => {
    const args = $os.args;
    const index = args.findIndex((arg) => arg === "--publicDir" || arg.startsWith("--publicDir="));
    const publicDir = index < 0 ? $filepath.join(args[0], "../pb_public")
      : (args[index] === "--publicDir" ? args[index + 1] : args[index].slice("--publicDir=".length));
    const page = e.request.url.path.replace(/^\/|\/$/g, "") || "home";
    const file = "storefront/" + page + ".html";
    let target = file;
    try { $os.stat(publicDir + "/" + file); } catch { target = "index.html"; }
    e.response.header().set("Cache-Control", "no-cache");
    return e.fileFS($os.dirFS(publicDir), target);
  });
}
