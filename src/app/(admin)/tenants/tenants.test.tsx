import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TenantsPage from './page';
import { TenantService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  TenantService: {
    list: vi.fn(),
    create: vi.fn(),
    createUser: vi.fn(),
  },
}));

vi.mock('@/hooks/usePushNotifications', () => ({
  usePushNotifications: vi.fn(() => ({
    isSubscribed: false,
    subscribeUser: vi.fn(),
    unsubscribeUser: vi.fn(),
    loading: false,
  })),
}));

describe('TenantsPage', () => {
  const mockTenants = [
    { id: 't1', nome_negocio: 'Clinica A', email_contato: 'a@test.com', api_key: 'key-a', nicho: 'MEDICINA', status: 'ATIVO' },
    { id: 't2', nome_negocio: 'Escritorio B', email_contato: 'b@test.com', api_key: 'key-b', nicho: 'DIREITO', status: 'INATIVO' },
  ];

  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    
    // Configura o clipboard no jsdom se ele não existir
    if (typeof navigator.clipboard === 'undefined') {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn() },
        configurable: true
      });
    }
  });

  it('deve redirecionar para kanban se o usuário não for GlobalAdmin', async () => {
    (useAuthStore as any).mockReturnValue({
      session: { role: 'USER' },
    });

    render(<TenantsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/kanban');
    });
  });

  it('deve carregar e listar tenants se o usuário for GlobalAdmin', async () => {
    (useAuthStore as any).mockReturnValue({
      session: { role: 'GlobalAdmin' },
    });
    (TenantService.list as any).mockResolvedValue(mockTenants);

    render(<TenantsPage />);

    await waitFor(() => {
      // Usamos getAll para ignorar duplicatas Desktop/Mobile
      expect(screen.getAllByText('Clinica A')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Escritorio B')[0]).toBeInTheDocument();
    });
  });

  it('deve filtrar inquilinos pela busca', async () => {
    const user = userEvent.setup();
    (useAuthStore as any).mockReturnValue({ session: { role: 'GlobalAdmin' } });
    (TenantService.list as any).mockResolvedValue(mockTenants);

    render(<TenantsPage />);

    const searchInput = await screen.findByPlaceholderText(/Buscar por nome/i);
    await user.type(searchInput, 'Clinica');

    expect(screen.getAllByText('Clinica A')[0]).toBeInTheDocument();
    expect(screen.queryByText('Escritorio B')).not.toBeInTheDocument();
  });

  it('deve ocultar/revelar a API Key', async () => {
    const user = userEvent.setup();
    (useAuthStore as any).mockReturnValue({ session: { role: 'GlobalAdmin' } });
    (TenantService.list as any).mockResolvedValue(mockTenants);

    render(<TenantsPage />);

    // Por padrão mostra asteriscos (pode aparecer no desktop e mobile)
    const maskedKeys = await screen.findAllByText(/up_••••/i);
    expect(maskedKeys[0]).toBeInTheDocument();

    const revealButtons = await screen.findAllByTitle('Revelar Chave');
    await user.click(revealButtons[0]);

    expect(screen.getAllByText('key-a')[0]).toBeInTheDocument();
  });

  it.skip('deve abrir modal e cadastrar novo inquilino', async () => {
    const user = userEvent.setup();
    (useAuthStore as any).mockReturnValue({ session: { role: 'GlobalAdmin' } });
    (TenantService.list as any).mockResolvedValue(mockTenants);

    render(<TenantsPage />);
    
    // Aguarda o carregamento sumir e a tabela aparecer
    await waitFor(() => expect(screen.queryByText(/Carregando painel administrativo/i)).not.toBeInTheDocument());

    // Abre o menu principal da Navbar
    await user.click(screen.getByRole('button', { name: /Menu Principal/i }));

    // Botão "Cadastrar Inquilino" na Navbar
    await user.click(screen.getAllByText('Cadastrar Inquilino')[0]);

    expect(screen.getByRole('heading', { name: /Cadastrar Novo Inquilino/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Nome do Negócio/i), 'Novo Inquilino');
    // ID Google Ads não será preenchido para testar opcionalidade
    await user.type(screen.getByLabelText(/Nome Completo/i), 'Admin Teste');
    await user.type(screen.getByLabelText(/E-mail de Acesso/i), 'novo@test.com');
    
    await user.click(screen.getByRole('button', { name: /Ativar Inquilino/i }));

    await waitFor(() => {
      expect(TenantService.create).toHaveBeenCalledWith(expect.objectContaining({
        nome_negocio: 'Novo Inquilino',
        email_contato: 'novo@test.com',
        google_ads_customer_id: "" // Ou o valor padrão do formulário se houver
      }));
    });
  });

  it('deve abrir modal de convite de usuário com tenant_id correto', async () => {
    const user = userEvent.setup();
    (useAuthStore as any).mockReturnValue({ session: { role: 'GlobalAdmin' } });
    (TenantService.list as any).mockResolvedValue(mockTenants);

    render(<TenantsPage />);

    const inviteButtons = await screen.findAllByTitle('Adicionar Usuário');
    await user.click(inviteButtons[0]); // Clique no primeiro tenant (Clinica A)

    expect(screen.getByRole('heading', { name: /Convidar Usuário/i })).toBeInTheDocument();
    // O texto Clinica A pode aparecer no fundo e no modal, pegamos qualquer um
    expect(screen.getAllByText(/Clinica A/i).length).toBeGreaterThan(0);
  });
});
