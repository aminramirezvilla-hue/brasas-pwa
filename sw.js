const CACHE = "brasas-existencias-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isDoc =
    req.mode === "navigate" ||
    req.destination === "document" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".webmanifest");

  if (isDoc) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(req)) ||
            (await cache.match("./index.html")) ||
            (await cache.match("/a-las-brasas-existencias/")) ||
            (await cache.match("/a-las-brasas-existencias/index.html"))
          );
        }),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok && url.origin === self.location.origin) {
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        return (
          (await cache.match("./index.html")) ||
          (await cache.match("/a-las-brasas-existencias/index.html"))
        );
      }
    }),
  );
});
