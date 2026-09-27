import { describe, expect, it } from "vitest";
import { resolveTimelineEvent } from "@/domain/songs/timeline";

const events = [
  { atMs: 1000, sectionId: "intro", lineId: "line-1" },
  { atMs: 3000, sectionId: "verse", lineId: "line-2", beat: 1, measure: 2 },
  { atMs: 5000, sectionId: "chorus", lineId: "line-3" },
];

describe("resolveTimelineEvent", () => {
  it("resolves the latest event at the current time", () => {
    expect(resolveTimelineEvent(events, 3.2)).toEqual({
      event: events[1],
      synced: true,
    });
  });

  it("uses a small clock tolerance around event boundaries", () => {
    expect(resolveTimelineEvent(events, 2.76)).toEqual({
      event: events[1],
      synced: true,
    });
  });

  it("keeps the timeline unsynchronized before its first event", () => {
    expect(resolveTimelineEvent(events, 0.5)).toEqual({
      event: null,
      synced: false,
    });
  });

  it("supports beat and measure metadata without changing synchronization", () => {
    const result = resolveTimelineEvent(events, 3);
    expect(result.event?.beat).toBe(1);
    expect(result.event?.measure).toBe(2);
  });

  it("handles songs without timeline events", () => {
    expect(resolveTimelineEvent([], 10)).toEqual({
      event: null,
      synced: false,
    });
  });
});
