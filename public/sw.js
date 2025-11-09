/* global self, clients */
self.addEventListener('install', (event) => {
  console.log('[SW] install');
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  console.log('[SW] activate');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] push fired. event:', event);
  event.waitUntil((async () => {
    let data = {};
    try {
      data = event.data ? event.data.json() : {};
    } catch (e) {
      console.log('[SW] push payload parse error:', e);
    }
    console.log('[SW] push payload:', data);

    const title = data.title || 'پاسخ جدید از پشتیبانی';
    const body = data.body || 'برای مشاهده پاسخ روی این اعلان بزنید.';
    // توصیه: URL کامل بفرست (مثلا http://localhost:3000/support?sessionId=...)
    const url = data.url || '/support';

    const options = {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url },
    };

    try {
      const reg = await self.registration.showNotification(title, options);
      console.log('[SW] showNotification OK:', reg);
    } catch (e) {
      console.log('[SW] showNotification ERROR:', e);
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] notificationclick', event.notification?.data);
  event.notification.close();
  const url = event.notification?.data?.url || '/support';
  event.waitUntil((async () => {
    try {
      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      const client = clientList.find((c) => 'focus' in c);
      if (client) {
        console.log('[SW] focusing existing client');
        await client.focus();
        await client.navigate(url); // اگر focus شد، به URL هم ببر
        return;
      }
      console.log('[SW] opening new window', url);
      await clients.openWindow(url);
    } catch (e) {
      console.log('[SW] notificationclick ERROR:', e);
    }
  })());
});
