const NOTE_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  DB: 1,
  D: 2,
  "D#": 3,
  EB: 3,
  E: 4,
  F: 5,
  "F#": 6,
  GB: 6,
  G: 7,
  "G#": 8,
  AB: 8,
  A: 9,
  "A#": 10,
  BB: 10,
  B: 11,
};

const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function transposeNote(note: string, semitones: number): string | undefined {
  const normalizedNote = `${note[0]?.toUpperCase() ?? ""}${note.slice(1)}`;
  const index = NOTE_INDEX[normalizedNote] ?? NOTE_INDEX[normalizedNote.toUpperCase()];
  if (index === undefined) return undefined;

  const notes = note.includes("b") ? FLAT_NOTES : SHARP_NOTES;
  const nextIndex = ((index + semitones) % 12 + 12) % 12;
  return notes[nextIndex];
}

export function transposeChord(chord: string, semitones: number): string {
  const match = chord.trim().match(/^([A-Ga-g](?:#|b)?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2] ?? "";
  if (!root) return chord;

  const transposedRoot = transposeNote(root, semitones);
  if (!transposedRoot) return chord;

  const bassMatch = suffix.match(/^(.*\/)([A-Ga-g](?:#|b)?)$/);
  if (!bassMatch) return `${transposedRoot}${suffix}`;

  const bass = bassMatch[2];
  if (!bass) return `${transposedRoot}${suffix}`;
  const transposedBass = transposeNote(bass, semitones);
  if (!transposedBass) return `${transposedRoot}${suffix}`;

  return `${transposedRoot}${bassMatch[1]}${transposedBass}`;
}

export function transposeKey(key: string | undefined, semitones: number): string | undefined {
  return key ? transposeChord(key, semitones) : undefined;
}
