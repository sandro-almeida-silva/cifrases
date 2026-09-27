# Guia para agentes de IA

## Objetivo

Construir uma plataforma musical onde uma música estruturada é a fonte de verdade para catálogo, player, editor e apresentação.

## Regras de engenharia

- Server Components por padrão.
- Client Components somente quando estado, eventos ou APIs do navegador forem necessários.
- Domínio separado da UI.
- Mobile-first e acessibilidade.
- Use tokens do design system.
- O domínio deve ser agnóstico de gênero musical.
- Não versionar áudios e imagens grandes no Git.
- Não desabilitar typecheck durante build.
- Não introduzir configuração customizada de webpack sem necessidade comprovada.
- Preserve os defaults modernos do Next.js e do Turbopack.

## TDD

Para lógica de domínio, siga Red -> Green -> Refactor.

O teste deve expressar o comportamento antes da implementação sempre que a mudança for uma regra nova.

## ATDD

Para jornadas de usuário:

1. Criar cenário em `tests/acceptance/*.feature`.
2. Criar teste Playwright correspondente em `tests/e2e`.
3. Implementar até o cenário ficar verde.
4. Refatorar sem alterar o comportamento aceito.

## Next.js

- Use App Router.
- Server Components por padrão.
- Use `next/link` para navegação.
- Use `next/image` para imagens.
- Mantenha `.next/types/**/*.ts` no tsconfig.
- Mantenha `typedRoutes: true`.
- Não use `next lint`; lint é responsabilidade do Biome.

## Testes

```bash
pnpm test
pnpm test:e2e
pnpm check
```

Veja também [docs/testing.md](./docs/testing.md).

## Commits

Use Conventional Commits:

- feat
- fix
- refactor
- docs
- chore
- test
- perf

Exemplo: `feat(player): add synchronized timeline`.
