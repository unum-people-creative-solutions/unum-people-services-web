import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './page';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { TenantService } from '@/services/api';

// Mocks de classe para o Cognito
const mockAuthenticateUser = vi.fn();
const mockCompleteNewPasswordChallenge = vi.fn();

vi.mock('amazon-cognito-identity-js', () => {
  class MockAuthenticationDetails {
    constructor(data: any) {}
  }
  class MockCognitoUser {
    constructor(data: any) {}
    authenticateUser = mockAuthenticateUser;
    completeNewPasswordChallenge = mockCompleteNewPasswordChallenge;
    getUsername = () => 'test@example.com';
  }
  return {
    AuthenticationDetails: MockAuthenticationDetails,
    CognitoUser: MockCognitoUser,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  TenantService: {
    listMyTenants: vi.fn(),
  },
}));

vi.mock('@/lib/cognito', () => ({
  userPool: {},
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({
    email: 'test@example.com',
    name: 'Test User',
    'custom:tenant_id': 'tenant-1',
    'cognito:groups': ['USER'],
  })),
}));

describe('LoginPage', () => {
  const mockPush = vi.fn();
  const mockSetSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (useAuthStore as any).mockImplementation((selector: any) => selector({ setSession: mockSetSession }));
  });

  it('deve renderizar o formulário de login e o título completo do sistema', () => {
    render(<LoginPage />);
    expect(screen.getByText(/Unum People/i)).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail ou Usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha$/i)).toBeInTheDocument();
  });

  it('deve exibir erros de validação para campos vazios', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await user.click(screen.getByRole('button', { name: /Entrar no Painel/i }));

    expect(await screen.findByText(/E-mail inválido/i)).toBeInTheDocument();
    expect(await screen.findByText(/Senha é obrigatória/i)).toBeInTheDocument();
  });

  it('deve realizar login com sucesso e redirecionar para kanban', async () => {
    const user = userEvent.setup();
    
    mockAuthenticateUser.mockImplementation((details, callbacks) => {
      callbacks.onSuccess({
        getIdToken: () => ({ getJwtToken: () => 'fake-token' }),
      });
    });

    (TenantService.listMyTenants as any).mockResolvedValue([{ id: '1', nome_negocio: 'Unum Teste' }]);

    render(<LoginPage />);
    
    await user.type(screen.getByLabelText(/E-mail ou Usuário/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^Senha$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Entrar no Painel/i }));

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com',
        role: 'USER',
        tenantName: 'Unum Teste' // Assumindo que o mockTenant tem esse nome ou que o mock da API retorna isso
      }));
      expect(mockPush).toHaveBeenCalledWith('/kanban');
    }, { timeout: 5000 });
  });

  it('deve exibir erro se a autenticação falhar', async () => {
    const user = userEvent.setup();
    
    mockAuthenticateUser.mockImplementation((details, callbacks) => {
      callbacks.onFailure({ message: 'User not found' });
    });

    render(<LoginPage />);
    
    await user.type(screen.getByLabelText(/E-mail ou Usuário/i), 'error@test.com');
    await user.type(screen.getByLabelText(/^Senha$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Entrar no Painel/i }));

    expect(await screen.findByText('User not found')).toBeInTheDocument();
  });

  it('deve alternar para fluxo de troca de senha se solicitado pelo Cognito', async () => {
    const user = userEvent.setup();
    
    mockAuthenticateUser.mockImplementation((details, callbacks) => {
      callbacks.newPasswordRequired({}, {});
    });

    render(<LoginPage />);
    
    await user.type(screen.getByLabelText(/E-mail ou Usuário/i), 'new@test.com');
    await user.type(screen.getByLabelText(/^Senha$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Entrar no Painel/i }));

    expect(await screen.findByText(/defina uma senha definitiva/i)).toBeInTheDocument();
  });
});
