# Spec: Melhoria do Modal de Exclusão de Conta (Configurações)

Melhorar a experiência e segurança do processo de solicitação de exclusão de conta na tela de configurações, garantindo que o usuário compreenda as consequências e confirme explicitamente a ação.

## Requisitos

- **REQ-001: Alerta de Consequências**: O modal deve exibir um aviso claro e destacado sobre a irreversibilidade da ação e a perda imediata de acesso.
- **REQ-002: Confirmação por Texto**: O botão de confirmação de exclusão deve permanecer desabilitado até que o usuário digite a palavra "excluir" em um campo de entrada específico.
- **REQ-003: UI Consistente**: O campo de entrada e as mensagens de erro/instrução devem seguir o padrão visual do sistema (estilo kanban delete modal).
- **REQ-004: Feedback Visual**: O botão "Solicitar Exclusão" na página principal deve manter seu estilo de alerta (vermelho/danger zone).

## Critérios de Aceite

1. Ao clicar em "Solicitar Exclusão", o modal abre com a lista de consequências.
2. Existe um campo de texto com a instrução "Para confirmar, digite excluir abaixo:".
3. O botão "Sim, Excluir" só fica habilitado quando o texto for exatamente "excluir" (case-insensitive ou conforme padrão). *Nota: No kanban é case-insensitive `toLowerCase() !== "excluir"`.*
4. O fechamento do modal limpa o campo de confirmação.

## Referências
- Arquivo: `app/(dashboard)/settings/page.tsx`
- Exemplo de implementação similar: `app/(dashboard)/kanban/page.tsx` (handleDeleteLead)
