import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock do framer-motion para evitar delays de animação nos testes
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Não precisamos mockar o localStorage manualmente, o jsdom já fornece um.
// Mas vamos garantir que ele esteja limpo antes de cada teste no próprio arquivo de teste.
