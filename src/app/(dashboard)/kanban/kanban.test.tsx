import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KanbanPage from './page';
import { LeadService, TenantService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

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
});
