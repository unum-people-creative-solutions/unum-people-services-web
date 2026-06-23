import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPage from './page';
import { useAuthStore } from '@/store/authStore';
import * as pushHooks from '@/hooks/usePushNotifications';
import { TenantService } from '@/services/api';
import { useTenant } from '@/contexts/TenantContext';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/store/authStore', () => {
  const store = vi.fn();
  (store as any).getState = vi.fn(() => ({
    session: {
      name: 'Jared Evans',
      email: 'jared@test.com',
      tenantName: 'Unum Corp',
      role: 'Admin',
      tenantId: 't-123'
    },
    logout: vi.fn()
  }));
  return { useAuthStore: store };
});

vi.mock('@/hooks/usePushNotifications', () => ({
  usePushNotifications: vi.fn(() => ({
    isSubscribed: false,
    subscribeUser: vi.fn(),
    unsubscribeUser: vi.fn(),
    loading: false,
    permission: 'default',
  })),
}));

vi.mock('@/contexts/TenantContext', () => ({
  useTenant: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  TenantService: {
    deleteAccount: vi.fn().mockResolvedValue({}),
    listUsers: vi.fn().mockResolvedValue([]),
    updateUserRole: vi.fn().mockResolvedValue({}),
    removeUser: vi.fn().mockResolvedValue({}),
    addUser: vi.fn().mockResolvedValue({}),
  }
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
    (useTenant as any).mockReturnValue({
      activeTenantId: 't-123',
      activeTenantName: 'Unum Corp',
      availableTenants: [{ id: 't-123', nome_negocio: 'Unum Corp' }],
      isMultiTenant: false,
      switchTenant: vi.fn(),
      isLoadingTenants: false,
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
    expect(alertMock).toHaveBeenCalledWith('Sua conta foi desativada e a solicitação de exclusão foi registrada.');

    alertMock.mockRestore();
  });

  describe('SettingsPage - Tabs & Team Management (QA RED)', () => {
    it('T01 - deve ver a aba "Minha Conta" ativa e o conteúdo pessoal ao carregar a página', () => {
      render(<SettingsPage />);
      
      const tabMyAccount = screen.getByRole('tab', { name: /minha conta/i });
      expect(tabMyAccount).toBeInTheDocument();
      // Em uma biblioteca de abas moderna, a aba ativa costuma ter aria-selected="true" ou atributo similar
      expect(tabMyAccount).toHaveAttribute('aria-selected', 'true');
      
      // Verifica se o conteúdo pessoal (já testado acima, mas garantindo a visibilidade na aba certa)
      expect(screen.getByText('Jared Evans')).toBeInTheDocument();
      expect(screen.getByText('jared@test.com')).toBeInTheDocument();
    });

    it('T02 - deve ocultar a aba "Equipe" para usuários comuns (role: user)', () => {
      // Setup role user
      (useAuthStore as any).mockReturnValue({
        session: { ...mockSession, role: 'user' }
      });
      render(<SettingsPage />);
      
      expect(screen.queryByRole('tab', { name: /equipe/i })).not.toBeInTheDocument();
    });

    it('T02 - deve exibir a aba "Equipe" para admins', () => {
      // Setup role admin (já é o default do mock)
      render(<SettingsPage />);
      
      expect(screen.getByRole('tab', { name: /equipe/i })).toBeInTheDocument();
    });

    it('T03 - deve abrir modal de convite ao clicar em "Convidar Membro" na aba Equipe', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);
      
      // Muda para a aba Equipe
      const tabTeam = screen.getByRole('tab', { name: /equipe/i });
      await user.click(tabTeam);

      // Clica em Convidar Membro
      const inviteBtn = screen.getByRole('button', { name: /convidar membro/i });
      await user.click(inviteBtn);

      // Verifica modal exigindo Nome, Email e Nível
      expect(screen.getByRole('dialog', { name: /adicionar membro/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /nome/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /e-mail/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /nível/i })).toBeInTheDocument();
    });

    it('T04 - RED: deve desabilitar os botões de ação para GlobalAdmin quando o chamador for TenantAdmin', async () => {
      const user = userEvent.setup();
      // Chamador: TenantAdmin
      (useAuthStore as any).mockReturnValue({
        session: { ...mockSession, role: 'TenantAdmin' }
      });
      // Alvo: GlobalAdmin
      (TenantService.listUsers as any).mockResolvedValue([
        { id: '1', name: 'Alvo Global', email: 'global@test.com', role: 'GlobalAdmin' }
      ]);
      
      render(<SettingsPage />);
      
      // Muda para a aba Equipe
      const tabTeam = screen.getByRole('tab', { name: /equipe/i });
      await user.click(tabTeam);

      // Esperar renderizar o usuário
      await waitFor(() => {
        expect(screen.getByText('Alvo Global')).toBeInTheDocument();
      });

      // O botão "Remover Membro" deve estar disabled
      const removeBtn = screen.getByRole('button', { name: /remover membro/i });
      expect(removeBtn).toBeDisabled();

      // O botão de "Alterar Acesso" deve estar disabled
      const changeAccessBtn = screen.getByRole('button', { name: /alterar acesso/i });
      expect(changeAccessBtn).toBeDisabled();

      // Verificar a badge ou tooltip explicativa
      expect(screen.getByText(/ação restrita a global admins/i)).toBeInTheDocument();
    });

    it('T05 - deve manter os botões de ação bloqueados para GlobalAdmin mesmo quando o chamador também for GlobalAdmin (restrito ao console AWS)', async () => {
      const user = userEvent.setup();
      // Chamador: GlobalAdmin
      (useAuthStore as any).mockReturnValue({
        session: { ...mockSession, role: 'GlobalAdmin' }
      });
      // Alvo: GlobalAdmin e outro comum
      (TenantService.listUsers as any).mockResolvedValue([
        { id: '1', name: 'Alvo Global', email: 'global@test.com', role: 'GlobalAdmin' },
        { id: '2', name: 'Comum', email: 'comum@test.com', role: 'user' }
      ]);

      render(<SettingsPage />);

      // Muda para a aba Equipe
      const tabTeam = screen.getByRole('tab', { name: /equipe/i });
      await user.click(tabTeam);

      await waitFor(() => {
        expect(screen.getByText('Alvo Global')).toBeInTheDocument();
      });

      // O primeiro conjunto de botões refere-se ao Alvo Global: bloqueado mesmo para chamador GlobalAdmin
      const removeBtns = screen.getAllByRole('button', { name: /remover membro/i });
      const changeAccessBtns = screen.getAllByRole('button', { name: /alterar acesso/i });

      expect(removeBtns[0]).toBeDisabled();
      expect(changeAccessBtns[0]).toBeDisabled();

      // O segundo conjunto refere-se ao usuário Comum: não é afetado pela regra de GlobalAdmin
      expect(removeBtns[1]).not.toBeDisabled();
      expect(changeAccessBtns[1]).not.toBeDisabled();
    });

    it('T06 - deve habilitar os botões de ação para um usuário comum quando o chamador é TenantAdmin', async () => {
      const user = userEvent.setup();
      (useAuthStore as any).mockReturnValue({
        session: { ...mockSession, role: 'TenantAdmin' }
      });
      (TenantService.listUsers as any).mockResolvedValue([
        { id: '1', name: 'Usuário Comum', email: 'comum@test.com', role: 'user' }
      ]);

      render(<SettingsPage />);

      const tabTeam = screen.getByRole('tab', { name: /equipe/i });
      await user.click(tabTeam);

      await waitFor(() => {
        expect(screen.getByText('Usuário Comum')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /remover membro/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /alterar acesso/i })).not.toBeDisabled();
    });

    it('T07 - deve habilitar os botões de ação para um TenantAdmin quando NÃO é o único TenantAdmin do tenant', async () => {
      const user = userEvent.setup();
      (useAuthStore as any).mockReturnValue({
        session: { ...mockSession, role: 'TenantAdmin' }
      });
      // Dois TenantAdmins no tenant: nenhum deles é o "último"
      (TenantService.listUsers as any).mockResolvedValue([
        { id: '1', name: 'Admin Um', email: 'jared@test.com', role: 'TenantAdmin' },
        { id: '2', name: 'Admin Dois', email: 'outro-admin@test.com', role: 'TenantAdmin' }
      ]);

      render(<SettingsPage />);

      const tabTeam = screen.getByRole('tab', { name: /equipe/i });
      await user.click(tabTeam);

      await waitFor(() => {
        expect(screen.getByText('Admin Dois')).toBeInTheDocument();
      });

      const removeBtns = screen.getAllByRole('button', { name: /remover membro/i });
      const changeAccessBtns = screen.getAllByRole('button', { name: /alterar acesso/i });

      // Linha do "Admin Dois" (índice 1): pode ser alterado/removido pelo outro TenantAdmin
      expect(removeBtns[1]).not.toBeDisabled();
      expect(changeAccessBtns[1]).not.toBeDisabled();
    });

    it('T08 - deve bloquear os botões de ação para o único TenantAdmin do tenant', async () => {
      const user = userEvent.setup();
      (useAuthStore as any).mockReturnValue({
        session: { ...mockSession, role: 'TenantAdmin' }
      });
      // Único TenantAdmin do tenant + um usuário comum
      (TenantService.listUsers as any).mockResolvedValue([
        { id: '1', name: 'Único Admin', email: 'jared@test.com', role: 'TenantAdmin' },
        { id: '2', name: 'Usuário Comum', email: 'comum@test.com', role: 'user' }
      ]);

      render(<SettingsPage />);

      const tabTeam = screen.getByRole('tab', { name: /equipe/i });
      await user.click(tabTeam);

      await waitFor(() => {
        expect(screen.getByText('Único Admin')).toBeInTheDocument();
      });

      const removeBtns = screen.getAllByRole('button', { name: /remover membro/i });
      const changeAccessBtns = screen.getAllByRole('button', { name: /alterar acesso/i });

      // Tenant precisa manter ao menos um TenantAdmin: linha bloqueada
      expect(removeBtns[0]).toBeDisabled();
      expect(changeAccessBtns[0]).toBeDisabled();
      expect(removeBtns[0]).toHaveAttribute('title', 'Único administrador não pode ser rebaixado/removido');

      // Usuário comum continua liberado
      expect(removeBtns[1]).not.toBeDisabled();
      expect(changeAccessBtns[1]).not.toBeDisabled();
    });

    it('T09 - deve garantir que o TabTeam use activeTenantId do contexto em vez do session.tenantId diretamente', async () => {
      const user = userEvent.setup();
      
      // Define activeTenantId diferente do session.tenantId do Zustand
      (useTenant as any).mockReturnValue({
        activeTenantId: 'tenant-active-context-B',
        activeTenantName: 'Context Tenant B',
        availableTenants: [
          { id: 't-123', nome_negocio: 'Unum Corp' },
          { id: 'tenant-active-context-B', nome_negocio: 'Context Tenant B' }
        ],
        isMultiTenant: true,
        switchTenant: vi.fn(),
        isLoadingTenants: false,
      });

      render(<SettingsPage />);
      
      // Vai para a aba Equipe
      const tabTeam = screen.getByRole('tab', { name: /equipe/i });
      await user.click(tabTeam);

      // Espera e valida se listUsers foi chamado com o ID do contexto (tenant-active-context-B) e não com o id da session (t-123)
      await waitFor(() => {
        expect(TenantService.listUsers).toHaveBeenCalledWith('tenant-active-context-B');
      });
      expect(TenantService.listUsers).not.toHaveBeenCalledWith('t-123');
    });
  });
});
