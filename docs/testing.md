# Estratégia de testes

O Cifrases usa uma pirâmide simples:

```text
        E2E / ATDD
     Playwright + browser
            ▲
            │
     Integração / contrato
            ▲
            │
        Unit / TDD
           Vitest
```

## TDD

Para lógica de domínio:

1. Escreva o teste.
2. Execute para obter a falha esperada.
3. Implemente a menor solução.
4. Faça o teste passar.
5. Refatore preservando o comportamento.

As regras de domínio devem ser testáveis sem navegador, banco ou rede.

## ATDD

Para jornadas relevantes:

1. Defina o cenário em `tests/acceptance/*.feature`.
2. Crie o teste Playwright correspondente em `tests/e2e`.
3. Implemente até o cenário ficar verde.
4. Refatore sem alterar o comportamento aceito.

Prefira locators de acessibilidade como `getByRole`, `getByLabel` e `getByText`.

## Cobertura esperada

- Regra de domínio: teste unitário.
- Contrato/persistência: teste de integração ou contrato quando aplicável.
- Jornada de usuário: ATDD + E2E.
- Correção de bug: teste de regressão sempre que reproduzível.

## Regras para E2E

- Cada cenário deve preparar seu próprio estado inicial.
- Não depender de estado persistido por outros testes.
- Validar explicitamente o estado da UI antes de executar ações dependentes dele.
- Diferenciar controles de pausa/retomada de controles de ativação/desativação.
- Considerar execução paralela e múltiplos projetos Playwright.
- Preferir locators de acessibilidade.

## Validação

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Ou:

```bash
pnpm check
```

Para PRs exclusivamente documentais, o CI usa um caminho rápido que valida o diff sem instalar dependências nem executar a suíte pesada.

Nenhuma alteração deve desabilitar typecheck ou contornar os testes para obter um build verde.

## Importação da internet

- O domínio (`web-import.ts`) é testado com HTML de exemplo, sem rede.
- Os testes E2E (`tests/e2e/import-web.spec.ts`) simulam `/api/import/search` e `/api/import/fetch` com `page.route` e usam `serviceWorkers: "block"`, pois o service worker do app interceptaria o `fetch` antes da simulação.
- Nenhum teste automatizado acessa sites reais. A validação contra o site de origem é manual, porque o HTML da fonte pode mudar.

## Acessibilidade de repertórios e importação

Padrões adotados em `playlists-view.tsx`, `web-search-panel.tsx` e `song-import-view.tsx`; os testes E2E dependem deles:

- **Diálogos próprios** (`src/components/ui/dialog.tsx`, sobre `<dialog>` nativo) no lugar de `window.prompt`/`confirm` para renomear e excluir repertórios e blocos. Foco preso, Esc fecha, o foco volta ao botão que abriu e, em ações destrutivas, o foco inicial fica em "Cancelar".
- **Anúncios**: mudanças de estado (música movida, bloco criado, etapa da importação) vão para regiões `aria-live` (`data-testid="playlist-announcer"` nos repertórios).
- **Foco**: depois de mover uma música ou bloco o foco volta ao controle usado (ou ao botão oposto no limite da lista); depois de importar da internet o foco vai para o cabeçalho "Revise e salve".
- **Alvos de toque**: botões e seletores têm pelo menos 44px no mobile (`min-h-11`/`size-11`) e 36–40px no desktop.
- **Movimento**: `prefers-reduced-motion` desliga animações em `globals.css`.
