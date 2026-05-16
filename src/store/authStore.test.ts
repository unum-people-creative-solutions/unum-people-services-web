import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore (Zustand)', () => {
  beforeEach(() => {
    // Resetar o store manualmente antes de cada teste
    // Como o Zustand persiste, precisamos limpar o localStorage e o estado
    window.localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('deve iniciar com o estado padrão vazio', () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('deve atualizar o estado corretamente ao fazer login (setSession)', () => {
    const mockSession = {
      email: 'user@test.com',
      name: 'Test User',
      tenantId: 'tenant-123',
      role: 'admin',
      token: 'fake-jwt-token',
    };

    useAuthStore.getState().setSession(mockSession);

    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
    expect(state.isAuthenticated).toBe(true);
  });

  it('deve limpar o estado ao fazer logout', () => {
    const mockSession = {
      email: 'user@test.com',
      name: 'Test User',
      tenantId: 'tenant-123',
      role: 'admin',
      token: 'fake-jwt-token',
    };

    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('deve persistir os dados no localStorage', () => {
    const mockSession = {
      email: 'user@test.com',
      name: 'Test User',
      tenantId: 'tenant-123',
      role: 'admin',
      token: 'fake-jwt-token',
    };

    useAuthStore.getState().setSession(mockSession);

    const storageData = JSON.parse(window.localStorage.getItem('auth-storage') || '{}');
    expect(storageData.state.session).toEqual(mockSession);
    expect(storageData.state.isAuthenticated).toBe(true);
  });

  it('deve lidar com session nula em setSession', () => {
    useAuthStore.getState().setSession(null);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.session).toBeNull();
  });

  it('deve aceitar campos opcionais como tenantName', () => {
    const mockSession = {
      email: 'user@test.com',
      name: 'Test User',
      tenantId: 'tenant-123',
      tenantName: 'Unum Corp',
      role: 'user',
      token: 'fake-jwt-token',
    };

    useAuthStore.getState().setSession(mockSession);
    expect(useAuthStore.getState().session?.tenantName).toBe('Unum Corp');
  });
});
