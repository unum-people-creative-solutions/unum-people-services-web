# Unum People Services Web - Guia do Agente

Este arquivo contém as diretrizes fundamentais para o desenvolvimento do painel administrativo e CRM da Unum People. **Agente: Leia este arquivo sempre que iniciar uma sessão ou após comandos de compressão de contexto.**

## 🎯 Contexto do Projeto
Frontend principal do SaaS CRM, permitindo que inquilinos gerenciem leads e administradores provisionem novos clientes.

## 🏗️ Arquitetura e Rotas
- **Framework**: Next.js 15 (App Router).
- **Hospedagem**: Netlify.
- **Autenticação**: Amazon Cognito (JWT via Cookies HTTP-Only).
- **Integrações**: Google Ads (OAuth para captura de leads e conversões).
- **Rotas Privadas**:
  - `/dashboard/[tenant_id]`: CRM do Inquilino (Kanban).
  - `/admin`: Painel Global Admin (Gestão de Tenants, API Keys e Notificações Push por inquilino).
  - `/settings/ads/callback`: Callback de autorização do Google Ads.
- **Middleware**: Validação de RBAC na borda via Netlify Edge Functions.

## 📱 Mobile & PWA (Trusted Web Activity)
- **PWA Ready**: O app deve manter conformidade com o Lighthouse PWA. Alterações no `public/manifest.json` devem ser validadas.
- **Notificações Push**: Implementadas via Web Push nativo.
  - Service Worker: `src/worker/index.ts` (Compilado pelo `next-pwa`).
  - Hook: `usePushNotifications` para gerenciar permissões e inscrições.
  - Serviço: `src/services/notificationService.ts` para comunicação com o backend externo.
- **TWA Integrity**: O arquivo `public/.well-known/assetlinks.json` é crítico. Ao adicionar novas chaves de assinatura (ex: Play Store), o fingerprint SHA256 deve ser anexado à lista sem remover os existentes.
- **UX Nativa**: Priorizar gestos e evitar barras de scroll horizontais. O tema do navegador deve sempre respeitar o Brand Blue (`#3D5D97`).
## 🛠️ Padrões de Desenvolvimento & Segurança
- **Estilização**: Tailwind CSS com foco em responsividade e UX premium (uso de `framer-motion` para interações mobile).
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
- **Consentimento**: Uso do `TermsModal` para garantir aceite de termos e política antes do acesso ao CRM.
- **Controle de Acesso**: Garantir que um usuário só acesse dados de tenants aos quais está vinculado.

## 🔄 Ciclo de Lançamento & Versão
- **Versionamento**: O app utiliza versionamento semântico no `package.json`.
- **Atualização Automática**: Ao implementar novas funcionalidades significativas ou correções críticas, o agente DEVE incrementar a versão no `package.json` (ex: `patch` para correções, `minor` para novas features). Use o comando `npm version patch --no-git-tag-version` para automatizar.

## 📚 Manutenção de Documentação
- **Atualização Proativa**: O agente é responsável por manter o `README.md`, o `AGENTS.md` e outros arquivos de documentação sincronizados com as mudanças no código.
- **Revisão de Diffs**: Sempre que finalizar uma tarefa, revise o que foi alterado e verifique se as seções "Arquitetura", "Rotas" ou "Diretrizes" em ambos os arquivos precisam de ajustes.

## 🧠 Persistência de Contexto (Context Anchor)
- **Recuperação**: Execute `cat AGENTS.md` para se reorientar.
- **Documentação**: Consulte `Frontend.md` no diretório pai para detalhes de arquitetura.

## 📝 Comandos Úteis
- `npm run dev`: Iniciar ambiente de desenvolvimento.
- `npm run build`: Validar build de produção.
- `npm run lint`: Verificar padrões de código.
