import { useEffect, useState } from 'react';
import { NotificationService } from '@/services/notificationService';

const base64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = (tenantId?: string) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
  };

  const subscribeUser = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.error('Notificações não suportadas neste navegador.');
      return;
    }

    const permissionResult = await Notification.requestPermission();
    setPermission(permissionResult);

    if (permissionResult !== 'granted') {
      console.warn('Permissão para notificações negada.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;

      if (!vapidKey) {
        console.error('VAPID Key não configurada no .env.local');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(vapidKey),
      });

      await NotificationService.subscribe(subscription, tenantId);
      setIsSubscribed(true);
      console.log('Inscrito com sucesso para notificações push.');
    } catch (error) {
      console.error('Erro ao inscrever para notificações push:', error);
    }
  };

  const unsubscribeUser = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      try {
        await subscription.unsubscribe();
        await NotificationService.unsubscribe(subscription.endpoint, tenantId);
        setIsSubscribed(false);
        console.log('Desinscrito com sucesso.');
      } catch (error) {
        console.error('Erro ao cancelar inscrição:', error);
      }
    }
  };

  return {
    permission,
    isSubscribed,
    subscribeUser,
    unsubscribeUser,
  };
};
