// Custom Service Worker for Push Notifications
// This file will be compiled by next-pwa

const swSelf = (self as unknown) as ServiceWorkerGlobalScope;

swSelf.addEventListener('push', (event) => {
  if (!(swSelf.Notification && swSelf.Notification.permission === 'granted')) {
    return;
  }

  const data = event.data ? JSON.parse(event.data.text()) : {
    title: 'Nova Notificação',
    body: 'Você recebeu uma atualização no Unum CRM.',
    url: '/'
  };

  event.waitUntil(
    swSelf.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: data.url || '/'
      }
    })
  );
});

swSelf.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    swSelf.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return swSelf.clients.openWindow(event.notification.data.url);
    })
  );
});
