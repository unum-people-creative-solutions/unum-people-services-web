import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Testes de data dependem do fuso do navegador do usuário (Brasília).
    env: { TZ: 'America/Sao_Paulo' },
    globals: true,
    setupFiles: './src/test/setup.tsx',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
