// Custom Service Worker for Push Notifications
// This file will be compiled by next-pwa

declare let self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const data = event.data ? JSON.parse(event.data.text()) : {
    title: 'Nova Notificação',
    body: 'Você recebeu uma atualização no Unum CRM.',
    url: '/'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: data.url || '/'
      }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return self.clients.openWindow(event.notification.data.url);
    })
  );
});
