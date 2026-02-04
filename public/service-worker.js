// Nomad Dashboard Service Worker
const CACHE_NAME = 'nomad-dashboard-v1'
const OFFLINE_URL = '/offline.html'

// 캐싱할 핵심 리소스
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html'
]

// 설치 이벤트 - 서비스 워커 설치 시
self.addEventListener('install', (event) => {

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS)
    })
  )

  // 새 서비스 워커를 즉시 활성화
  self.skipWaiting()
})

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )

  // 모든 클라이언트를 즉시 제어
  self.clients.claim()
})

// Fetch 이벤트 - 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
  // POST 요청은 캐싱하지 않음
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    // Network First 전략 (최신 데이터 우선, 실패 시 캐시)
    fetch(event.request)
      .then((response) => {
        // 성공적인 응답을 캐시에 저장
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // HTML 요청이고 캐시도 없으면 오프라인 페이지 반환
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match(OFFLINE_URL)
          }
        })
      })
  )
})

// 푸시 알림 수신 이벤트 (향후 구현)
self.addEventListener('push', (event) => {

  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  }

  event.waitUntil(
    self.registration.showNotification('Nomad Dashboard', options)
  )
})

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow('/')
  )
})
