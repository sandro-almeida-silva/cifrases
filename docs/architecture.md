# Arquitetura

A entidade `Song` é a fonte de verdade.

```text
Song
├── metadata
├── arrangement
├── content
├── media
├── timeline
└── presentations
```

O player do músico e o modo celebração são projeções diferentes da mesma música.

## Domínios

- songs
- player
- timeline
- presentation
- library

Contextos como paróquia, banda, comunidade ou evento entram por tema, categorias e configuração.
