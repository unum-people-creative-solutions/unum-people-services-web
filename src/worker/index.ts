/// <reference lib="webworker" />

// Custom Service Worker for Push Notifications
// This file will be compiled by next-pwa

const swSelf = (self as unknown) as ServiceWorkerGlobalScope;

swSelf.addEventListener('push', (event) => {
  console.log('[SW] Evento de Push recebido.');
  
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    console.warn('[SW] Permissão de notificação não concedida ou não suportada.');
    return;
  }

  let data = {
    title: 'Nova Notificação',
    body: 'Você recebeu uma atualização no Unum CRM.',
    url: '/'
  };

  try {
    if (event.data) {
      const rawData = event.data.text();
      console.log('[SW] Dados brutos recebidos:', rawData);
      data = JSON.parse(rawData);
    } else {
      console.log('[SW] Push recebido sem dados (payload vazio).');
    }
  } catch (err) {
    console.error('[SW] Erro ao processar dados do push (JSON inválido?):', err);
    // Mantém os dados default se falhar o parse
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    swSelf.registration.showNotification(data.title, options)
      .then(() => console.log('[SW] Notificação exibida com sucesso.'))
      .catch(err => console.error('[SW] Erro ao exibir notificação:', err))
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
