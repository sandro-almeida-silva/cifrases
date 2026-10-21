import type { Song, SongLine, SongSection } from "./types";

export type Slide = {
  id: string;
  section: SongSection;
  lines: SongLine[];
  part: number;
  parts: number;
};

export const DEFAULT_LINES_PER_SLIDE = 4;

/** Uma seção vira um ou mais slides; seções longas são divididas em partes equilibradas. */
export function buildSlides(
  song: Song | null,
  maxLines = DEFAULT_LINES_PER_SLIDE,
): Slide[] {
  if (!song) return [];
  return song.sections.flatMap((section) => {
    const parts = Math.max(1, Math.ceil(section.lines.length / maxLines));
    const size = Math.ceil(section.lines.length / parts);
    return Array.from({ length: parts }, (_, index) => ({
      id: `${section.id}:${index + 1}`,
      section,
      lines: section.lines.slice(index * size, (index + 1) * size),
      part: index + 1,
      parts,
    }));
  });
}

export function clampSlideIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(index, 0), total - 1);
}

/** Índice do slide para uma tecla de navegação, ou `null` quando a tecla não navega. */
export function slideIndexForKey(
  key: string,
  index: number,
  total: number,
): number | null {
  if (total <= 0) return null;
  switch (key) {
    case "ArrowRight":
    case "PageDown":
      return clampSlideIndex(index + 1, total);
    case "ArrowLeft":
    case "PageUp":
      return clampSlideIndex(index - 1, total);
    case "Home":
      return 0;
    case "End":
      return total - 1;
    default:
      return null;
  }
}
