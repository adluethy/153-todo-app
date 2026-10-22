/* Service Worker: Damit die installierte App auch ohne Internet startet.
   Eigene Dateien: immer zuerst aus dem Netz laden (Änderungen kommen sofort an),
   ohne Internet die zuletzt geladene Version aus dem Zwischenspeicher nehmen.
   Anfragen an die Datenbank werden nie zwischengespeichert.
   Ausserdem zeigt er die Erinnerungen (Push) an, auch wenn die App geschlossen ist. */
const CACHE = 'todo-zettel-v6';
const FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/ui.js',
  './js/store.js',
  './js/todos.js',
  './js/notes.js',
  './js/sync.js',
  './js/push.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-64.png',
  './icons/badge-96.png',
];
// Datenbank-Bibliothek: feste Version, ändert sich nie, darum zuerst aus dem Zwischenspeicher
const LIBRARY = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES).then(() => cache.add(LIBRARY).catch(() => {})))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('todo-zettel-') && k !== CACHE).map(k => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

function saveCopy(req, res) {
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then(cache => cache.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.url === LIBRARY) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => saveCopy(req, res))));
    return;
  }

  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => saveCopy(req, res))
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
        .then(hit => hit || Response.error())),
  );
});

/* ---------- Erinnerungen (Push vom Dienst auf Vercel) ---------- */

self.addEventListener('push', event => {
  let msg = {};
  try {
    msg = event.data ? event.data.json() : {};
  } catch (err) {
    msg = { body: event.data ? event.data.text() : '' };
  }
  // Jede Push-Nachricht muss eine Mitteilung zeigen (sonst sperrt das iPhone den Empfang)
  event.waitUntil(self.registration.showNotification(msg.title || 'To-do & Zettel', {
    body: msg.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    tag: msg.tag || undefined, // gleiche Aufgabe ersetzt die ältere Mitteilung
    renotify: Boolean(msg.tag),
    lang: 'de-CH',
    data: { url: msg.url || './' },
  }));
});

// Antippen: App nach vorne holen oder öffnen
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const open = list.find(c => c.url.startsWith(self.registration.scope) && 'focus' in c);
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});
