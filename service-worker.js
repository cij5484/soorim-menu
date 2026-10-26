// 메뉴판을 수정해 올릴 때 이 버전 숫자를 하나 올려 주세요. (예: v3 → v4)
const MENU_CACHE_NAME = "soorim-menu-v3";

const MENU_FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/menu-icon.svg",
  "./icons/apple-touch-icon.png",
  "./images/b-course.JPG",
  "./images/wifi-qr.JPG"
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
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) return;
  if (!requestUrl.pathname.startsWith("/soorim-menu/")) return;

  // 메뉴판 페이지: 항상 최신 내용을 먼저 받고, 인터넷이 안 될 때만 저장본을 보여줍니다.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(MENU_CACHE_NAME).then((cache) => {
              cache.put("./index.html", responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 사진·아이콘: 저장본을 바로 보여주고, 뒤에서 새 파일로 갱신합니다.
  event.respondWith(
    caches.open(MENU_CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse || Response.error());

        if (cachedResponse) {
          event.waitUntil(networkFetch);
          return cachedResponse;
        }

        return networkFetch;
      })
    )
  );
});
