/* Подих: оболонка застосунку працює без мережі, прогноз беремо з мережі, а за її відсутності з пам’яті сторінки. */
var CACHE = 'podykh-v7';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) {
    if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
      e.respondWith(caches.open(CACHE).then(function (c) {
        return c.match(r).then(function (hit) {
          return hit || fetch(r).then(function (res) { c.put(r, res.clone()); return res; });
        });
      }).catch(function () { return fetch(r); }));
    }
    return;
  }
  e.respondWith(fetch(r).then(function (res) {
    var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); return res;
  }).catch(function () { return caches.match(r).then(function (hit) { return hit || caches.match('index.html'); }); }));
});
