const CACHE_NAME = "estatera-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  // Only intercept GET requests
  if (event.request.method !== "GET") return;

  // Only handle same-origin assets. Third-party map/geocoding requests must
  // pass directly to the browser so their CORS response is preserved.
  if (new URL(event.request.url).origin !== self.location.origin || event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || Response.error())),
  );
});
