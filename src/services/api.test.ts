import { vi, describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import type { MonthSale } from './api';

const mockResponseInterceptors = vi.hoisted(() => ({
  success: null as any,
  error: null as any,
}));

const mockGet = vi.hoisted(() => vi.fn());

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn().mockImplementation(() => {
        return {
          get: mockGet,
          interceptors: {
            request: {
              use: vi.fn(),
            },
            response: {
              use: vi.fn((success, error) => {
                mockResponseInterceptors.success = success;
                mockResponseInterceptors.error = error;
              }),
            },
          },
        };
      }),
    },
  };
});

let api: any;
let LeadService: typeof import('./api').LeadService;

beforeAll(async () => {
  const mod = await import('./api');
  api = mod.default;
  LeadService = mod.LeadService;
});

describe('API Interceptor de Resposta (status 403)', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      href: 'http://localhost/dashboard',
      pathname: '/dashboard',
      assign: vi.fn(),
      replace: vi.fn(),
    } as any;
  });

  afterEach(() => {
    delete (window as any).location;
    window.location = originalLocation as any;
  });

  it('T-01.1: deve redirecionar para /acesso-negado quando receber status 403 e nao estiver na rota /acesso-negado', async () => {
    const mockError = {
      response: {
        status: 403,
      },
    };

    await expect(mockResponseInterceptors.error(mockError)).rejects.toEqual(mockError);
    expect(window.location.href).toBe('/acesso-negado');
  });

  it('T-01.2: nao deve redirecionar quando receber status 403 se ja estiver na rota /acesso-negado', async () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      href: 'http://localhost/acesso-negado',
      pathname: '/acesso-negado',
      assign: vi.fn(),
      replace: vi.fn(),
    } as any;

    const mockError = {
      response: {
        status: 403,
      },
    };

    await expect(mockResponseInterceptors.error(mockError)).rejects.toEqual(mockError);
    expect(window.location.href).toBe('http://localhost/acesso-negado');
  });
});

describe('LeadService.listSalesByMonth (T12 — contrato RF-07)', () => {
  it('faz GET /leads?view=sales&month=&tenant_id= e devolve response.data tipado como MonthSale[]', async () => {
    const sales: MonthSale[] = [
      {
        lead_id: 'lead-1',
        nome: 'Maria Souza',
        email: 'maria@test.com',
        telefone: '11966665555',
        cpf: '',
        data_nascimento: '1990-05-12',
        origem: 'Indicação',
        status: 'GANHO',
        sale_id: 'sale-1',
        valor: 500,
        data: '2026-09-01',
      },
    ];
    mockGet.mockResolvedValue({ data: sales });

    const result: MonthSale[] = await LeadService.listSalesByMonth('2026-09', 't1');

    expect(mockGet).toHaveBeenCalledWith('/leads?view=sales&month=2026-09&tenant_id=t1');
    expect(result).toEqual(sales);
  });
});
