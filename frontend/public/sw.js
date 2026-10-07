const CACHE_NAME = "estatera-v5";
const APP_SHELL = ["/", "/manifest.json", "/estatera-app-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("estatera-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  // External maps and all API calls must be handled by the browser/network.
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith("/api/")) return;

  let cacheWritePromise = Promise.resolve();
  const responsePromise = fetch(event.request).then((response) => {
    const cacheControl = response.headers.get("Cache-Control") || "";
    const canCache =
      response.ok &&
      response.type === "basic" &&
      !response.bodyUsed &&
      !/\b(?:no-store|private)\b/i.test(cacheControl);

    if (!canCache) return response;

    try {
      const responseCopy = response.clone();
      cacheWritePromise = caches
        .open(CACHE_NAME)
        .then((cache) => cache.put(event.request, responseCopy));
    } catch (error) {
      cacheWritePromise = Promise.reject(error);
    }

    return response;
  });

  event.waitUntil(
    responsePromise
      .then(() => cacheWritePromise, () => undefined)
      .catch((error) => {
        console.error("Service worker failed to cache a response:", error);
      }),
  );
  event.respondWith(
    responsePromise.catch(async () => {
      try {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          return (await caches.match("/")) || Response.error();
        }
      } catch (error) {
        console.error("Service worker failed to load a cached response:", error);
      }
      return Response.error();
    }),
  );
});
