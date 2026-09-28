# Arquitetura

## Princípio central

`Song` é a fonte de verdade do produto.

Catálogo, editor, player, sincronização, modo palco e apresentação devem consumir o mesmo contrato de música em vez de manter cópias paralelas.

```text
Song
├── metadata
├── sections
│   └── lines
│       └── chords
├── media
└── timeline
```

## Fronteiras

### Domínio

Tipos e regras independentes de navegador, React e persistência.

### Aplicação

Orquestra leitura e escrita de músicas, validações, importação e timeline.

### Persistência e mídia

A persistência deve ser acessada por repository/service. A UI não conhece detalhes do armazenamento. Binários de mídia são referências externas ao registro principal.

### UI

Os modos de uso são projeções do mesmo domínio:

- Biblioteca
- Detalhes/preparação
- Editor
- Player
- Apresentação 16:9
- Modo palco

## Fluxo

```text
Biblioteca
   ↓
Música
   ├── Editar → Editor → Persistência
   ├── Tocar → Player → Áudio + Timeline + Auto-scroll
   ├── Apresentar → Modo 16:9
   └── Modo palco → Teleprompter musical
```

## Contextos

Paróquia, banda, comunidade, evento ou outro contexto entram por tema e configuração, sem acoplamento ao domínio musical.

## Regras de engenharia

- Server Components por padrão.
- Client Components apenas quando estado, eventos ou APIs do navegador forem necessários.
- Usar `next/link` e `next/image`.
- Preservar `typedRoutes`.
- Evitar configuração customizada sem necessidade comprovada.
- Testar regras de domínio sem navegador.

Consulte [Domínio](domain.md) e [Formato de música](song-format.md).
