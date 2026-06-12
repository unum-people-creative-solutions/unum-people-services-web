import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AcessoNegadoPage from './page';

vi.mock('next/link', () => {
  return {
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
  };
});

describe('AcessoNegadoPage', () => {
  it('T-02.1: Renders AcessoNegadoPage -> checks that it has a heading <h1> with text "Acesso Negado"', () => {
    render(<AcessoNegadoPage />);
    const heading = screen.getByRole('heading', { level: 1, name: /Acesso Negado/i });
    expect(heading).toBeInTheDocument();
  });

  it('T-02.2: Renders AcessoNegadoPage -> checks that a link/button pointing to "/kanban" is present', () => {
    render(<AcessoNegadoPage />);
    const link = screen.getByRole('link', { name: /Kanban/i });
    expect(link).toHaveAttribute('href', '/kanban');
  });
});
