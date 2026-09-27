import type { SongTimelineEvent } from "./types";

export const TIMELINE_TOLERANCE_MS = 250;

export type TimelineSyncState = {
  event: SongTimelineEvent | null;
  synced: boolean;
};

export function resolveTimelineEvent(events: SongTimelineEvent[], currentSecond: number): TimelineSyncState {
  if (events.length === 0) return { event: null, synced: false };

  const currentMs = Math.max(0, currentSecond * 1000);
  const event = [...events]
    .sort((a, b) => a.atMs - b.atMs)
    .filter((item) => item.atMs <= currentMs + TIMELINE_TOLERANCE_MS)
    .at(-1) ?? null;

  return { event, synced: Boolean(event) };
}
