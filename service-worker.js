const CACHE_NAME = 'mobile-reticle-star-atlas-v1';
const FILES_TO_CACHE = [
  '/',
  '/chart.html',
  '/chart.js',
  '/styles/styleChart.css',
  '/manifest.json',
  '/images/icon/android-chrome-192x192.png',
  '/images/icon/android-chrome-512x512.png',
  '/images/icon/apple-touch-icon.png',
  '/images/icon/favicon-16x16.png',
  '/images/icon/favicon-32x32.png',
  '/images/icon/favicon.ico',
  '/images/icon/site.webmanifest',
  '/images/chartqr.png',
  '/images/demImage1.jpg',
  '/images/demImage2.jpg',
  '/images/demImage3.jpg',
  '/images/exitFullScreenBtn.png',
  '/images/fullScreenBtn.png',
  '/images/menu.png',
  '/images/search.png',
  '/images/settingBtn.png',
  '/images/welcome0928.jpg',
  '/images/キラキラ1.png',
  '/images/キラキラ2.png',
  '/chartImage/M104.JPG',
  '/chartImage/3C273.png',
  '/chartImage/M27.jpg',
  '/chartImage/からす座.JPG',
  '/chartImage/馬頭星雲.jpg',
  '/chartImage/M51.jpg',
  '/chartImage/M42.jpg',
  '/chartImage/M43.jpg',
  '/chartImage/M13.jpg',
  '/chartImage/M31.jpg',
  '/chartImage/M57.jpg',
  '/data/additional_objects.txt',
  '/data/constellation.json',
  '/data/constellation_boundaries.bin',
  '/data/hip_65.txt',
  '/data/imageList.json',
  '/data/rec.json',
  '/data/messier.json',
  '/data/starnames.json',
  '/data/ngc.txt',
  '/data/brights.txt',
  '/data/gaia_111-115.bin',
  '/data/gaia_101-110.bin',
  '/data/gaia_-100.csv',
  '/data/gaia_111-115_helper.txt',
  '/data/gaia_101-110_helper.txt',
  '/data/gaia_-100_helper.txt',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
