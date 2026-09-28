# Desenvolvimento

## Ambiente

- Node.js 24.x
- pnpm 11.28.0

## Fluxo local

```bash
pnpm install
pnpm dev
pnpm check
```

## Padrões

- Server Components por padrão.
- Client Components apenas quando necessários.
- Domínio separado da UI.
- Mobile-first e acessibilidade.
- TDD para regras de domínio.
- ATDD para jornadas relevantes.

## Issues

O número do GitHub é a referência canônica. Não inclua numeração manual no título.

Formato:

```text
Área: descrição objetiva
```

Labels funcionais usam tipo + área. Veja [Backlog](backlog.md).

## Commits

Use Conventional Commits:

- `feat`
- `fix`
- `refactor`
- `docs`
- `chore`
- `test`
- `perf`

Exemplo:

```text
feat(player): add synchronized timeline
```

## Pull Requests

Um PR deve referenciar a issue, explicar o comportamento alterado, incluir testes relevantes e passar pelas validações definidas em [CI/CD](ci-cd.md).

Quando houver mudança de comportamento, arquitetura, contrato ou governança, a documentação correspondente deve ser atualizada no mesmo PR.

## Definition of Done

- Critérios de aceite atendidos.
- Testes e validações relevantes verdes.
- Sem regressão conhecida no fluxo afetado.
- Documentação atualizada quando necessário.
- Conformidade com `AGENTS.md`.
- Quality e E2E aprovados antes do merge em `main`.

## CI/CD

Consulte [CI/CD e governança de mudanças](ci-cd.md) para o fluxo completo de issue, branch, PR, Quality, E2E, merge, release e publicação.
