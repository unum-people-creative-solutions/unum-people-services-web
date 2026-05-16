import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from './Navbar';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/lib/google-ads', () => ({
  getGoogleAdsAuthUrl: vi.fn(() => 'https://ads-auth-url.com'),
}));

describe('Navbar Component', () => {
  const mockPush = vi.fn();
  const mockLogout = vi.fn();
  const mockOnRefresh = vi.fn();
  const mockOnNewLead = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (useAuthStore as any).mockReturnValue({
      session: { name: 'Jared Evans', role: 'User' },
      logout: mockLogout,
    });
  });

  it('deve renderizar a logo', () => {
    render(<Navbar />);
    expect(screen.getAllByAltText('Unum People')[0]).toBeInTheDocument();
  });

  it('deve abrir o menu principal ao clicar no botão', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    
    const menuButton = screen.getByRole('button', { name: /Menu Principal/i });
    await user.click(menuButton);

    expect(screen.getAllByText('CRM Kanban').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Configurações e LGPD').length).toBeGreaterThan(0);
  });

  it('deve exibir Gestão de Inquilinos apenas para GlobalAdmin', async () => {
    const user = userEvent.setup();
    (useAuthStore as any).mockReturnValue({
      session: { name: 'Admin User', role: 'GlobalAdmin' },
      logout: mockLogout,
    });

    render(<Navbar />);
    await user.click(screen.getByRole('button', { name: /Menu Principal/i }));

    expect(screen.getAllByText('Gestão de Inquilinos').length).toBeGreaterThan(0);
  });

  it('não deve exibir Gestão de Inquilinos para usuários comuns', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByRole('button', { name: /Menu Principal/i }));

    expect(screen.queryByText('Gestão de Inquilinos')).not.toBeInTheDocument();
  });

  it('deve chamar onRefresh ao clicar no botão de atualizar (desktop)', async () => {
    const user = userEvent.setup();
    render(<Navbar onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByTitle('Atualizar');
    await user.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('deve realizar logout corretamente', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    
    await user.click(screen.getByRole('button', { name: /Menu Principal/i }));
    
    // O botão de logout aparece no menu aberto (duplicado mobile/desktop)
    const logoutButton = screen.getAllByText('Sair do Sistema')[0];
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('deve bloquear o scroll do body quando o menu mobile estiver aberto', async () => {
    const user = userEvent.setup();
    // Simular mobile
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    
    render(<Navbar />);
    const menuButton = screen.getByRole('button', { name: /Menu Principal/i });
    await user.click(menuButton);

    expect(document.body.style.overflow).toBe('hidden');
  });
});
