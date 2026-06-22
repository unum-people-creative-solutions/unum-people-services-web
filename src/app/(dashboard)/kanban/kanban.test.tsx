import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  it('T-04.1: deve chamar TenantService.listMyTenants com o argumento "crm" para usuario nao-GlobalAdmin', async () => {
    (useAuthStore as any).mockReturnValue({
      session: { email: 'user@test.com', name: 'User', tenantId: 'tenant-1', role: 'USER' },
      logout: vi.fn(),
      setSession: vi.fn(),
    });
    
    render(<KanbanPage />);
    
    await waitFor(() => {
      expect(TenantService.listMyTenants).toHaveBeenCalledWith('crm');
    });
  });

  it('T-04.2: deve chamar TenantService.list (sem argumentos) para usuario GlobalAdmin', async () => {
    (useAuthStore as any).mockReturnValue({
      session: { email: 'admin@test.com', name: 'Admin', tenantId: 'tenant-1', role: 'GlobalAdmin' },
      logout: vi.fn(),
      setSession: vi.fn(),
    });
    
    render(<KanbanPage />);
    
    await waitFor(() => {
      expect(TenantService.list).toHaveBeenCalledWith();
    });
  });

  describe('Inquilinos Bloqueados (Multi-Tenant)', () => {
    const mockTenantsWithBlocked = [
      { id: 'tenant-1', nome_negocio: 'Active Tenant', is_blocked: false },
      { id: 'tenant-2', nome_negocio: 'Blocked Tenant', is_blocked: true },
      { id: 'tenant-3', nome_negocio: 'Another Active Tenant', is_blocked: false },
    ];

    beforeEach(() => {
      (useAuthStore as any).mockReturnValue({
        session: { email: 'user@test.com', name: 'User', tenantId: 'tenant-1', role: 'USER' },
        logout: vi.fn(),
        setSession: vi.fn(),
      });
      (TenantService.listMyTenants as any).mockResolvedValue(mockTenantsWithBlocked);
      (useTenant as any).mockReturnValue({
        activeTenantId: 'tenant-1',
        activeTenantName: 'Active Tenant',
        availableTenants: mockTenantsWithBlocked,
        isMultiTenant: true,
        switchTenant: vi.fn(),
        isLoadingTenants: false,
      });
    });

    it('T-05.1: deve renderizar inquilino bloqueado como desabilitado e marcado como bloqueado no desktop select e no menu mobile', async () => {
      const user = userEvent.setup();
      render(<KanbanPage />);
      
      // No Desktop Select:
      // Espera-se que a opção do inquilino bloqueado esteja desabilitada e contenha "Bloqueado"
      await waitFor(() => {
        const option = screen.getByRole('option', { name: /Blocked Tenant.*Bloqueado/i });
        expect(option).toBeDisabled();
      });

      // No Menu Mobile:
      // Abre o menu principal
      const menuBtn = screen.getByRole('button', { name: /Menu Principal/i });
      await user.click(menuBtn);

      // Espera-se que o botão no menu mobile esteja desabilitado e contenha "Bloqueado"
      const mobileButton = screen.getByRole('button', { name: /Blocked Tenant.*Bloqueado/i });
      expect(mobileButton).toBeDisabled();
    });

    it('T-05.2: inquilinos bloqueados devem aparecer no final da lista de selecao', async () => {
      render(<KanbanPage />);
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        // Deve vir ordenado: Active Tenant, Another Active Tenant, Blocked Tenant
        expect(options[0]).toHaveValue('tenant-1');
        expect(options[1]).toHaveValue('tenant-3');
        expect(options[2]).toHaveValue('tenant-2');
      });
    });

    it('T-05.3: clicar ou selecionar um inquilino bloqueado nao deve alterar o inquilino ativo', async () => {
      const user = userEvent.setup();
      render(<KanbanPage />);
      
      const getTenantSelect = () => {
        const comboboxes = screen.getAllByRole('combobox') as HTMLSelectElement[];
        return comboboxes.find(el => el.querySelector('option[value="tenant-1"]')) || comboboxes[0];
      };

      await waitFor(() => {
        expect(getTenantSelect()).toHaveValue('tenant-1');
      });

      const select = getTenantSelect();
      // Tenta programaticamente mudar para o inquilino bloqueado
      await user.selectOptions(select, 'tenant-2');

      // Nao deve ter mudado o valor do select (deve continuar tenant-1)
      expect(select).toHaveValue('tenant-1');
    });
  });

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
