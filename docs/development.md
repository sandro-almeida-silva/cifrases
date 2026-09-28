# Desenvolvimento

## Ambiente

- Node.js 24.x
- pnpm 10.16.1

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

## Issues

O número do GitHub é a referência canônica. Não inclua numeração manual no título.

Formato:

```text
Área: descrição objetiva
```

Labels funcionais usam tipo + área. Veja [Backlog](backlog.md).

## Pull Requests

Um PR deve referenciar a issue, explicar o comportamento alterado, incluir testes relevantes e passar por `pnpm check`.

Quando houver mudança de comportamento, a documentação correspondente deve ser atualizada no mesmo PR.

## Definition of Done

- Critérios de aceite atendidos.
- Testes relevantes verdes.
- Sem regressão conhecida no fluxo afetado.
- Documentação atualizada quando necessário.
- Conformidade com `AGENTS.md`.