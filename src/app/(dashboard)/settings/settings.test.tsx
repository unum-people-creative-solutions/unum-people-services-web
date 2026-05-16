import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPage from './page';
import { useAuthStore } from '@/store/authStore';
import * as pushHooks from '@/hooks/usePushNotifications';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/hooks/usePushNotifications', () => ({
  usePushNotifications: vi.fn(() => ({
    isSubscribed: false,
    subscribeUser: vi.fn(),
    unsubscribeUser: vi.fn(),
    loading: false,
    permission: 'default',
  })),
}));

// Mock do Blob e URL
class MockBlob {
  content: any[];
  options: any;
  constructor(content: any[], options: any) {
    this.content = content;
    this.options = options;
  }
}
global.Blob = MockBlob as any;
global.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
global.URL.revokeObjectURL = vi.fn();

describe('SettingsPage', () => {
  const mockSession = {
    name: 'Jared Evans',
    email: 'jared@test.com',
    tenantName: 'Unum Corp',
    role: 'Admin',
    tenantId: 't-123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ session: mockSession });
    // Reset para o mock padrão do hook
    (pushHooks.usePushNotifications as any).mockReturnValue({
      isSubscribed: false,
      subscribeUser: vi.fn(),
      unsubscribeUser: vi.fn(),
      loading: false,
      permission: 'default',
    });
  });

  it('deve renderizar as informações do usuário e do vínculo profissional corretamente', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Jared Evans')).toBeInTheDocument();
    expect(screen.getByText('jared@test.com')).toBeInTheDocument();
    expect(screen.getByText('Unum Corp')).toBeInTheDocument();
    expect(screen.getByText('Vínculo Profissional')).toBeInTheDocument();
    expect(screen.getByText('Nome do Negócio / Empresa')).toBeInTheDocument();
  });

  it('deve exibir aviso quando a permissão de notificação for negada', () => {
    (pushHooks.usePushNotifications as any).mockReturnValue({
      isSubscribed: false,
      subscribeUser: vi.fn(),
      unsubscribeUser: vi.fn(),
      loading: false,
      permission: 'denied',
    });

    render(<SettingsPage />);

    expect(screen.getByText(/Notificações bloqueadas no seu navegador/i)).toBeInTheDocument();
  });

  it('deve disparar o fluxo de exportação de dados (LGPD)', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const exportBtn = screen.getByText(/Exportar Meus Dados/i).closest('button');
    if (!exportBtn) throw new Error('Botão não encontrado');
    
    await user.click(exportBtn);

    expect(screen.getByText('Processando...')).toBeInTheDocument();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('deve abrir o modal de exclusão de conta', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const deleteBtn = screen.getByRole('button', { name: /Solicitar Exclusão/i });
    await user.click(deleteBtn);

    expect(screen.getByText('Confirmar Exclusão?')).toBeInTheDocument();
  });
});
