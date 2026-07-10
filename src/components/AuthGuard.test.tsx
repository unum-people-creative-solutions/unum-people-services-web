import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthGuard from './AuthGuard';
import { useAuthStore } from '@/store/authStore';
import { usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { ServiceAgreementService } from '@/services/api';
import { redirectToHostedUI } from '@/lib/pkce';

// Mocks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: Object.assign(vi.fn(), {
    persist: {
      onFinishHydration: vi.fn(),
      hasHydrated: vi.fn(),
    },
  }),
}));

vi.mock('./TermsModal', () => ({
  default: ({ onAccept }: { onAccept: () => void }) => (
    <div data-testid="terms-modal">
      <button onClick={onAccept}>Accept</button>
    </div>
  ),
}));

vi.mock('@/services/api', () => ({
  ServiceAgreementService: {
    getMyStatus: vi.fn(),
  },
}));

vi.mock('./ServiceAgreementGate', () => ({
  default: ({ onAccepted }: { onAccepted: () => void }) => (
    <div data-testid="service-agreement-gate">
      <button onClick={onAccepted}>Accept Agreement</button>
    </div>
  ),
}));

vi.mock('./ServiceAgreementWaiting', () => ({
  default: () => <div data-testid="service-agreement-waiting" />,
}));

// TASK-FE-CRM-001: redirectToHostedUI é testada de ponta a ponta (URL real,
// via crypto real) em src/lib/pkce.test.ts — aqui só verificamos que o
// AuthGuard a aciona com o `pathname` certo nos 3 cenários sem sessão válida.
vi.mock('@/lib/pkce', () => ({
  redirectToHostedUI: vi.fn(async () => {}),
}));

