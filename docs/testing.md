# Estratégia de testes

O Cifrases usa uma pirâmide de testes simples:

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

1. Escreva o teste que descreve o comportamento esperado.
2. Execute para obter a falha esperada.
3. Implemente a menor solução.
4. Execute novamente até ficar verde.
5. Refatore preservando o comportamento.

As regras de domínio devem ser testáveis sem navegador, banco ou rede.

## ATDD

Antes de implementar uma jornada relevante, escreva critérios de aceitação orientados ao usuário em `tests/acceptance/*.feature`.

O cenário deve ter uma automação correspondente em `tests/e2e`.

Use locators orientados à acessibilidade, como `getByRole`, `getByLabel` e `getByText`, evitando seletores acoplados a classes CSS.

## CI

Toda alteração em `main` e todo pull request executam:

- Biome
- TypeScript
- testes unitários
- build de produção
- testes E2E em Chromium e mobile Chromium
