import { useEffect, useState, useCallback } from 'react';
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

  const checkSubscription = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[Push] [Check] Service Worker não suportado ou SSR');
      return;
    }
    
    if (Notification.permission !== 'granted') {
      console.log('[Push] [Check] Permissão não concedida:', Notification.permission);
      setIsSubscribed(false);
      return;
    }

    try {
      console.log(`[Push] [Check] Verificando status para tenant: ${tenantId || 'padrão'}`);
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log('[Push] [Check] Nenhum registro de SW encontrado.');
        setIsSubscribed(false);
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        console.log(`[Push] [Check] Nenhuma subscrição no browser para ${tenantId || 'padrão'}`);
        setIsSubscribed(false);
        return;
      }

      const isActuallySubscribed = await NotificationService.checkStatus(subscription.endpoint, tenantId);
      console.log(`[Push] [Check] Resposta backend:`, isActuallySubscribed);
      setIsSubscribed(isActuallySubscribed);
    } catch (error) {
      console.error('[Push] [Check] Erro:', error);
      setIsSubscribed(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [tenantId, checkSubscription]);

  const subscribeUser = async () => {
    console.log('[Push] [Sub] Iniciando processo...');
    setLoading(true);

    try {
      console.log('[Push] [Sub] 1. Solicitando permissão...');
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      console.log('[Push] [Sub] 2. Resultado permissão:', permissionResult);

      if (permissionResult !== 'granted') {
        alert('Permissão negada.');
        setLoading(false);
        return;
      }

      console.log('[Push] [Sub] 3. Verificando registro de SW...');
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log('[Push] [Sub] 4. Registro não encontrado, tentando registrar /sw.js...');
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[Push] [Sub] 5. SW registrado com sucesso.');
      }

      console.log('[Push] [Sub] 6. Aguardando navigator.serviceWorker.ready...');
      // Usando timeout para não travar indefinidamente
      const readyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout aguardando Service Worker Ready')), 10000));
      
      const readyRegistration = await Promise.race([readyPromise, timeoutPromise]) as ServiceWorkerRegistration;
      console.log('[Push] [Sub] 7. Service Worker está Ready.');

      if (readyRegistration.installing) {
        console.log('[Push] [Sub] 8. SW está instalando, aguardando ativação...');
        await new Promise<void>((resolve) => {
          readyRegistration.installing!.addEventListener('statechange', (e) => {
            console.log('[Push] [Sub] 9. SW State Change:', (e.target as ServiceWorker).state);
            if ((e.target as ServiceWorker).state === 'activated') resolve();
          });
        });
      }

      console.log('[Push] [Sub] 10. Obtendo VAPID Key...');
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
      if (!vapidKey) throw new Error('VAPID Key ausente');

      console.log('[Push] [Sub] 11. Chamando pushManager.subscribe...');
      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(vapidKey),
      });
      console.log('[Push] [Sub] 12. Inscrição no browser OK.');

      console.log('[Push] [Sub] 13. Enviando para o backend...');
      await NotificationService.subscribe(subscription, tenantId);
      
      setIsSubscribed(true);
      console.log('[Push] [Sub] 14. Sucesso total!');
    } catch (error: any) {
      console.error('[Push] [Sub] ERRO CRÍTICO:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('[Push] [Sub] Fim do processo.');
    }
  };

  const unsubscribeUser = async () => {
    console.log('[Push] [Unsub] Iniciando...');
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setIsSubscribed(false);
        setLoading(false);
        return;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log('[Push] [Unsub] Removendo do backend...');
        await NotificationService.unsubscribe(subscription.endpoint, tenantId);
        
        if (!tenantId) {
          console.log('[Push] [Unsub] Cancelando no browser...');
          await subscription.unsubscribe();
        }
        setIsSubscribed(false);
        console.log('[Push] [Unsub] Sucesso.');
      }
    } catch (error: any) {
      console.error('[Push] [Unsub] Erro:', error);
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
