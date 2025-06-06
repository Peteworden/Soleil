const CACHE_NAME = 'mobile-reticle-star-atlas-v2505042139';
const FILES_TO_CACHE = [
  '/Soleil/chart.html',
  '/Soleil/chart.js',
  '/Soleil/styles/styleChart.css',
  '/Soleil/manifest.json',
  '/Soleil/images/icon/android-chrome-192x192.png',
  '/Soleil/images/icon/android-chrome-512x512.png',
  '/Soleil/images/icon/apple-touch-icon.png',
  '/Soleil/images/icon/favicon-16x16.png',
  '/Soleil/images/icon/favicon-32x32.png',
  '/Soleil/images/icon/favicon.ico',
  '/Soleil/images/icon/site.webmanifest',
  '/Soleil/images/chartqr.png',
  '/Soleil/images/demImage1.jpg',
  '/Soleil/images/demImage2.jpg',
  '/Soleil/images/demImage3.jpg',
  '/Soleil/images/exitFullScreenBtn.png',
  '/Soleil/images/fullScreenBtn.png',
  '/Soleil/images/menu.png',
  '/Soleil/images/search.png',
  '/Soleil/images/settingBtn.png',
  '/Soleil/images/welcome0928.jpg',
  '/Soleil/images/キラキラ1.png',
  '/Soleil/images/キラキラ2.png',
  '/Soleil/chartImage/M104.JPG',
  '/Soleil/chartImage/3C273.png',
  '/Soleil/chartImage/M27.jpg',
  '/Soleil/chartImage/からす座.JPG',
  '/Soleil/chartImage/馬頭星雲.jpg',
  '/Soleil/chartImage/M51.jpg',
  '/Soleil/chartImage/M42.jpg',
  '/Soleil/chartImage/M43.jpg',
  '/Soleil/chartImage/M13.jpg',
  '/Soleil/chartImage/M31.jpg',
  '/Soleil/chartImage/M57.jpg',
  '/Soleil/data/additional_objects.txt',
  '/Soleil/data/constellation.json',
  '/Soleil/data/constellation_boundaries.bin',
  '/Soleil/data/hip_65.txt',
  '/Soleil/data/imageList.json',
  '/Soleil/data/rec.json',
  '/Soleil/data/messier.json',
  '/Soleil/data/starnames.json',
  '/Soleil/data/ngc.txt',
  '/Soleil/data/brights.txt',
  '/Soleil/data/gaia_111-115.bin',
  '/Soleil/data/gaia_101-110.bin',
  '/Soleil/data/gaia_-100.csv',
  '/Soleil/data/gaia_111-115_helper.txt',
  '/Soleil/data/gaia_101-110_helper.txt',
  '/Soleil/data/gaia_-100_helper.txt',
];

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => name !== CACHE_NAME && caches.delete(name))
      );
      // ここで即時反映を促す
      await self.clients.claim();
    })()
  );
});

// self.addEventListener('activate', event => {
//   event.waitUntil(
//     caches.keys().then(cacheNames => {
//       return Promise.all(
//         cacheNames
//           .filter(name => name !== CACHE_NAME)
//           .map(name => caches.delete(name))
//       );
//     })
//   );
// });

// キャッシュ登録
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// リクエスト処理
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        1;
        // オフライン時のフォールバック処理が必要ならここに書く
      })
  );
});
