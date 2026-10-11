import { transposeChord } from "@/domain/songs/transpose";
import type { SongSection, SongSectionType } from "@/domain/songs/types";

const sectionLabels: Record<SongSectionType, string> = {
  intro: "Introdução",
  verse: "Verso",
  "pre-chorus": "Pré-refrão",
  chorus: "Refrão",
  bridge: "Ponte",
  instrumental: "Instrumental",
  outro: "Final",
};

export function sectionName(section: SongSection): string {
  return section.label ?? sectionLabels[section.type] ?? "Seção";
}

export function SongSections({
  sections,
  transpose = 0,
  lineSpacing = 1.75,
  highContrast = false,
  activeLineId = null,
  idPrefix = "song-section-",
}: {
  sections: SongSection[];
  transpose?: number;
  lineSpacing?: number;
  highContrast?: boolean;
  activeLineId?: string | null;
  idPrefix?: string;
}) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} id={`${idPrefix}${section.id}`}>
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/8" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">{sectionName(section)}</span>
            <span className="h-px flex-1 bg-white/8" />
          </div>
          <div className="space-y-4">
            {section.lines.map((item) => (
              <div key={item.id} data-player-line-id={item.id} className={`rounded-2xl px-3 py-2 ${activeLineId === item.id ? "bg-brand/10 ring-1 ring-brand/20" : ""} ${highContrast ? "border border-white/20" : ""}`}>
                <div className="relative min-h-7 font-mono text-sm">
                  {(item.chords ?? []).map((chord) => (
                    <span key={`${item.id}-${chord.position}-${chord.chord}`} className={`absolute top-0 font-semibold text-chord ${highContrast ? "underline decoration-2 underline-offset-4" : ""}`} style={{ left: `${chord.position}ch` }}>{transposeChord(chord.chord, transpose)}</span>
                  ))}
                </div>
                <p className="whitespace-pre-wrap font-medium" style={{ lineHeight: lineSpacing }}>{item.text || " "}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
