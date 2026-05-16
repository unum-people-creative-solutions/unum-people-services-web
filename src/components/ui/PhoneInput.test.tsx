import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PhoneInput } from './PhoneInput';
import React from 'react';

describe('PhoneInput Component', () => {
  it('deve aplicar máscara de telefone celular (11 dígitos)', async () => {
    const user = userEvent.setup();
    render(<PhoneInput label="Telefone" />);
    
    const input = screen.getByLabelText('Telefone');
    await user.type(input, '11988887777');
    
    expect(input).toHaveValue('(11) 98888-7777');
  });

  it('deve lidar com colagem (paste) de 11 dígitos', async () => {
    const user = userEvent.setup();
    render(<PhoneInput label="Telefone" />);
    
    const input = screen.getByLabelText('Telefone');
    await user.click(input);
    await user.paste('11988887777');
    
    expect(input).toHaveValue('(11) 98888-7777');
  });

  it('deve exibir mensagem de erro', () => {
    render(<PhoneInput label="Telefone" error="Telefone inválido" />);
    expect(screen.getByText('Telefone inválido')).toBeInTheDocument();
  });

  it('deve encaminhar o ref corretamente para o react-number-format', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<PhoneInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
