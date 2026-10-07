import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const serviceWorkerPath = fileURLToPath(
  new URL("../public/sw.js", import.meta.url),
);
const serviceWorkerSource = fs.readFileSync(serviceWorkerPath, "utf8");
const origin = "https://estatera.test";

const createBasicResponse = (body) => {
  const response = new Response(body);
  Object.defineProperty(response, "type", { value: "basic" });
  return response;
};

const createServiceWorker = (fetchImpl) => {
  const listeners = {};
  const cachedResponses = new Map();
  const loggedErrors = [];
  const cache = {
    put: async (request, response) => {
      cachedResponses.set(request.url, await response.text());
    },
  };
  const scope = {
    location: { origin },
    clients: { claim: async () => undefined },
    addEventListener: (eventName, listener) => {
      listeners[eventName] = listener;
    },
    skipWaiting: () => undefined,
  };
  const cacheStorage = {
    keys: async () => ["estatera-v5"],
    open: async () => cache,
    match: async (request) => {
      const url = typeof request === "string" ? `${origin}${request}` : request.url;
      const body = cachedResponses.get(url);
      return body === undefined ? undefined : new Response(body);
    },
    delete: async () => true,
  };

  vm.runInNewContext(serviceWorkerSource, {
    self: scope,
    caches: cacheStorage,
    fetch: fetchImpl,
    URL,
    Response,
    console: {
      error: (...args) => loggedErrors.push(args),
    },
  });

  return { listeners, cachedResponses, loggedErrors };
};

const dispatchFetch = async (listener, request) => {
  const waitUntilPromises = [];
  let responsePromise;
  listener({
    request,
    waitUntil: (promise) => waitUntilPromises.push(promise),
    respondWith: (promise) => {
      responsePromise = promise;
    },
  });
  const response = await responsePromise;
  await Promise.all(waitUntilPromises);
  return response;
};

test("clones a successful network response once and returns its body intact", async () => {
  let cloneCount = 0;
  const networkResponse = createBasicResponse("property page");
  const originalClone = networkResponse.clone.bind(networkResponse);
  networkResponse.clone = () => {
    cloneCount += 1;
    return originalClone();
  };
  const worker = createServiceWorker(async () => networkResponse);
  const response = await dispatchFetch(worker.listeners.fetch, {
    method: "GET",
    url: `${origin}/listings`,
    mode: "navigate",
  });

  assert.equal(await response.text(), "property page");
  assert.equal(cloneCount, 1);
  assert.equal(worker.cachedResponses.get(`${origin}/listings`), "property page");
  assert.deepEqual(worker.loggedErrors, []);
});

test("serves a network response if cloning fails without an unhandled rejection", async () => {
  const networkResponse = createBasicResponse("still available");
  networkResponse.clone = () => {
    throw new TypeError("Response body is already used");
  };
  const worker = createServiceWorker(async () => networkResponse);
  const response = await dispatchFetch(worker.listeners.fetch, {
    method: "GET",
    url: `${origin}/`,
    mode: "navigate",
  });

  assert.equal(await response.text(), "still available");
  assert.equal(worker.loggedErrors.length, 1);
  assert.match(worker.loggedErrors[0][1].message, /already used/);
});

test("does not intercept API requests", () => {
  let fetchCount = 0;
  const worker = createServiceWorker(async () => {
    fetchCount += 1;
    return new Response("api");
  });
  let respondWithCalled = false;
  worker.listeners.fetch({
    request: {
      method: "GET",
      url: `${origin}/api/notifications`,
    },
    waitUntil: () => assert.fail("API requests must not be cached."),
    respondWith: () => {
      respondWithCalled = true;
    },
  });

  assert.equal(fetchCount, 0);
  assert.equal(respondWithCalled, false);
});

test("falls back to the cached app shell when an offline route is requested", async () => {
  const worker = createServiceWorker(async () => {
    throw new TypeError("Network unavailable");
  });
  worker.cachedResponses.set(`${origin}/`, "cached app shell");
  const response = await dispatchFetch(worker.listeners.fetch, {
    method: "GET",
    url: `${origin}/profile`,
    mode: "navigate",
  });

  assert.equal(await response.text(), "cached app shell");
});
