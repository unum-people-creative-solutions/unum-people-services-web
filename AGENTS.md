# Unum People Services Web - Guia do Agente

Este arquivo contém as diretrizes fundamentais para o desenvolvimento do painel administrativo e CRM da Unum People. **Agente: Leia este arquivo sempre que iniciar uma sessão ou após comandos de compressão de contexto.**

## 🎯 Contexto do Projeto
Frontend principal do SaaS CRM, permitindo que inquilinos gerenciem leads e administradores provisionem novos clientes.

## 🏗️ Arquitetura e Rotas
- **Framework**: Next.js 15 (App Router).
- **Hospedagem**: Netlify.
- **Autenticação**: Amazon Cognito (JWT via Cookies HTTP-Only).
- **Rotas Privadas**:
  - `/dashboard/[tenant_id]`: CRM do Inquilino (Kanban).
  - `/admin`: Painel Global Admin.
- **Middleware**: Validação de RBAC na borda via Netlify Edge Functions.

## 🛠️ Padrões de Desenvolvimento & Segurança
- **Estilização**: Tailwind CSS com foco em responsividade e UX premium.
- **Estado**: Zustand ou React Context para gerenciamento do Kanban.
- **Bibliotecas**: SEMPRE preferir bibliotecas reconhecidas (ex: Framer Motion, Radix UI) in vez de implementações manuais para componentes React complexos.
- **Análise Pré-Implementação**: Antes de realizar qualquer alteração, o agente DEVE analisar as funcionalidades existentes no componente/página para garantir que nenhuma característica ou botão seja removido inadvertidamente. O objetivo é a evolução contínua sem regressões.
- **Sincronização Otimista**: Atualizar a UI do Kanban imediatamente e tratar erros de API em background.
- **Segurança**: Jamais expor segredos da AWS ou Google no lado do cliente. Utilizar `NEXT_PUBLIC_` apenas para chaves públicas.

### 🛡️ Protocolo de Engenharia Defensiva
- **Isolamento de Tenant**: Validar se o `tenant_id` na URL corresponde ao `tenant_id` no JWT do usuário.
- **Integridade Visual**: Seguir a identidade Unum (Brand Blue: `#3D5D97`, Brand Dark: `#44516F`).
- **Build & Lint**: Executar `npm run lint` antes de propor alterações complexas.

## 🛡️ Diretrizes LGPD & Privacidade
- **Controle de Acesso**: Garantir que um usuário só acesse dados de tenants aos quais está vinculado.

## 🧠 Persistência de Contexto (Context Anchor)
- **Recuperação**: Execute `cat AGENTS.md` para se reorientar.
- **Documentação**: Consulte `Frontend.md` no diretório pai para detalhes de arquitetura.

## 📝 Comandos Úteis
- `npm run dev`: Iniciar ambiente de desenvolvimento.
- `npm run build`: Validar build de produção.
- `npm run lint`: Verificar padrões de código.
