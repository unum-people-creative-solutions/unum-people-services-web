import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TermsModal from './TermsModal';

describe('TermsModal Component', () => {
  const mockOnAccept = vi.fn();
  const testEmail = 'user@test.com';

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    // Reset window width to desktop default
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    window.dispatchEvent(new Event('resize'));
  });

  it('deve renderizar o conteúdo corretamente', () => {
    render(<TermsModal email={testEmail} onAccept={mockOnAccept} />);
    
    expect(screen.getByText('Atualização de Privacidade')).toBeInTheDocument();
    expect(screen.getByText('Termos de Uso')).toBeInTheDocument();
    expect(screen.getByText('Política de Privacidade')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Concordar e Continuar/i })).toBeInTheDocument();
  });

  it('deve conter os links corretos para termos e privacidade', () => {
    render(<TermsModal email={testEmail} onAccept={mockOnAccept} />);
    
    const termsLink = screen.getByRole('link', { name: /Ler Termos Completos/i });
    const privacyLink = screen.getByRole('link', { name: /Ler Política Completa/i });

    expect(termsLink).toHaveAttribute('href', '/terms');
    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(termsLink).toHaveAttribute('target', '_blank');
  });

  it('deve processar o aceite corretamente ao clicar no botão', async () => {
    const user = userEvent.setup();
    render(<TermsModal email={testEmail} onAccept={mockOnAccept} />);
    
    const button = screen.getByRole('button', { name: /Concordar e Continuar/i });
    await user.click(button);

    // Deve mostrar loading
    expect(screen.getByText('Processando...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Aguarda o processamento (setTimeout de 500ms no componente)
    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalled();
      const storageValue = window.localStorage.getItem(`terms-accepted-${testEmail}`);
      expect(storageValue).not.toBeNull();
      expect(new Date(storageValue!).getTime()).toBeLessThanOrEqual(Date.now());
    }, { timeout: 1000 });
  });

  it('deve detectar o modo mobile corretamente', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    window.dispatchEvent(new Event('resize'));
    
    render(<TermsModal email={testEmail} onAccept={mockOnAccept} />);
    
    // Verifica se a barra de arrastar mobile está presente (via classe md:hidden)
    const dragBar = screen.getByRole('button', { name: /Concordar e Continuar/i }).parentElement?.parentElement?.querySelector('.md\\:hidden');
    expect(dragBar).toBeDefined();
  });
});
