# Guia para agentes de IA

## Objetivo

Construir uma plataforma musical onde uma música estruturada é a fonte de verdade para catálogo, player, editor e apresentação.

## Governança obrigatória de mudanças

Toda alteração no código deve estar vinculada a **uma issue nova** antes de qualquer implementação.

Fluxo obrigatório:

1. Entender a solicitação e verificar o backlog para evitar duplicidade.
2. Criar uma nova issue no repositório quando a mudança ainda não estiver representada por uma issue existente.
3. Classificar a issue imediatamente com **um label de tipo** e **um label de área**.
4. Referenciar a issue no branch, commits e pull request.
5. Implementar somente o escopo registrado na issue.
6. Atualizar critérios de aceite e documentação quando o comportamento mudar.
7. Validar a alteração antes do merge.
8. Fechar a issue apenas quando a entrega correspondente estiver concluída.

### Regra de não codificar sem issue

Não iniciar implementação de feature, bug fix, refactor, ajuste de performance, teste ou alteração técnica relevante sem issue própria.

A única exceção é uma alteração documental mínima necessária para corrigir a própria documentação da mudança em andamento. Mesmo nesses casos, prefira manter a rastreabilidade por issue.

### Classificação obrigatória

Toda issue nova deve possuir:

- um label de **tipo**;
- um label de **área**.

Taxonomia oficial:

**Tipos**
- `feature`
- `fix`
- `docs`
- `test`
- `chore`
- `refactor`
- `perf`

**Áreas**
- `area:fundacao`
- `area:dados`
- `area:biblioteca`
- `area:cadastro`
- `area:musica`
- `area:player`
- `area:editor`
- `area:importacao`
- `area:ia`
- `area:apresentacao`
- `area:tema`
- `area:conta`
- `area:comunidades`
- `area:offline`
- `area:qualidade`
- `area:operacao`
- `area:catalogo`

Labels de ciclo de vida:

- `released`: entrega publicada;
- `duplicate`: issue consolidada por duplicidade.

As cores oficiais ficam versionadas em `.github/labels.yml`.

### Criação de issue por agente

Ao receber uma solicitação de alteração:

- pesquisar primeiro as issues existentes;
- se houver uma issue realmente equivalente, trabalhar nela;
- se não houver, criar uma nova issue;
- não reutilizar uma issue antiga apenas para evitar criar outra;
- classificar a nova issue antes de editar código.

Ao criar a issue, o agente deve incluir no mínimo:

- objetivo;
- escopo;
- critérios de aceite;
- fora de escopo quando houver;
- área;
- dependências quando aplicável.

### Rastreabilidade

Use o número real do GitHub como identificador canônico.

Não inclua `[#]`, `[01]`, `[02]` ou qualquer numeração manual no início dos títulos.

Formato de título:

`Área: descrição objetiva`

Commits devem usar Conventional Commits e referenciar a issue quando apropriado.

Exemplo:

`feat(player): add synchronized timeline (#14)`

Pull requests devem referenciar a issue e permitir rastrear:

`Issue → branch → commits → PR → release`.

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

## Regras de E2E para agentes

Ao criar ou alterar testes Playwright:

- preparar o estado inicial dentro do próprio cenário;
- não depender de localStorage, cookies ou navegação deixados por outro teste;
- validar o estado/contrato da UI antes de clicar em um controle dependente;
- diferenciar controles que pausam/retomam uma funcionalidade de controles que ativam/desativam a funcionalidade;
- considerar execução paralela e múltiplos projetos;
- preferir locators de acessibilidade.

Um exemplo recente do projeto mostrou que clicar em `Auto-scroll off` antes de colocar o controle no estado `on` fazia o teste aguardar até o timeout. O teste correto valida a transição de estado antes da ação.

## Next.js

- Use App Router.
- Server Components por padrão.
- Use `next/link` para navegação.
- Use `next/image` para imagens.
- Mantenha `.next/types/**/*.ts` no tsconfig.
- Mantenha `typedRoutes: true`.
- Não use `next lint`; lint é responsabilidade do Biome.

## CI/CD

O fluxo operacional canônico está em [docs/ci-cd.md](./docs/ci-cd.md).

Para agentes, a sequência obrigatória é:

Issue → branch → implementação → validação → PR → Quality → E2E → merge em `main` → Release.

Para mudanças exclusivamente documentais, o CI possui um caminho rápido. Ainda assim, os checks `Quality` e `E2E` devem ser publicados e concluídos com sucesso.

Não use filtros de caminho que façam os checks obrigatórios deixarem de ser reportados.

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

## Documentação

Alterações que modificarem comportamento, arquitetura, contratos, fluxos ou governança devem atualizar a documentação correspondente no mesmo trabalho.

A documentação canônica de backlog está em [docs/backlog.md](./docs/backlog.md).
