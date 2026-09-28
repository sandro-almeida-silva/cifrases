export type SongSectionType =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "bridge"
  | "instrumental"
  | "outro";

export type ChordPlacement = {
  chord: string;
  position: number;
};

export type SongLine = {
  id: string;
  text: string;
  chords?: ChordPlacement[];
};

export type SongSection = {
  id: string;
  type: SongSectionType;
  label?: string;
  lines: SongLine[];
};

export type SongMediaKind = "audio" | "cover" | "original";

export type SongMediaRef = {
  id: string;
  kind: SongMediaKind;
  path: string;
  mimeType: string;
  size: number;
  name?: string;
};

export type SongMediaLegacy = {
  audioUrl?: string;
  coverUrl?: string;
  originalImageUrl?: string;
};

export type SongMedia = SongMediaLegacy & {
  audio?: SongMediaRef;
  cover?: SongMediaRef;
  original?: SongMediaRef;
};

export type SongTimelineEvent = {
  atMs: number;
  sectionId: string;
  lineId?: string;
  chord?: string;
  beat?: number;
  measure?: number;
};

export type SongTimeline = {
  bpm?: number;
  timeSignature?: [number, number];
  events: SongTimelineEvent[];
};

export type Song = {
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
