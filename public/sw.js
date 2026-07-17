const CACHE_NAME = "app-cache-v4";
const ASSETS_TO_CACHE = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "icon.png"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`PWA sw.js: Failed to cache asset during install: ${asset}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("PWA sw.js: Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Bypass Google API calls, Firebase Firestore & Auth, etc.
  if (
    url.origin.includes("firestore.googleapis.com") ||
    url.origin.includes("identitytoolkit.googleapis.com") ||
    url.origin.includes("googleapis.com")
  ) {
    return;
  }

  // 1. Navigation requests: Network-First with Cache Fallback (crucial for SPAs)
  // This avoids background fetch TypeErrors on navigation requests in Chrome!
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match("index.html").then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match("./");
          });
        })
    );
    return;
  }

  // 2. Non-navigation requests (static files, icons, fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache for next time
        // Skip for non-http/https schemes (such as chrome-extension://)
        if (event.request.url.startsWith("http")) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              }
            })
            .catch(() => {
              // Ignore background fetch errors
            });
        }
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Cache eligible GET requests
          if (event.request.url.startsWith("http")) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch((err) => {
          // Silent catch for image/font loading errors while offline
          console.warn("PWA sw.js: Fetch failed while offline:", event.request.url, err);
        });
    })
  );
});
