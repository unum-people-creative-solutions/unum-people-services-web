# Tasks: Melhoria do Modal de Exclusão de Conta

## Tarefas de Implementação

- [x] **TASK-001: Estado de Confirmação**: Adicionar o estado `deleteConfirmationText` e atualizar o fechamento do modal para resetar esse estado.
- [x] **TASK-002: UI do Modal**: Atualizar o layout do modal para incluir a seção de aviso de consequências (destacada) e o campo de input de confirmação.
- [x] **TASK-003: Lógica de Confirmação**: Condicionar a habilitação do botão de exclusão ao valor do input ser "excluir".
- [x] **TASK-004: Atualização de Testes**: Ajustar o arquivo `settings.test.tsx` para simular a digitação de "excluir" antes de clicar no botão de confirmação.

## Verificação

1. Rodar testes: `npm test app/(dashboard)/settings/settings.test.tsx` (ou comando equivalente no projeto).
2. Verificação manual: Abrir a página de configurações, clicar em excluir, tentar clicar no botão sem digitar, digitar incorretamente, digitar corretamente.
