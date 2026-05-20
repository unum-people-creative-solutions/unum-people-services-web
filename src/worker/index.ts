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
    badge: '/icons/badge-96x96.png',
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
  console.log('[SW] Notificação clicada.');
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url || '/', swSelf.location.origin).href;

  event.waitUntil(
    swSelf.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Tenta encontrar uma janela que já esteja EXATAMENTE na URL alvo
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          console.log('[SW] Janela encontrada na URL exata. Focando...');
          return client.focus();
        }
      }

      // 2. Tenta encontrar qualquer janela do domínio e navegar nela
      for (const client of clientList) {
        if (client.url.startsWith(swSelf.location.origin) && 'navigate' in client) {
          console.log('[SW] Janela do domínio encontrada. Navegando para:', urlToOpen);
          return client.navigate(urlToOpen).then((c) => c?.focus());
        }
      }

      // 3. Se não houver nenhuma janela, abre uma nova
      if (swSelf.clients.openWindow) {
        console.log('[SW] Nenhuma janela encontrada. Abrindo nova:', urlToOpen);
        return swSelf.clients.openWindow(urlToOpen);
      }
    })
  );
});
