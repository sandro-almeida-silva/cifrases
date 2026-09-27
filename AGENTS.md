# Guia para agentes de IA

## Objetivo

Construir uma plataforma musical onde uma música estruturada é a fonte de verdade para catálogo, player, editor e apresentação.

## Regras

- Server Components por padrão.
- Client Components somente quando estado, eventos ou APIs do navegador forem necessários.
- Domínio separado da UI.
- Mobile-first e acessibilidade.
- Use tokens do design system.
- O domínio deve ser agnóstico de gênero musical.
- Não versionar áudios e imagens grandes no Git.

## Domínio

A timeline deve suportar timestamp, beat e compasso. Arranjos diferentes devem reutilizar a mesma música.

## Commits

Use Conventional Commits: feat, fix, refactor, docs, chore, test e perf.

Antes de concluir:

```bash
pnpm lint
pnpm typecheck
pnpm build
```
