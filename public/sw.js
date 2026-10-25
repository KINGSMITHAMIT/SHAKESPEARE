const CACHE = "bards-quill-v2-library";
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const path of ["/", "/library"]) {
        const response = await fetch(path, { cache: "reload" });
        if (!response.ok) throw Error("Shell unavailable");
        const html = await response.text();
        const assets = [
          ...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))[^" ]*"/g),
        ].map((match) => match[1].replaceAll("&amp;", "&"));
        await cache.addAll([
          ...new Set([...assets, "/icon.svg", "/manifest.webmanifest"]),
        ]);
        await cache.put(
          path,
          new Response(html, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }),
        );
      }
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("bards-quill-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  )
    return;
  if (event.request.mode === "navigate") {
    const pathname = url.pathname.replace(/\/$/, "") || "/";
    if (!["/", "/library"].includes(pathname)) return;
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(pathname);
        return cached || Response.error();
      }),
    );
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    ["/icon.svg", "/manifest.webmanifest"].includes(url.pathname)
  )
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      })(),
    );
});
