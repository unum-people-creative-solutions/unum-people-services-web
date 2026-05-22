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

  it('deve abrir o modal de exclusão, exigir a palavra "excluir" e confirmar', async () => {
    const user = userEvent.setup();
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<SettingsPage />);

    const openModalBtn = screen.getByRole('button', { name: /Solicitar Exclusão/i });
    await user.click(openModalBtn);

    // Verifica se o modal abriu e mostra os avisos
    expect(screen.getByText('Confirmar Exclusão?')).toBeInTheDocument();
    expect(screen.getByText('Atenção Crítica')).toBeInTheDocument();
    expect(screen.getAllByText(/Você perderá acesso imediato ao sistema/i).length).toBeGreaterThanOrEqual(1);

    const confirmBtn = screen.getByRole('button', { name: /Sim, excluir permanentemente/i });
    const input = screen.getByPlaceholderText('Digite excluir');

    // Botão deve estar desabilitado inicialmente
    expect(confirmBtn).toBeDisabled();

    // Digitar algo incorreto
    await user.type(input, 'cancelar');
    expect(confirmBtn).toBeDisabled();

    // Digitar "excluir"
    await user.clear(input);
    await user.type(input, 'excluir');
    expect(confirmBtn).not.toBeDisabled();

    // Confirmar
    await user.click(confirmBtn);
    expect(alertMock).toHaveBeenCalledWith('Solicitação de exclusão enviada ao administrador.');
    
    // Modal deve fechar
    await waitFor(() => {
      expect(screen.queryByText('Confirmar Exclusão?')).not.toBeInTheDocument();
    });

    alertMock.mockRestore();
  });
});