describe('AuthGuard', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    (usePathname as any).mockReturnValue('/dashboard');

    // Mock default persist behavior (already hydrated)
    (useAuthStore.persist.hasHydrated as any).mockReturnValue(true);
    (useAuthStore.persist.onFinishHydration as any).mockReturnValue(() => {});

    // Mock default jwt-decode behavior (valid token)
    (jwtDecode as any).mockReturnValue({ exp: Date.now() / 1000 + 10000 });
    
    // Default store state
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      session: { token: 'valid-token', email: 'test@example.com' },
      logout: mockLogout,
    });

    // Default: aceite em dia, sem gate — testes que não são sobre a feature
    // de Termo de Contratação não precisam se preocupar com isso.
    (ServiceAgreementService.getMyStatus as any).mockResolvedValue({
      status: 'aceito',
      term_name: '',
      required_version: 1,
      document_url: '',
      can_accept: true,
    });
  });

  it('deve exibir spinner de carregamento quando não hidratado', () => {
    (useAuthStore.persist.hasHydrated as any).mockReturnValue(false);
    
    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>
    );

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('deve renderizar children se o usuário estiver autenticado em rota privada', async () => {
    render(
      <AuthGuard>
        <div data-testid="child-content">Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  it('deve renderizar children em rotas públicas sem autenticação', async () => {
    (usePathname as any).mockReturnValue('/privacy');
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      session: null,
      logout: mockLogout,
    });

    render(
      <AuthGuard>
        <div data-testid="child-content">Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('TASK-FE-CRM-001 — Redirect para o Hosted UI (Cognito)', () => {
    it('aciona redirectToHostedUI com o pathname atual se não autenticado em rota privada — nunca mais /login interno', async () => {
      (usePathname as any).mockReturnValue('/dashboard');
      (useAuthStore as any).mockReturnValue({
        isAuthenticated: false,
        session: null,
        logout: mockLogout,
      });

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(redirectToHostedUI).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('aciona redirectToHostedUI se o token estiver expirado', async () => {
      const expiredTime = Date.now() / 1000 - 1000;
      (jwtDecode as any).mockReturnValue({ exp: expiredTime });

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(redirectToHostedUI).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('aciona redirectToHostedUI se a decodificação do token falhar', async () => {
      (jwtDecode as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(redirectToHostedUI).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  it('deve exibir TermsModal se o usuário não aceitou os termos', async () => {
    // localStorage já está limpo por padrão no beforeEach
    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByTestId('terms-modal')).toBeInTheDocument();
    });
  });

  it('não deve exibir TermsModal se o usuário já aceitou os termos', async () => {
    window.localStorage.setItem('terms-accepted-test@example.com', 'true');

    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('terms-modal')).not.toBeInTheDocument();
    });
  });

  it('deve fechar TermsModal após o aceite', async () => {
    // localStorage limpo
    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>
    );

    const acceptButton = await waitFor(() => screen.getByText('Accept'));
    acceptButton.click();

    await waitFor(() => {
      expect(screen.queryByTestId('terms-modal')).not.toBeInTheDocument();
    });
  });

  describe('TASK-FE-007 — Termo de Contratação de Serviço', () => {
    it('exibe o ServiceAgreementGate quando status=pendente e can_accept=true (TenantAdmin)', async () => {
      (ServiceAgreementService.getMyStatus as any).mockResolvedValue({
        status: 'pendente',
        term_name: 'Termo Site',
        required_version: 2,
        document_url: 'https://cdn/v2.html',
        can_accept: true,
      });

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('service-agreement-gate')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('service-agreement-waiting')).not.toBeInTheDocument();
    });

    it('exibe o ServiceAgreementWaiting quando status=pendente e can_accept=false (usuário comum)', async () => {
      (ServiceAgreementService.getMyStatus as any).mockResolvedValue({
        status: 'pendente',
        term_name: 'Termo Site',
        required_version: 2,
        document_url: 'https://cdn/v2.html',
        can_accept: false,
      });

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('service-agreement-waiting')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('service-agreement-gate')).not.toBeInTheDocument();
    });

    it('não exibe nenhum gate quando status=aceito', async () => {
      (ServiceAgreementService.getMyStatus as any).mockResolvedValue({
        status: 'aceito',
        term_name: 'Termo Site',
        required_version: 2,
        document_url: 'https://cdn/v2.html',
        can_accept: true,
      });

      render(
        <AuthGuard>
          <div data-testid="child-content">Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('service-agreement-gate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('service-agreement-waiting')).not.toBeInTheDocument();
    });

    it('fecha o gate quando onAccepted é chamado (aceite confirmado)', async () => {
      (ServiceAgreementService.getMyStatus as any).mockResolvedValue({
        status: 'pendente',
        term_name: 'Termo Site',
        required_version: 2,
        document_url: 'https://cdn/v2.html',
        can_accept: true,
      });

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      const acceptBtn = await screen.findByText('Accept Agreement');
      acceptBtn.click();

      await waitFor(() => {
        expect(screen.queryByTestId('service-agreement-gate')).not.toBeInTheDocument();
      });
    });

    it('não busca o status do termo em rotas públicas', async () => {
      (usePathname as any).mockReturnValue('/privacy');
      (useAuthStore as any).mockReturnValue({
        isAuthenticated: false,
        session: null,
        logout: mockLogout,
      });

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
      expect(ServiceAgreementService.getMyStatus).not.toHaveBeenCalled();
    });

    // SUG-8 (/local-review): a busca do status do termo não pode reexecutar a
    // cada troca de rota dentro da área autenticada — isso batia a API do
    // backend a cada navegação sem nenhum motivo (o status não muda entre
    // rotas privadas).
    it('não refaz a busca do status do termo ao navegar entre rotas privadas', async () => {
      const { rerender } = render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(ServiceAgreementService.getMyStatus).toHaveBeenCalledTimes(1);
      });

      (usePathname as any).mockReturnValue('/kanban/outro-board');
      rerender(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
      expect(ServiceAgreementService.getMyStatus).toHaveBeenCalledTimes(1);
    });

    // Achado do /local-review: falha ao buscar o status inicial resultava em
    // "fail-open" (usuário passava direto, sem nenhum gate) — contraria D6
    // ("enforcement real"). Deve ser fail-closed: erro vira tela de espera.
    it('erro ao buscar o status inicial bloqueia (fail-closed), nunca libera o acesso', async () => {
      (ServiceAgreementService.getMyStatus as any).mockRejectedValue(new Error('network error'));

      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(screen.getByTestId('service-agreement-waiting')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('service-agreement-gate')).not.toBeInTheDocument();
    });

    // SUG-3 (/local-review): quem aceita é o TenantAdmin, em outra sessão —
    // a tela de espera precisa se auto-atualizar (polling), não depender de
    // um F5 manual do usuário comum bloqueado.
    it('faz polling do status enquanto aguarda e libera o acesso assim que o TenantAdmin aceita', async () => {
      vi.useFakeTimers();
      try {
        (ServiceAgreementService.getMyStatus as any)
          .mockResolvedValueOnce({
            status: 'pendente',
            term_name: 'Termo Site',
            required_version: 2,
            document_url: 'https://cdn/v2.html',
            can_accept: false,
          })
          .mockResolvedValue({
            status: 'aceito',
            term_name: 'Termo Site',
            required_version: 2,
            document_url: 'https://cdn/v2.html',
            can_accept: false,
          });

        render(
          <AuthGuard>
            <div data-testid="child-content">Content</div>
          </AuthGuard>
        );

        await vi.waitFor(() => {
          expect(screen.getByTestId('service-agreement-waiting')).toBeInTheDocument();
        });

        await vi.advanceTimersByTimeAsync(15000);

        await vi.waitFor(() => {
          expect(screen.queryByTestId('service-agreement-waiting')).not.toBeInTheDocument();
        });
        expect(ServiceAgreementService.getMyStatus).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
