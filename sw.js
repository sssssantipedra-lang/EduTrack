/* ============================================================
   sw.js — Aula Pro Service Worker (Paso 3)
   Estrategia: Network-first con fallback a caché
============================================================ */

const CACHE_NAME = 'aula-pro-v1';
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'
];

/* ---- INSTALL: pre-caché de recursos estáticos ---- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_ASSETS).catch((err) => {
        console.warn('[SW] Algunos recursos no se cachearon:', err);
      });
    })
  );
  self.skipWaiting();
});

/* ---- ACTIVATE: limpiar cachés antiguas ---- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ---- FETCH: Network-first, caché como fallback ---- */
self.addEventListener('fetch', (event) => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  // No interceptar llamadas a Supabase (siempre online)
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Guardar copia en caché si la respuesta es válida
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline: servir desde caché
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback final: devolver index.html
          return caches.match('/index.html');
        });
      })
  );
});

/* ---- SYNC: sincronización en background (futuro) ---- */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    // TODO Paso 5: sincronizar tareas pendientes creadas offline
    console.log('[SW] Background sync: tasks');
  }
});
