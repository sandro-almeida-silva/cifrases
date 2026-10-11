import type { Song } from "./types";

export type SongListItem = { title: string; artist?: string };
export type PlanEntry = SongListItem & { songId?: string };

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseSongList(text: string): SongListItem[] {
  const items: SongListItem[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw
      .trim()
      .replace(/^(?:\d+\s*[.)\-:]\s*|[-*•]\s+)/, "")
      .trim();
    if (!line) continue;
    const parts = /^(.+?)\s+[-–—]\s+(.+)$/.exec(line);
    const title = (parts?.[1] ?? line).trim();
    const artist = parts?.[2]?.trim();
    items.push(artist ? { title, artist } : { title });
  }
  return items;
}

export function buildPlan(items: SongListItem[], songs: Song[]): PlanEntry[] {
  return items.map((item) => {
    const title = normalize(item.title);
    const candidates = songs.filter((song) => normalize(song.title) === title);
    const artist = item.artist ? normalize(item.artist) : "";
    const byArtist = artist ? candidates.find((song) => normalize(song.artist ?? "") === artist) : undefined;
    const match = byArtist ?? candidates[0];
    return match ? { ...item, songId: match.id } : { ...item };
  });
}

export function planSongIds(plan: PlanEntry[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const entry of plan) {
    if (!entry.songId || seen.has(entry.songId)) continue;
    seen.add(entry.songId);
    ids.push(entry.songId);
  }
  return ids;
}

export function resolveEntry(plan: PlanEntry[], index: number, songId: string): PlanEntry[] {
  return plan.map((entry, position) => (position === index ? { ...entry, songId } : entry));
}
