# unum-people-services-web

Frontend único em Next.js para gestão administrativa e operacional do SaaS Unum People.

## 1. Escopo Inicial
- **Foco:** Painéis de Gestão (CRM Tenant e Global Admin).
- **Landing Pages:** Fora do escopo inicial de desenvolvimento deste repositório.

## 2. Tecnologias
- **Framework:** Next.js (App Router).
- **Estilização:** Tailwind CSS.
- **Kanban:** `@hello-pangea/dnd`.
- **Autenticação:** Amazon Cognito via middleware (Netlify Edge Functions).

## 3. Funcionalidades Principais
- **Kanban Multi-origem:** Suporte à criação manual de leads e visualização de leads vindos de Ads/LPs.
- **WhatsApp Web Integration:** Links profundos para atendimento ágil.
- **OAuth Dashboard:** Interface para conexão com Google Ads API.

## 4. CI/CD (GitHub Actions + Netlify)
- **Branch Development:** Preview deploys na Netlify.
- **Branch Main:** Deploy em produção após merge de Pull Request.
