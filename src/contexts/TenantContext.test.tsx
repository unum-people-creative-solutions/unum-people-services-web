import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantProvider, useTenant } from './TenantContext';
import { useAuthStore } from '@/store/authStore';
import { TenantService } from '@/services/api';

// Mocks
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  TenantService: {
    listMyTenants: vi.fn(),
  },
}));

// Test helper component to consume the context
const TestComponent = () => {
  const {
    activeTenantId,
    activeTenantName,
    availableTenants,
    isMultiTenant,
    switchTenant,
    isLoadingTenants,
  } = useTenant();

  return (
    <div>
      <div data-testid="active-id">{activeTenantId}</div>
      <div data-testid="active-name">{activeTenantName}</div>
      <div data-testid="is-multi">{isMultiTenant.toString()}</div>
      <div data-testid="is-loading">{isLoadingTenants.toString()}</div>
      <div data-testid="available-count">{availableTenants.length}</div>
      <button data-testid="switch-btn" onClick={() => switchTenant('tenant-B')}>
        Switch
      </button>
    </div>
  );
};

describe('TenantContext', () => {
  const mockTenants = [
    { id: 'tenant-A', nome_negocio: 'Alpha' },
    { id: 'tenant-B', nome_negocio: 'Beta' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    // Mock do useAuthStore retornando o tenantId primário como 'tenant-A'
    (useAuthStore as any).mockReturnValue({
      session: { tenantId: 'tenant-A' },
    });

    // Mock do listMyTenants retornando a lista de inquilinos
    (TenantService.listMyTenants as any).mockResolvedValue(mockTenants);
  });

  it('T01 — TenantContext: inicialização com tenant primário', async () => {
    render(
      <TenantProvider>
        <TestComponent />
      </TenantProvider>
    );

    // Deve mostrar carregamento e chamar a API para listar inquilinos do CRM
    expect(TenantService.listMyTenants).toHaveBeenCalledWith('crm');

    // Esperar concluir o carregamento
    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Validar os valores iniciais correspondentes
    expect(screen.getByTestId('active-id')).toHaveTextContent('tenant-A');
    expect(screen.getByTestId('active-name')).toHaveTextContent('Alpha');
    expect(screen.getByTestId('is-multi')).toHaveTextContent('true');
    expect(screen.getByTestId('available-count')).toHaveTextContent('2');
  });

  it('T02 — TenantContext: troca de tenant via switchTenant', async () => {
    const user = userEvent.setup();
    render(
      <TenantProvider>
        <TestComponent />
      </TenantProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Clicar no botão para alternar para tenant-B
    await user.click(screen.getByTestId('switch-btn'));

    // Validar alteração de estado no contexto
    expect(screen.getByTestId('active-id')).toHaveTextContent('tenant-B');
    expect(screen.getByTestId('active-name')).toHaveTextContent('Beta');

    // Validar armazenamento no sessionStorage
    expect(sessionStorage.getItem('active-tenant')).toBe('tenant-B');
  });

  it('T03 — TenantContext: persistência via sessionStorage', async () => {
    // Definir previamente o tenant no sessionStorage
    sessionStorage.setItem('active-tenant', 'tenant-B');

    render(
      <TenantProvider>
        <TestComponent />
      </TenantProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    // Deve inicializar com tenant-B a partir do sessionStorage e não com o tenant-A da session
    expect(screen.getByTestId('active-id')).toHaveTextContent('tenant-B');
    expect(screen.getByTestId('active-name')).toHaveTextContent('Beta');
  });
});
