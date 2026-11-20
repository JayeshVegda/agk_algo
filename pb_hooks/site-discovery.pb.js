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
