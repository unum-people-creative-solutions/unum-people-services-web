import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import KanbanPage from './page';
import { LeadService, TenantService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useTenant } from '@/contexts/TenantContext';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/services/api', () => ({
  default: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  LeadService: {
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    update: vi.fn(),
    searchCustomers: vi.fn(),
    addSale: vi.fn(),
    delete: vi.fn(),
  },
  TenantService: {
    list: vi.fn(),
    listMyTenants: vi.fn(),
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/contexts/TenantContext', () => ({
  useTenant: vi.fn(),
}));

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({ draggableProps: {}, innerRef: vi.fn(), droppableProps: {} }, {}),
  Draggable: ({ children }: any) => children({ draggableProps: {}, innerRef: vi.fn(), dragHandleProps: {} }, {}),
}));

vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({ '!cols': [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('KanbanPage', () => {
  const mockLeads = [
    { id: 'lead-1', nome: 'João Silva', telefone: '11988887777', status: 'NOVO', sales: [] },
    { id: 'lead-2', nome: 'Maria Souza', telefone: '11966665555', status: 'GANHO', sales: [{ valor: 1000, data: new Date().toISOString() }] },
  ];

  const mockTenants = [{ id: 'tenant-1', nome_negocio: 'Unum Teste' }];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      session: { email: 'user@test.com', name: 'User', tenantId: 'tenant-1', role: 'USER' },
      logout: vi.fn(),
      setSession: vi.fn(),
    });
    (useTenant as any).mockReturnValue({
      activeTenantId: 'tenant-1',
      activeTenantName: 'Unum Teste',
      availableTenants: mockTenants,
      isMultiTenant: false,
      switchTenant: vi.fn(),
      isLoadingTenants: false,
    });
    (TenantService.listMyTenants as any).mockResolvedValue(mockTenants);
    (LeadService.list as any).mockImplementation((status: string) => {
      return Promise.resolve(mockLeads.filter(l => l.status === status));
    });
  });

  it('deve renderizar as colunas do Kanban e carregar os leads', async () => {
    render(<KanbanPage />);
    await waitFor(() => expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument());
    expect(screen.getByText('Novos Leads')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('deve desmascarar o faturamento ao clicar no olho', async () => {
    const user = userEvent.setup();
    render(<KanbanPage />);
    await waitFor(() => screen.getByText('R$ ••••••'));
    
    const eyeButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-eye'));
    await user.click(eyeButtons[0]);

    // Usamos getAllByText e validamos que ao menos um contém o valor formatado
    const revenueElements = screen.getAllByText(/R\$.*1\.000,00/);
    expect(revenueElements.length).toBeGreaterThan(0);
  });

  it('deve abrir o modal de novo lead e disparar criação', async () => {
    const user = userEvent.setup();
    render(<KanbanPage />);
    await waitFor(() => screen.queryByText(/Sincronizando/i) === null);

    await user.click(screen.getByRole('button', { name: /Menu Principal/i }));
    // Pega o primeiro "Novo Lead Manual" (Desktop)
    const newLeadButtons = screen.getAllByText('Novo Lead Manual');
    await user.click(newLeadButtons[0]);

    // O título do modal é um h2
    expect(screen.getByRole('heading', { name: /Novo Lead Manual/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Nome/i), 'Novo Cliente');
    await user.type(screen.getByLabelText(/WhatsApp/i), '11911112222');
    
    await user.click(screen.getByRole('button', { name: /Criar Lead/i }));

    expect(LeadService.create).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Novo Cliente', telefone: '(11) 91111-2222' }),
      'tenant-1'
    );
  });

  it('deve disparar exportação de Excel', async () => {
    const user = userEvent.setup();
    render(<KanbanPage />);
    await waitFor(() => screen.queryByText(/Sincronizando/i) === null);

    const exportBtn = screen.getByTitle(/Exportar Relatório/i);
    await user.click(exportBtn);

    const { writeFile } = await import('xlsx');
    expect(writeFile).toHaveBeenCalled();
  });

  describe('Datas de venda no mês certo (CA-01, CA-03, CA-04)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    // O fuso (America/Sao_Paulo) vem de test.env.TZ no vitest.config.ts.
    const fixTime = (date: Date) => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(date);
    };

    const openNewSaleForm = async (user: ReturnType<typeof userEvent.setup>) => {
      (LeadService.searchCustomers as any).mockResolvedValue([
        { id: 'lead-2', nome: 'Maria Souza', telefone: '11966665555', status: 'GANHO' },
      ]);
      await user.click(screen.getByRole('button', { name: /Menu Principal/i }));
      await user.click(screen.getAllByText('Registrar Nova Venda')[0]);
      await user.type(screen.getByPlaceholderText(/Pesquisar cliente/i), 'ma');
      await user.click(await screen.findByRole('button', { name: /Maria Souza/i }));
    };

    it('T08 — pede Ganho com limites de dia de calendário UTC e Perdido com limites locais', async () => {
      fixTime(new Date(2026, 8, 15, 12, 0));
      render(<KanbanPage />);

      await waitFor(() => {
        expect(LeadService.list).toHaveBeenCalledWith(
          'GANHO',
          '2026-09-01T00:00:00.000Z',
          '2026-09-30T23:59:59.999Z',
          'tenant-1'
        );
      });
      expect(LeadService.list).toHaveBeenCalledWith(
        'PERDIDO',
        new Date(2026, 8, 1).toISOString(),
        new Date(2026, 9, 0, 23, 59, 59).toISOString(),
        'tenant-1'
      );
    });

    it('T09 — o campo Data da Venda vem com a data local às 22:30 de 30/09', async () => {
      fixTime(new Date(2026, 8, 30, 22, 30));
      const user = userEvent.setup();
      render(<KanbanPage />);
      await waitFor(() => expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument());

      await openNewSaleForm(user);

      expect(screen.getByLabelText('Data da Venda')).toHaveValue('2026-09-30');
    });

    it('T10/CA-04 — a exportação mostra a venda do dia 1 e a data de nascimento sem deslocar um dia', async () => {
      fixTime(new Date(2026, 8, 15, 12, 0));
      const leadComVenda = {
        id: 'lead-9',
        nome: 'Ana Lima',
        email: 'ana@test.com',
        telefone: '11977776666',
        cpf: '12345678900',
        data_nascimento: '1990-05-12',
        origem: 'Indicação',
        status: 'GANHO',
        sales: [{ valor: 500, data: '2026-09-01T00:00:00Z' }],
      };
      (LeadService.list as any).mockImplementation((status: string) =>
        Promise.resolve(status === 'GANHO' ? [leadComVenda] : [])
      );
      const user = userEvent.setup();
      render(<KanbanPage />);
      await waitFor(() => expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument());

      await user.click(screen.getByTitle(/Exportar Relatório/i));

      const XLSX = await import('xlsx');
      const sheets = (XLSX.utils.json_to_sheet as any).mock.calls.map((c: any[]) => c[0]);
      const detailed = sheets[1];
      expect(detailed).toEqual([
        expect.objectContaining({
          'Data da Venda': '01/09/2026',
          'Data Nasc.': '12/05/1990',
          'Valor da Venda (R$)': 500,
        }),
      ]);
      expect(sheets[0][0]).toEqual(expect.objectContaining({ 'Data Nasc.': '12/05/1990' }));
    });
  });

  describe('Trava de clique duplo em Confirmar Venda (T11 — CA-07)', () => {
    const pending = () => new Promise(() => {});

    it('Nova Venda: o clique duplo envia uma única requisição e desabilita o botão', async () => {
      (LeadService.searchCustomers as any).mockResolvedValue([
        { id: 'lead-2', nome: 'Maria Souza', telefone: '11966665555', status: 'GANHO' },
      ]);
      (LeadService.addSale as any).mockImplementation(pending);
      const user = userEvent.setup();
      render(<KanbanPage />);
      await waitFor(() => expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /Menu Principal/i }));
      await user.click(screen.getAllByText('Registrar Nova Venda')[0]);
      await user.type(screen.getByPlaceholderText(/Pesquisar cliente/i), 'ma');
      await user.click(await screen.findByRole('button', { name: /Maria Souza/i }));
      await user.type(screen.getByPlaceholderText('0,00'), '10000');

      await user.dblClick(screen.getByRole('button', { name: /confirmar venda/i }));

      expect(LeadService.addSale).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /confirmar venda/i })).toBeDisabled();
    });

    it('Nova Venda: uma falha mostra o alerta e libera o botão', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      (LeadService.searchCustomers as any).mockResolvedValue([
        { id: 'lead-2', nome: 'Maria Souza', telefone: '11966665555', status: 'GANHO' },
      ]);
      (LeadService.addSale as any).mockRejectedValue(new Error('boom'));
      const user = userEvent.setup();
      render(<KanbanPage />);
      await waitFor(() => expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument());

      await user.click(screen.getByRole('button', { name: /Menu Principal/i }));
      await user.click(screen.getAllByText('Registrar Nova Venda')[0]);
      await user.type(screen.getByPlaceholderText(/Pesquisar cliente/i), 'ma');
      await user.click(await screen.findByRole('button', { name: /Maria Souza/i }));
      await user.type(screen.getByPlaceholderText('0,00'), '10000');

      await user.click(screen.getByRole('button', { name: /confirmar venda/i }));

      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Falha ao registrar venda'));
      expect(screen.getByRole('button', { name: /confirmar venda/i })).toBeEnabled();
      alertSpy.mockRestore();
    });

    it('Mover para Ganho: o clique duplo chama updateStatus uma única vez e desabilita o botão', async () => {
      (LeadService.updateStatus as any).mockImplementation(pending);
      const user = userEvent.setup();
      const { container } = render(<KanbanPage />);
      await waitFor(() => expect(screen.queryByText(/Sincronizando/i)).not.toBeInTheDocument());

      const quickMove = container.querySelector('svg.lucide-arrow-right-left')?.closest('button');
      expect(quickMove).not.toBeNull();
      await user.click(quickMove as HTMLElement);
      await user.click(screen.getByRole('button', { name: /Ganho \(Conversão\)/i }));
      await user.type(screen.getByPlaceholderText('0,00'), '10000');

      await user.dblClick(screen.getByRole('button', { name: /confirmar venda/i }));

      expect(LeadService.updateStatus).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /confirmar venda/i })).toBeDisabled();
    });
  });

  // T-04.1/T-04.2 (TenantService.list vs listMyTenants) e T-05.1-3 (inquilinos
  // bloqueados: ordenação, desabilitação e badge) foram relocados para
  // TenantContext.test.tsx (lógica de carregamento/ordenação/switchTenant) e
  // Navbar.test.tsx (renderização do dropdown desktop e menu mobile) — essa
  // responsabilidade pertence a TenantContext/Navbar desde o tenant-switcher
  // (7270de4); o Kanban apenas consome o contexto via useTenant().

  describe('Recarregamento de Leads ao Trocar Tenant (T06)', () => {
    it('T06 — Kanban: recarrega leads ao trocar tenant', async () => {
      const mockSwitchTenant = vi.fn();
      
      // Inicialmente com tenant-1
      (useTenant as any).mockReturnValue({
        activeTenantId: 'tenant-1',
        activeTenantName: 'Tenant 1',
        availableTenants: [
          { id: 'tenant-1', nome_negocio: 'Tenant 1' },
          { id: 'tenant-2', nome_negocio: 'Tenant 2' },
        ],
        isMultiTenant: true,
        switchTenant: mockSwitchTenant,
        isLoadingTenants: false,
      });

      const { rerender } = render(<KanbanPage />);

      // Aguarda carregar inicialmente os leads do tenant-1
      await waitFor(() => {
        expect(LeadService.list).toHaveBeenCalledWith(
          expect.any(String),
          undefined,
          undefined,
          'tenant-1'
        );
      });

      // Limpa as chamadas de mock para monitorar apenas o recarregamento
      vi.clearAllMocks();

      // Configura os leads retornados para o tenant-2
      const mockNewLeads = [
        { id: 'lead-3', nome: 'Renato Silva', status: 'NOVO', sales: [] }
      ];
      (LeadService.list as any).mockImplementation((status: string) => {
        return Promise.resolve(mockNewLeads.filter(l => l.status === status));
      });

      // Simula a mudança no activeTenantId no contexto
      (useTenant as any).mockReturnValue({
        activeTenantId: 'tenant-2',
        activeTenantName: 'Tenant 2',
        availableTenants: [
          { id: 'tenant-1', nome_negocio: 'Tenant 1' },
          { id: 'tenant-2', nome_negocio: 'Tenant 2' },
        ],
        isMultiTenant: true,
        switchTenant: mockSwitchTenant,
        isLoadingTenants: false,
      });

      // Re-renderiza o componente com o novo valor de contexto
      rerender(<KanbanPage />);

      // Deve disparar a busca de leads com o novo tenant-2
      await waitFor(() => {
        expect(LeadService.list).toHaveBeenCalledWith(
          expect.any(String),
          undefined,
          undefined,
          'tenant-2'
        );
      });

      // Verifica se o lead do tenant-1 (João Silva) foi substituído pelo do tenant-2 (Renato Silva)
      expect(screen.getByText('Renato Silva')).toBeInTheDocument();
      expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
    });
  });
});
