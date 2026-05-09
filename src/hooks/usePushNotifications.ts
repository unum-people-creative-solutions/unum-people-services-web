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
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setIsSubscribed(false);
        return;
      }
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      // Valida com o backend se este endpoint está inscrito para este tenantId
      const isActuallySubscribed = await NotificationService.checkStatus(subscription.endpoint, tenantId);
      setIsSubscribed(isActuallySubscribed);
    } catch (error) {
      console.error('[Push] Erro ao verificar inscrição inicial:', error);
      setIsSubscribed(false);
    }
  };

  const subscribeUser = async () => {
    console.log('[Push] Iniciando processo de inscrição...');
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.error('[Push] Notificações ou Service Worker não suportados.');
      alert('Seu navegador não suporta notificações push.');
      return;
    }

    setLoading(true);
    try {
      console.log('[Push] Solicitando permissão...');
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      console.log('[Push] Resultado da permissão:', permissionResult);

      if (permissionResult !== 'granted') {
        alert('Você precisa permitir as notificações para receber atualizações.');
        setLoading(false);
        return;
      }

      console.log('[Push] Verificando Service Worker...');
      
      // Tenta obter o registro existente
      let registration = await navigator.serviceWorker.getRegistration();
      
      // Se não encontrar, tenta forçar um registro manual no hook
      if (!registration) {
        console.warn('[Push] Registro não encontrado via getRegistration, tentando registrar manualmente...');
        try {
          registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('[Push] Registro manual realizado com sucesso.');
        } catch (regError) {
          console.error('[Push] Falha no registro manual dentro do hook:', regError);
        }
      }

      // Se ainda não tiver, aguarda o ready com um timeout generoso de 15 segundos
      if (!registration || !registration.active) {
        console.log('[Push] SW ainda não está ativo, aguardando ready (timeout 15s)...');
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout aguardando Service Worker ativo')), 15000));
        try {
          registration = await Promise.race([
            navigator.serviceWorker.ready,
            timeoutPromise
          ]) as ServiceWorkerRegistration;
          console.log('[Push] Service Worker ficou pronto (ready).');
        } catch (e) {
          console.error('[Push] Erro ou Timeout ao aguardar Service Worker:', e);
        }
      }
      
      if (!registration) {
        console.error('[Push] Service Worker não encontrado após tentativa de espera.');
        alert('O serviço de notificações não está pronto. Tente recarregar a página.');
        setLoading(false);
        return;
      }

      console.log('[Push] Service Worker pronto. Obtendo VAPID Key...');
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;

      if (!vapidKey) {
        console.error('[Push] VAPID Key não encontrada no ambiente (NEXT_PUBLIC_VAPID_KEY).');
        alert('Erro de configuração: VAPID Key ausente. Verifique se o .env está carregado.');
        setLoading(false);
        return;
      }

      console.log('[Push] Inscrevendo no Push Manager...');
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(vapidKey),
        });
        console.log('[Push] Nova inscrição criada.');
      } else {
        console.log('[Push] Inscrição já existente encontrada.');
      }

      console.log('[Push] Enviando para o backend para o tenant:', tenantId);
      await NotificationService.subscribe(subscription, tenantId);
      setIsSubscribed(true);
      console.log('[Push] Sucesso total!');
    } catch (error) {
      console.error('[Push] Erro crítico no processo:', error);
      alert('Erro ao ativar notificações. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
      console.log('[Push] Processo finalizado.');
    }
  };

  const unsubscribeUser = async () => {
    console.log('[Push] Iniciando cancelamento de inscrição...');
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.warn('[Push] Tentativa de desinscrever sem Service Worker ativo.');
        setIsSubscribed(false);
        return;
      }

      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        console.log('[Push] Removendo do backend...');
        await NotificationService.unsubscribe(subscription.endpoint, tenantId);
        
        if (!tenantId) {
          console.log('[Push] Cancelando inscrição global no browser...');
          await subscription.unsubscribe();
        }
        
        setIsSubscribed(false);
        console.log('[Push] Desinscrito com sucesso.');
      } else {
        console.log('[Push] Nenhuma inscrição ativa encontrada para remover.');
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('[Push] Erro ao desinscrever:', error);
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
