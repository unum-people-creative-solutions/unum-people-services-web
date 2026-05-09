# unum-people-services-web

Frontend único em Next.js focado em performance de vendas e atribuição de anúncios.

## 1. Funcionalidades de CRM
- **Kanban Estratégico:** Gestão visual de leads com scroll independente por coluna, cabeçalhos fixos e filtros avançados por período e status.
- **Ciclo de Vida do Cliente:**
    - **Nova Venda:** Registro de transações com suporte a **data retroativa da venda** para precisão no faturamento histórico.
    - **LTV (Lifetime Value):** Exibição do faturamento total acumulado do cliente diretamente no card.
    - **Histórico de Vendas:** Modal de edição com lista detalhada e cronológica de todas as transações passadas.
- **Faturamento Dinâmico:** Filtro inteligente por Mês/Ano que recalcula o faturamento total em tempo real com base nas vendas do período selecionado.
- **Exportação de Relatórios:** Botão dedicado para gerar relatórios comerciais em formato **Excel (.xlsx)**, incluindo abas de resumo e vendas detalhadas para análise externa.

## 2. Integrações & Marketing
- **Google Ads OAuth:** Integração nativa para autorização de acesso a contas MCC ou contas de clientes, permitindo captura de leads e automação de conversões.
- **Atribuição de Leads:** Fluxo otimizado para vincular dados de tráfego pago diretamente ao funil de vendas.

## 3. Suporte & Documentação
- **Central de Ajuda Integrada:** Link direto no dashboard para o repositório de documentação técnica e guias de uso.
- **Conformidade LGPD:** Fluxo de consentimento obrigatório para Termos de Uso e Política de Privacidade integrado ao login, com interface adaptada para mobile.

## 4. Gestão Administrativa & Segurança
- **API Key Management**: Visualização e cópia da chave de integração programática diretamente na lista de gestão de Tenants.
- **Notificações Push**: Botão para ativar/desativar notificações push por inquilino diretamente na lista administrativa.
- **Dashboard Global**: Visualização de todos os inquilinos e seus respectivos faturamentos (Apenas para GlobalAdmin).
- **Convite de Usuários:** Fluxo para adicionar novos membros a uma conta ou vincular usuários existentes a novos tenants.

## 5. User Experience (UX)
- **Mobile First & PWA Ready:** Interface otimizada com **Menu Principal Expansível** e Navegação Full-Screen via gestos (Framer Motion).
- **Consistência Visual:** Implementação da nova identidade visual Unum People e bloqueio de scroll inteligente em menus mobile.
- **Máscaras Monetárias:** Inputs formatados em tempo real seguindo o padrão brasileiro (R$ 0,00).
- **Normalização de Dados:** E-mails são convertidos automaticamente para minúsculas para evitar erros de login e duplicidade.
- **Multi-Account:** Seletor de conta inteligente que permite trocar de inquilino instantaneamente sem precisar deslogar.

## 7. Progressive Web App (PWA) & Play Store (TWA)
O projeto está configurado como um PWA de alta performance, pronto para ser empacotado para a Google Play Store usando Trusted Web Activity (TWA).

### Configurações Atuais
- **Offline Support:** Service Worker configurado via `next-pwa`.
- **Manifest:** Localizado em `public/manifest.json`. Contém definições de cores (`#3D5D97`) e ícones maskable.
- **TWA Validation:** Digital Asset Links em `public/.well-known/assetlinks.json`.
    - *Fingerprint Atual:* Inclui o SHA256 da KeyStore de desenvolvimento local.
    - *Produção:* Adicionar o SHA256 do Google Play App Signing quando a conta for aprovada.

### Ciclo de Build Android (Bubblewrap)
1. **Configuração**: `npx @bubblewrap/cli init --manifest=https://crm.unumpeople.com.br/manifest.json`
2. **Build**: `npx @bubblewrap/cli build`
3. **KeyStore**: O arquivo `android.keystore` é a chave de assinatura. **Nunca perca a senha desta chave.**
4. **Artefatos**:
    - `app-release-signed.apk`: Para testes manuais em dispositivos Android.
    - `app-release-bundle.aab`: Para upload no Google Play Console.

## 8. Tecnologias
- **Next.js 14/15** (App Router).
- **Tailwind CSS** para design responsivo.
- **Framer Motion** para animações e interações mobile.
- **Zustand** para persistência de sessão e estado global.
- **next-pwa** para suporte PWA.
- **Bubblewrap CLI** para geração do TWA Android.
