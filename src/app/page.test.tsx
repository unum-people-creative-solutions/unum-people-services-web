import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LandingPage from './page';

vi.mock('@/lib/pkce', () => ({
  redirectToHostedUI: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('LandingPage Page.tsx links de termos e privacidade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('deve exibir o link de termos de uso com as propriedades corretas', () => {
    render(<LandingPage />);
    const link = screen.getByRole('link', { name: /Termos de Uso/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toMatch(/^https:\/\/unumpeople\.com\.br\/termos\//);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('deve exibir o link de política de privacidade com as propriedades corretas', () => {
    render(<LandingPage />);
    const link = screen.getByRole('link', { name: /Privacidade/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toMatch(/^https:\/\/unumpeople\.com\.br\/termos\//);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
