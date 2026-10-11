import { sectionFromHeading } from "./section-heading";
import type { ChordPlacement, Song, SongLine, SongSection } from "./types";

export type ChordSheetDraft = {
  title?: string;
  artist?: string;
  key?: string;
  sections: SongSection[];
};

const STRICT_CHORD =
  /^[A-G][#b]?(?:maj|min|dim|aug|sus|add|m|M|º|°|\+|-)?\d{0,2}(?:(?:sus|add)\d{1,2})*(?:\([^)]*\))?(?:\/[A-G][#b]?)?$/;

const HEADER_FIELD = /^(t[ií]tulo|title|artista|artist|tom|key)\s*:\s*(.+)$/i;
const TITLE_ARTIST = /^(.+?)\s+[-–—]\s+(.+)$/;

function headingOf(line: string) {
  return sectionFromHeading(line.trim().replace(/:$/, ""));
}

function chordsOf(line: string): ChordPlacement[] | null {
  const tokens = [...line.matchAll(/\S+/g)];
  if (!tokens.length) return null;
  if (!tokens.every((token) => STRICT_CHORD.test(token[0] ?? ""))) return null;
  return tokens.map((token) => ({
    chord: token[0] ?? "",
    position: token.index ?? 0,
  }));
}

export function parseChordSheet(source: string): ChordSheetDraft {
  const rawLines = source.split(/\r?\n/).map((line) => line.trimEnd());
  const firstContent = rawLines.findIndex((line) => line.trim());
  const draft: ChordSheetDraft = { sections: [] };

  const sections: SongSection[] = [];
  let current: SongSection | null = null;
  let pending: ChordPlacement[] | null = null;

  const startSection = (type: SongSection["type"], label: string) => {
    current = { id: `section-${sections.length + 1}`, type, label, lines: [] };
    sections.push(current);
    return current;
  };

  const pushLine = (text: string, chords: ChordPlacement[]) => {
    const section = current ?? startSection("verse", "Verso");
    const line: SongLine = {
      id: `line-${sections.length}-${section.lines.length + 1}`,
      text,
      chords,
    };
    section.lines.push(line);
  };

  const flushPending = () => {
    if (!pending) return;
    pushLine("", pending);
    pending = null;
  };

  for (const [index, raw] of rawLines.entries()) {
    const line = raw.trim();

    if (!line) {
      flushPending();
      continue;
    }

    const emitted = sections.some((section) => section.lines.length > 0);

    const field = !emitted && !current ? HEADER_FIELD.exec(line) : null;
    if (field) {
      const name = (field[1] ?? "").toLowerCase();
      const value = (field[2] ?? "").trim();
      if (name === "título" || name === "titulo" || name === "title")
        draft.title = value;
      else if (name === "artista" || name === "artist") draft.artist = value;
      else draft.key = value;
      continue;
    }

    const heading = headingOf(line);
    if (heading) {
      flushPending();
      startSection(heading.type, heading.label);
      continue;
    }

    const chords = chordsOf(raw);
    if (chords) {
      flushPending();
      pending = chords;
      continue;
    }

    if (index === firstContent && !emitted && !current && !draft.title) {
      const next = rawLines[index + 1];
      const match = TITLE_ARTIST.exec(line);
      if (match && next !== undefined && !next.trim()) {
        draft.title = (match[1] ?? "").trim();
        draft.artist = (match[2] ?? "").trim();
        continue;
      }
    }

    const offset = raw.length - raw.trimStart().length;
    const max = Math.max(line.length - 1, 0);
    const placed = (pending ?? []).map((chord) => ({
      chord: chord.chord,
      position: Math.min(Math.max(chord.position - offset, 0), max),
    }));
    pending = null;
    pushLine(line, placed);
  }

  flushPending();

  draft.sections = sections.filter((section) => section.lines.length > 0);
  return draft;
}

export function songFromChordSheet(
  draft: ChordSheetDraft,
  fields: { id: string; slug: string; title: string; artist?: string; key?: string },
): Song {
  const artist = (fields.artist ?? draft.artist ?? "").trim();
  const key = (fields.key ?? draft.key ?? "").trim();
  return {
    id: fields.id,
    slug: fields.slug,
    title: fields.title.trim(),
    ...(artist ? { artist } : {}),
    ...(key ? { key } : {}),
    sections: draft.sections,
  };
}
