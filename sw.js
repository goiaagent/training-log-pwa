// Minimal service worker: cache the app shell so the PWA opens offline.
// GitHub raw fetches always go to network.

const CACHE = "tlpwa-v4";
const SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./config.js",
  "./js/app.js",
  "./js/remote.js",
  "./js/log-parser.js",
  "./js/log-builder.js",
  "./js/program-index.js",
  "./js/exercise-types.js",
  "./js/prescribed.js",
  "./js/storage.js",
  "./js/views/today.js",
  "./js/views/log.js",
  "./js/views/adjust.js",
  "./js/views/reviews.js",
  "./js/views/settings.js",
  "./js/views/edit-recent.js",
  "./js/views/graph.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Always network for the remote log fetch.
  if (url.host.includes("raw.githubusercontent.com")) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
