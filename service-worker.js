// === App Shell cache básico (cache-first de tus archivos locales) ===
const CACHE_NAME = "mantenimiento-v4"; // súbilo para forzar actualización
const ASSETS = [
  "./",
  "./index.html",
  "./estilos.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) No interceptar nada que no sea GET
  if (req.method !== "GET") return;

  // 2) No interceptar Firestore/WebChannel ni recursos externos
  //    (estos streams no deben cachearse y causan el error de clone)
  const isFirebaseAPI =
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com");
  if (isFirebaseAPI) return;

  // 3) Solo manejamos recursos de tu mismo origen (tu página)
  if (url.origin !== self.location.origin) return;

  // 4) Cache-first con guardado seguro (clonando una sola vez)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // guardar solo respuestas 200 "básicas" (mismo origen)
          if (!res || res.status !== 200 || res.type !== "basic") return res;
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
