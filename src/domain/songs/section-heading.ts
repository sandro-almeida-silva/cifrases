import type { SongSectionType } from "./types";

const SECTION_PATTERNS: Array<{
  type: SongSectionType;
  pattern: RegExp;
  label: string;
}> = [
  {
    type: "intro",
    pattern: /^(intro|introdu[cç][aã]o)$/i,
    label: "Introdução",
  },
  { type: "verse", pattern: /^(verso|verse)(\s+\d+)?$/i, label: "Verso" },
  {
    type: "pre-chorus",
    pattern: /^(pr[eé]-?refr[aã]o|pre-?chorus)(\s+\d+)?$/i,
    label: "Pré-refrão",
  },
  {
    type: "chorus",
    pattern: /^(refr[aã]o|chorus)(\s+\d+)?$/i,
    label: "Refrão",
  },
  { type: "bridge", pattern: /^(ponte|bridge)$/i, label: "Ponte" },
  {
    type: "instrumental",
    pattern: /^(instrumental|solo)$/i,
    label: "Instrumental",
  },
  { type: "outro", pattern: /^(final|outro)$/i, label: "Final" },
];

export function sectionFromHeading(
  text: string,
): { type: SongSectionType; label: string } | null {
  const normalized = text
    .trim()
    .replace(/^[[({]|[\])}]$/g, "")
    .replace(/\s+/g, " ");
  const match = SECTION_PATTERNS.find((item) => item.pattern.test(normalized));
  return match ? { type: match.type, label: match.label } : null;
}
