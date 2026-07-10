import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnboardingPage from './page';
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
    listMyTenants: vi.fn(),
    create: vi.fn(),
  },
}));

const mockRedirectToHostedUI = vi.fn();
vi.mock('@/lib/pkce', () => ({
  redirectToHostedUI: (...args: unknown[]) => mockRedirectToHostedUI(...args),
}));

describe('OnboardingPage', () => {
  const mockPush = vi.fn();
  const mockSetSession = vi.fn();
  const mockSession = { 
    email: 'new@test.com', 
    name: 'New User', 
    token: 'jwt-123' 
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (useAuthStore as any).mockReturnValue({
      session: mockSession,
      setSession: mockSetSession,
    });
    (TenantService.listMyTenants as any).mockResolvedValue([]);
  });

  it('deve redirecionar para kanban se o usuário já possuir tenants', async () => {
    (TenantService.listMyTenants as any).mockResolvedValue([{ id: 't1' }]);

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/kanban');
    });
  });

  // TASK-FE-CRM-003: não existe mais página /login própria do app.
  it('redireciona para o Hosted UI (Cognito) se não houver sessão', async () => {
    (useAuthStore as any).mockReturnValue({ session: null });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(mockRedirectToHostedUI).toHaveBeenCalledWith('/');
    });
  });

  it('deve validar campos obrigatórios no formulário', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByRole('button', { name: /Finalizar e Acessar Kanban/i }));

    expect(await screen.findByText(/Nome do negócio deve ter pelo menos 2 caracteres/i)).toBeInTheDocument();
    expect(await screen.findByText(/Nicho é obrigatório/i)).toBeInTheDocument();
  });

  it('deve criar o tenant com sucesso e redirecionar', async () => {
    const user = userEvent.setup();
    (TenantService.create as any).mockResolvedValue({ id: 'new-tenant-id', nome_negocio: 'Startup X' });

    render(<OnboardingPage />);

    await user.type(screen.getByLabelText(/Nome do seu Negócio/i), 'Startup X');
    await user.selectOptions(screen.getByLabelText(/Nicho \/ Área de Atuação/i), 'Estética');
    
    await user.click(screen.getByRole('button', { name: /Finalizar e Acessar Kanban/i }));

    await waitFor(() => {
      expect(TenantService.create).toHaveBeenCalledWith(expect.objectContaining({
        nome_negocio: 'Startup X',
        nicho: 'Estética',
        email_contato: mockSession.email
      }));
      expect(mockSetSession).toHaveBeenCalledWith(expect.objectContaining({
        tenantId: 'new-tenant-id',
        tenantName: 'Startup X'
      }));
      expect(mockPush).toHaveBeenCalledWith('/kanban');
    });
  });

  it('deve exibir erro se a criação do tenant falhar', async () => {
    const user = userEvent.setup();
    (TenantService.create as any).mockRejectedValue({
      response: { data: { error: 'Nome de negócio já existe' } }
    });

    render(<OnboardingPage />);

    await user.type(screen.getByLabelText(/Nome do seu Negócio/i), 'Startup Existente');
    await user.selectOptions(screen.getByLabelText(/Nicho \/ Área de Atuação/i), 'Educação');
    
    await user.click(screen.getByRole('button', { name: /Finalizar e Acessar Kanban/i }));

    expect(await screen.findByText(/Nome de negócio já existe/i)).toBeInTheDocument();
  });
});
