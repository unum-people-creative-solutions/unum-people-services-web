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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [tenantId]);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      // Se tivermos tenantId, idealmente verificaríamos no backend.
      // Como não temos esse endpoint, por enquanto confiamos no status do push global
      // mas permitimos o toggle individual.
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
    }
  };

  const subscribeUser = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Seu navegador não suporta notificações push.');
      return;
    }

    setLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        alert('Você precisa permitir as notificações para receber atualizações.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;

      if (!vapidKey) {
        console.error('VAPID Key não encontrada. Verifique o arquivo .env.local');
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(vapidKey),
        });
      }

      await NotificationService.subscribe(subscription, tenantId);
      setIsSubscribed(true);
      console.log(`Inscrito com sucesso para o tenant: ${tenantId || 'Global'}`);
    } catch (error) {
      console.error('Erro ao inscrever para notificações push:', error);
      alert('Erro ao ativar notificações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await NotificationService.unsubscribe(subscription.endpoint, tenantId);
        
        // Só cancelamos a inscrição no browser se não houver tenantId (cancelamento global)
        if (!tenantId) {
          await subscription.unsubscribe();
        }
        
        setIsSubscribed(false);
        console.log(`Desinscrito com sucesso para o tenant: ${tenantId || 'Global'}`);
      }
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      alert('Erro ao desativar notificações.');
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    isSubscribed,
    loading,
    subscribeUser,
    unsubscribeUser,
  };
};
