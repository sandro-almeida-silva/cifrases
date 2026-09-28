# Domínio musical

## Conceito central

A unidade principal do Cifrases é `Song`. O domínio representa música e execução de forma semântica e independente da interface.

## Estrutura

```text
Song
├── metadata
├── sections
│   └── lines
│       └── chords
├── media
└── timeline
```

## Regras

- `id` e `slug` são estáveis.
- Seções e linhas possuem ordem explícita.
- Acordes pertencem às linhas e possuem posição semântica.
- Transposição é uma transformação de apresentação e não altera a música persistida.
- Timeline é opcional.
- Uma música sem timeline continua utilizável no player.
- Mídia é referenciada por identificador/URL; o binário não faz parte do contrato de `Song`.
- Cadastro manual e OCR devem convergir para o mesmo contrato.

## Timeline

A primeira versão usa `atMs` como tempo absoluto em milissegundos. A estrutura deve permitir evolução para beat/measure sem quebrar o contrato atual.

## Compatibilidade

Alterações do contrato devem preservar dados existentes quando possível. Mudanças incompatíveis devem ser tratadas como evolução explícita do formato, com testes de compatibilidade ou migração.

Consulte [Formato de música](song-format.md).