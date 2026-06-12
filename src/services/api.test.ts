import { vi, describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';

const mockResponseInterceptors = vi.hoisted(() => ({
  success: null as any,
  error: null as any,
}));

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn().mockImplementation(() => {
        return {
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

beforeAll(async () => {
  api = (await import('./api')).default;
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
