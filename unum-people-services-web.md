# unum-people-services-web

Frontend único em Next.js focado em performance de vendas e atribuição de anúncios.

## 1. Funcionalidades de CRM
- **Kanban Estratégico:** Gestão visual de leads com scroll independente por coluna e cabeçalhos fixos.
- **Ciclo de Vida do Cliente:**
    - **Nova Venda:** Botão dedicado para registrar compras de clientes que já estão na base.
    - **LTV (Lifetime Value):** Exibição do faturamento total acumulado do cliente diretamente no card.
    - **Histórico de Vendas:** Modal de edição com lista detalhada de todas as transações passadas.
- **Faturamento Dinâmico:** Filtro por Mês/Ano que recalcula o faturamento total somando todas as vendas individuais ocorridas no período.

## 2. User Experience (UX)
- **Máscaras Monetárias:** Inputs formatados em tempo real seguindo o padrão brasileiro (R$ 0,00).
- **Normalização de Dados:** E-mails são convertidos automaticamente para minúsculas para evitar erros de login e duplicidade.
- **Multi-Account:** Seletor de conta inteligente que permite trocar de inquilino instantaneamente sem precisar deslogar.

## 3. Gestão Administrativa
- **Dashboard Global:** Visualização de todos os inquilinos e seus respectivos faturamentos (Apenas para GlobalAdmin).
- **Convite de Usuários:** Fluxo para adicionar novos membros a uma conta ou vincular usuários existentes a novos tenants.

## 4. Tecnologias
- **Next.js 15+** (App Router).
- **Tailwind CSS** para design responsivo.
- **Lucide Icons** para ícones semânticos.
- **Zustand** para persistência de sessão e estado global.
