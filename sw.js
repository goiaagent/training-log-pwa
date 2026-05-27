// Minimal service worker: cache the app shell so the PWA opens offline.
// Drive API calls always go to network (no caching of training data).

const CACHE = "tlpwa-v1";
const SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/auth.js",
  "./js/drive.js",
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
  // Pass through any Google/API requests to network only.
  if (url.host.includes("googleapis.com") || url.host.includes("google.com")) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
