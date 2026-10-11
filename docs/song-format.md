# Formato de música

O modelo deve ser semântico e independente da apresentação.

```ts
type Song = {
  id: string;
  slug: string;
  title: string;
  artist?: string;
  category?: string;
  key?: string;
  bpm?: number;
  sections: SongSection[];
  media?: SongMedia;
  timeline?: SongTimeline;
};
```

Acordes são elementos estruturados. A timeline suporta tempo absoluto e tempo musical.

## Importação por texto de cifra

`parseChordSheet` (`src/domain/songs/chord-sheet.ts`) converte texto de cifra colado em um rascunho de `Song`:

- Linhas só com acordes (maiúsculas, ex.: `C`, `F#m7`, `G/B`) são associadas à linha de letra seguinte, preservando a posição do caractere. Posições além do fim da letra são limitadas ao último caractere.
- Linhas de acordes sem letra viram linhas com texto vazio.
- Marcadores como `[Refrão]`, `Ponte:` ou `Verso 2` criam seções. Sem marcador, tudo entra em uma seção "Verso".
- Campos `Título:`, `Artista:` e `Tom:` no topo, ou `Título - Artista` na primeira linha seguida de linha em branco, preenchem os metadados.
- O resultado é sempre um rascunho: precisa de revisão antes de ser salvo.

## Repertório a partir de lista

`parseSongList`, `buildPlan`, `planSongIds` e `resolveEntry` (`src/domain/songs/playlist-import.ts`) montam um repertório a partir de uma lista de nomes:

- Uma música por linha. Numeração e marcadores são removidos. `Título - Artista` separa o artista.
- O match com a biblioteca ignora maiúsculas e acentos e usa o artista para desempatar.
- Músicas ausentes ficam em uma fila de importação. Ao importar a cifra de uma delas, ela entra no repertório na posição original da lista.
- Uma música aparece uma única vez no repertório, mesmo repetida na lista.
