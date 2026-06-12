import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from './page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Cognito
const mockForgotPassword = vi.fn();
const mockConfirmPassword = vi.fn();

vi.mock('amazon-cognito-identity-js', () => {
  return {
    CognitoUserPool: vi.fn().mockImplementation(function() { return {}; }),
    CognitoUser: vi.fn().mockImplementation(function() {
      return {
        forgotPassword: mockForgotPassword,
        confirmPassword: mockConfirmPassword,
      };
    }),
  };
});

// Mock next/link to render a regular anchor tag
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('T-03.1: deve exibir alerta de primeiro acesso com link para login em caso de InvalidParameterException ou NotAuthorizedException', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockImplementation((callbacks) => {
      callbacks.onFailure({
        code: 'InvalidParameterException',
        message: 'Invalid parameter',
      });
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/E-mail/i);
    await user.type(emailInput, 'novo.usuario@test.com');

    const submitBtn = screen.getByRole('button', { name: /Enviar Código/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ação necessária no primeiro acesso/i)).toBeInTheDocument();
      expect(screen.getByText(/senha temporária/i)).toBeInTheDocument();
      const loginLink = screen.getByRole('link', { name: /Voltar ao Login/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  it('T-03.2: deve renderizar mensagem de erro padrao e nao exibir alerta de primeiro acesso para outros erros como UserNotFoundException', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockImplementation((callbacks) => {
      callbacks.onFailure({
        code: 'UserNotFoundException',
        message: 'Usuário não encontrado',
      });
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/E-mail/i);
    await user.type(emailInput, 'invalido@test.com');

    const submitBtn = screen.getByRole('button', { name: /Enviar Código/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Usuário não encontrado/i)).toBeInTheDocument();
      expect(screen.queryByText(/Ação necessária no primeiro acesso/i)).not.toBeInTheDocument();
    });
  });

  it('T-03.3: deve mudar para o step 2 e exibir campos de codigo de confirmacao e nova senha em caso de sucesso', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockImplementation((callbacks) => {
      callbacks.onSuccess();
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/E-mail/i);
    await user.type(emailInput, 'usuario@test.com');

    const submitBtn = screen.getByRole('button', { name: /Enviar Código/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/Código de Verificação/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nova Senha/i)).toBeInTheDocument();
    });
  });

  it('T-03.4: deve chamar router.push("/login") quando confirmPassword for bem-sucedido', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockImplementation((callbacks) => {
      callbacks.onSuccess();
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/E-mail/i);
    await user.type(emailInput, 'usuario@test.com');

    const submitBtn = screen.getByRole('button', { name: /Enviar Código/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/Código de Verificação/i)).toBeInTheDocument();
    });

    mockConfirmPassword.mockImplementation((code, newPassword, callbacks) => {
      callbacks.onSuccess();
    });

    const codeInput = screen.getByLabelText(/Código de Verificação/i);
    const passwordInput = screen.getByLabelText(/Nova Senha/i);

    await user.type(codeInput, '123456');
    await user.type(passwordInput, 'NewPassword123!');

    const resetBtn = screen.getByRole('button', { name: /Redefinir Senha/i });
    await user.click(resetBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
