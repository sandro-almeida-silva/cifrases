import type { Song } from "./types";

export const sampleSong: Song = {
  id: "sample-primeira-cancao",
  slug: "primeira-cancao",
  title: "Primeira Canção",
  artist: "Cifrases",
  category: "Demonstração",
  key: "G",
  bpm: 96,
  sections: [
    {
      id: "sample-intro",
      type: "intro",
      label: "Introdução",
      lines: [
        {
          id: "sample-intro-1",
          text: "A música começa quando o tempo encontra a letra.",
          chords: [
            { chord: "G", position: 0 },
            { chord: "C", position: 24 },
          ],
        },
      ],
    },
    {
      id: "sample-verse",
      type: "verse",
      label: "Verso",
      lines: [
        {
          id: "sample-verse-1",
          text: "Cada acorde abre espaço para a próxima frase.",
          chords: [
            { chord: "G", position: 0 },
            { chord: "D", position: 22 },
          ],
        },
        {
          id: "sample-verse-2",
          text: "Cada palavra encontra o seu lugar.",
          chords: [
            { chord: "Em", position: 0 },
            { chord: "C", position: 19 },
          ],
        },
      ],
    },
    {
      id: "sample-chorus",
      type: "chorus",
      label: "Refrão",
      lines: [
        {
          id: "sample-chorus-1",
          text: "E quando tudo se alinha, a música acontece.",
          chords: [
            { chord: "C", position: 0 },
            { chord: "G", position: 26 },
            { chord: "D", position: 39 },
          ],
        },
      ],
    },
  ],
};
