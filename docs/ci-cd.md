# CI/CD e governança de mudanças

## Objetivo

Este documento define o fluxo operacional oficial do Cifrases para mudanças, validação, merge e publicação.

## Fluxo oficial

Issue → branch → implementação → validação → Pull Request → Quality → E2E → merge em main → Release → Vercel Production

A issue é a unidade de rastreabilidade. O número real do GitHub deve conectar: Issue → branch → commits → PR → release.

## 1. Issue antes da implementação

Toda alteração relevante deve possuir uma issue própria antes da implementação.

O agente deve:
1. Pesquisar o backlog para evitar duplicidade.
2. Criar uma issue quando a mudança ainda não estiver representada.
3. Classificar a issue com um label de tipo e um label de área.
4. Registrar objetivo, escopo, critérios de aceite e fora de escopo quando aplicável.

Não reutilize uma issue antiga apenas para evitar criar uma nova.

## 2. Branch e implementação

A branch deve representar a mudança da issue. Commits usam Conventional Commits e devem referenciar a issue quando apropriado.

A implementação deve permanecer dentro do escopo registrado na issue.

## 3. Validação local

Para alterações de código, execute `pnpm check` e `pnpm test:e2e` conforme a mudança.

Para documentação exclusivamente, revise links e conteúdo e execute `git diff --check`. Não é necessário executar a suíte completa localmente.

## 4. Pull Request

O Pull Request deve referenciar a issue, explicar a mudança, informar testes e validações, atualizar documentação quando necessário e permanecer focado no escopo da issue.

## 5. Quality Gate

O check **Quality** é obrigatório.

Para alterações de código, executa `pnpm install --no-frozen-lockfile` e `pnpm check`. O `pnpm check` cobre lint, typecheck, testes unitários e build.

Para alterações exclusivamente documentais, o Quality Gate usa o caminho rápido: checkout → `git diff --check` → Quality = success.

Não instala dependências e não executa build, typecheck ou testes nesse caso.

## 6. E2E Gate

O check **E2E** depende do Quality.

Para alterações de código, executa Playwright em Chromium e Mobile Chrome.

Para documentação exclusivamente, executa `git diff --check` e reporta E2E = success sem instalar dependências ou executar Playwright.

O check continua existindo e pode permanecer configurado como obrigatório na proteção da `main`.

## 7. Regra para testes E2E

Os testes E2E devem validar estados reais da interface antes de executar ações dependentes desses estados.

Não confundir `Pausar / Retomar`, que controlam temporariamente a rolagem, com `Auto-scroll on / Auto-scroll off`, que controlam a ativação da funcionalidade.

Testes não devem depender de estado persistido por outros testes. Quando houver execução paralela ou múltiplos projetos Playwright, cada cenário deve preparar seu próprio estado inicial.

Preferir locators de acessibilidade, como `getByRole`, e validar explicitamente as transições de estado relevantes.

## 8. Proteção da main

A branch `main` deve exigir os checks **Quality** e **E2E** e impedir pushes diretos quando a proteção administrativa estiver configurada.

O workflow não deve ser desabilitado por filtros de caminho quando seus checks forem obrigatórios. Em vez disso, mudanças que não precisam do pipeline pesado devem usar o caminho rápido dentro dos próprios jobs.

## 9. Merge e publicação

Depois que os gates passarem, o Pull Request pode ser mergeado em `main`.

O push em `main` aciona o workflow de Release.

O deploy de Production é responsabilidade da Vercel, que acompanha a `main`.

Fluxo final: PR → Quality → E2E → Merge main → Release → Vercel Production.

## 10. Alterações exclusivamente documentais

São docs-only as alterações cujo conjunto de arquivos modificados contém somente arquivos `.md` ou arquivos dentro de `docs/`.

Qualquer alteração fora desses padrões faz o pipeline executar a validação completa. Isso inclui `.github/workflows/`, código, testes, configuração, dependências e arquivos de projeto.

A regra é conservadora: se houver dúvida, o pipeline pesado é executado.

## 11. Aprendizados obrigatórios do CI

Quando um job falhar, o agente deve validar o commit efetivamente testado antes de fazer rerun. Rerun repete o snapshot da execução original; uma correção em outro commit exige uma nova execução de PR/push.

Após qualquer refactor, o caminho mínimo de validação é `pnpm lint` + `pnpm typecheck`, seguido de `pnpm test` e `pnpm build` via `pnpm check`. Helpers adicionados durante um refactor devem ser usados ou removidos antes do merge.

Quando o CI apontar falha de código, registre o aprendizado na issue correspondente e corrija a causa antes de considerar a issue concluída.

## 12. Definition of Done

- Issue vinculada.
- Classificação correta.
- Critérios de aceite atendidos.
- Validações aplicáveis aprovadas.
- Documentação atualizada quando necessário.
- Quality e E2E verdes.
- PR mergeado em `main`.
- Issue correspondente encerrada.

## Referências

- [Guia para agentes](../AGENTS.md)
- [Desenvolvimento](development.md)
- [Estratégia de testes](testing.md)
- [Backlog](backlog.md)