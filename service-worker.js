const MENU_CACHE_NAME = "soorim-menu-v2";

const MENU_FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/menu-icon.svg",
  "./images/b-course.JPG"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(MENU_CACHE_NAME).then((cache) => cache.addAll(MENU_FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("soorim-menu-") && cacheName !== MENU_CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) return;
  if (!requestUrl.pathname.startsWith("/soorim-menu/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(MENU_CACHE_NAME).then((cache) => {
            cache.put("./index.html", responseClone);
          });
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((networkResponse) => {
          return networkResponse;
        })
      );
    })
  );
});
