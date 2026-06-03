import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';
import { Mail } from 'lucide-react';

describe('Input Component', () => {
  it('deve renderizar o label corretamente', () => {
    render(<Input label="E-mail" />);
    expect(screen.getByText('E-mail')).toBeInTheDocument();
  });

  it('deve permitir a digitação', async () => {
    const user = userEvent.setup();
    render(<Input label="Nome" placeholder="Digite seu nome" />);
    
    const input = screen.getByPlaceholderText('Digite seu nome');
    await user.type(input, 'John Doe');
    
    expect(input).toHaveValue('John Doe');
  });

  it('deve exibir mensagem de erro e aplicar estilos de erro', () => {
    render(<Input label="Senha" error="Senha obrigatória" />);
    
    expect(screen.getByText('Senha obrigatória')).toBeInTheDocument();
    const input = screen.getByLabelText('Senha');
    expect(input).toHaveClass('border-brand-orange');
  });

  it('deve renderizar o ícone quando fornecido', () => {
    render(<Input label="E-mail" icon={<Mail data-testid="mail-icon" />} />);
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('deve encaminhar o ref corretamente', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});
