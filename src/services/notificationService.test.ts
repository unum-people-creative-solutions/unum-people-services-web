import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './notificationService';
import api from './api';

// Mock do módulo api
vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/fake-id',
    toJSON: () => ({
      endpoint: 'https://fcm.googleapis.com/fcm/send/fake-id',
      keys: { p256dh: 'key1', auth: 'key2' }
    })
  } as any as PushSubscription;

  describe('subscribe', () => {
    it('deve chamar a API de subscribe com os parâmetros corretos', async () => {
      (api.post as any).mockResolvedValue({ data: { success: true } });

      const result = await NotificationService.subscribe(mockSubscription, 'tenant-123');

      expect(api.post).toHaveBeenCalledWith(
        '/notifications/subscribe?tenant_id=tenant-123',
        mockSubscription.toJSON()
      );
      expect(result.success).toBe(true);
    });

    it('deve funcionar sem tenant_id', async () => {
      await NotificationService.subscribe(mockSubscription);
      expect(api.post).toHaveBeenCalledWith('/notifications/subscribe', mockSubscription.toJSON());
    });
  });

  describe('checkStatus', () => {
    it('deve retornar true se estiver inscrito', async () => {
      (api.get as any).mockResolvedValue({ data: { subscribed: true } });
      const endpoint = 'https://example.com/endpoint';

      const isSubscribed = await NotificationService.checkStatus(endpoint, 'tenant-1');

      expect(api.get).toHaveBeenCalledWith(
        `/notifications/check?endpoint=${encodeURIComponent(endpoint)}&tenant_id=tenant-1`
      );
      expect(isSubscribed).toBe(true);
    });

    it('deve retornar false se não estiver inscrito', async () => {
      (api.get as any).mockResolvedValue({ data: { subscribed: false } });
      const isSubscribed = await NotificationService.checkStatus('endpoint');
      expect(isSubscribed).toBe(false);
    });
  });

  describe('unsubscribe', () => {
    it('deve chamar a API de unsubscribe via DELETE', async () => {
      (api.delete as any).mockResolvedValue({ data: { success: true } });
      const endpoint = 'https://endpoint.com';

      await NotificationService.unsubscribe(endpoint, 'tenant-xyz');

      expect(api.delete).toHaveBeenCalledWith(
        '/notifications/unsubscribe?tenant_id=tenant-xyz',
        { data: { endpoint } }
      );
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve propagar erros da API', async () => {
      (api.post as any).mockRejectedValue(new Error('Network Error'));

      await expect(NotificationService.subscribe(mockSubscription))
        .rejects.toThrow('Network Error');
    });
  });
});
