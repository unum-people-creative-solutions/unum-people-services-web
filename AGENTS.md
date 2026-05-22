# Unum People Services Web - Guia do Agente

Este repositório contém o frontend principal (Next.js) e o empacotamento TWA para Android.

## 🚀 Workflow TLC (Obrigatório)
Este projeto utiliza o framework **tlc-spec-driven**. Para qualquer nova implementação:
1.  **Aprovação Prévia (TDD na Raiz)**: JAMAIS inicie a implementação de código sem antes gerar um Documento de Design Técnico (TDD) detalhado na raiz do projeto e obter aprovação explícita do usuário antes de iniciar a execução.
2.  Consulte a especificação de baseline em `baseline_frontend_spec.md`.
3.  Siga o workflow global definido em `../../.specs/codebase/rules.md`.

## 🛠️ Skills e Ferramentas
-   **Skill Recomendada**: `tlc-spec-driven` para planejar e executar mudanças.
-   **UI de Elite**: `tailwind-expert` e `react-best-practices` quando aplicável.
-   **Comandos**:
    *   `npm run dev`: Ambiente local.
    *   `npm test`: Executar Vitest/RTL (TDD mandatório).

---
*Para regras detalhadas de design e mobile-first, consulte `.specs/codebase/` na raiz.*
