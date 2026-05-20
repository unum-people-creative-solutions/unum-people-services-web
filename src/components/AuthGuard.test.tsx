import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthGuard from './AuthGuard';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
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

describe('AuthGuard', () => {
  const mockPush = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    (useRouter as any).mockReturnValue({ push: mockPush });
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
    (usePathname as any).mockReturnValue('/login');
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

  it('deve redirecionar usuário autenticado de /login para /kanban', async () => {
    (usePathname as any).mockReturnValue('/login');
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      session: { token: 'valid-token', email: 'test@example.com' },
      logout: mockLogout,
    });

    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/kanban');
    });
  });

  it('deve redirecionar para /login se não autenticado em rota privada', async () => {
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
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('deve redirecionar para /login se o token estiver expirado', async () => {
    const expiredTime = Date.now() / 1000 - 1000;
    (jwtDecode as any).mockReturnValue({ exp: expiredTime });

    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('deve redirecionar para /login se a decodificação do token falhar', async () => {
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
      expect(mockPush).toHaveBeenCalledWith('/login');
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
});
