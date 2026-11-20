routerAdd("POST", "/api/akg/signal-room/broadcasts", (e) => {
  return require(__hooks + "/signal-broadcast.js").publish(e);
}, $apis.bodyLimit(34 * 1024 * 1024));
