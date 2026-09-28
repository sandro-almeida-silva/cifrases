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

Nenhuma alteração deve desabilitar typecheck ou contornar os testes para obter um build verde.
