# Cifrases

Plataforma musical para descobrir, preparar, tocar, sincronizar e apresentar músicas.

O Cifrases nasceu para apoiar músicos em uma experiência comunitária, mas o produto é deliberadamente agnóstico de gênero musical. A entidade `Song` é a fonte de verdade compartilhada pelo catálogo, player, editor e modos de apresentação.

## Experiências

- Biblioteca
- Cadastro e edição de músicas
- Modo músico
- Sincronização de letra e áudio
- Editor estrutural e timeline
- Apresentação 16:9
- Modo palco / teleprompter
- Temas por contexto
- Importação e assistência por OCR/IA
- Comunidades e uso offline

## Princípios de engenharia

- Next.js App Router com Server Components por padrão.
- Domínio separado da UI.
- `Song` como contrato central do produto.
- Mobile-first e acessibilidade.
- TDD para regras de domínio e ATDD para jornadas relevantes.
- Não versionar binários grandes de mídia no Git.
- Validar com `pnpm check` antes de abrir um PR.

## Stack

- Node.js 24.x
- pnpm 10.16.1
- Next.js 16
- React 19
- TypeScript 5.9
- Biome
- Vitest
- Playwright

## Desenvolvimento local

```bash
pnpm install
pnpm dev
pnpm check
```

Comandos individuais:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Documentação

| Documento | Finalidade |
| --- | --- |
| [Arquitetura](docs/architecture.md) | Estrutura técnica e fronteiras do sistema |
| [Domínio](docs/domain.md) | Conceitos e regras do modelo musical |
| [Formato de música](docs/song-format.md) | Contrato estrutural de `Song` |
| [Armazenamento](docs/storage.md) | Estratégia para mídia e referências de arquivos |
| [Modo de apresentação](docs/presentation-mode.md) | Regras dos modos 16:9 e palco |
| [Design System](docs/design-system.md) | Princípios visuais e temas |
| [Testes](docs/testing.md) | TDD, ATDD, E2E e CI |
| [Desenvolvimento](docs/development.md) | Workflow, commits, PRs e Definition of Done |
| [Backlog](docs/backlog.md) | Inventário canônico das issues e taxonomia |
| [Roadmap](docs/roadmap.md) | Evolução funcional por capacidade |

## Backlog e Issues

O número da issue do GitHub é a referência canônica. Os títulos não devem repetir o número manualmente.

Padrão:

`Área: descrição objetiva`

Exemplos:

- `Player: transposição de tonalidade`
- `Editor: timeline visual de música`
- `Biblioteca: busca, filtros e ordenação`

Labels funcionais usam tipo e área. A taxonomia oficial está em [Backlog](docs/backlog.md).

## Agentes

Leia [AGENTS.md](./AGENTS.md) antes de modificar o projeto.

## Licença

MIT.
