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
