import {
  ArrowRight,
  AudioLines,
  LibraryBig,
  Play,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function HomePage() {
  const features: Array<[string, LucideIcon]> = [
    ["Biblioteca", LibraryBig],
    ["Player", Play],
    ["Sincronização", AudioLines],
    ["Experiência", Sparkles],
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Logo />
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted sm:flex">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Primeira experiência em construção
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-soft">
              <Sparkles size={14} />
              Uma nova experiência para músicos
            </div>
            <h1 className="max-w-3xl text-5xl font-black tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl">
              Sua música,{" "}
              <span className="text-brand-soft">no tempo certo.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Cifras, letras, áudio e sincronização em uma experiência pensada
              para tocar música de verdade.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <Play size={17} fill="currentColor" /> Abrir player
              </button>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-6 text-sm font-semibold text-foreground transition hover:bg-white/[0.06]"
              >
                Explorar biblioteca <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-12 rounded-full bg-brand/15 blur-3xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-surface p-4 shadow-2xl shadow-black/30">
              <div className="rounded-[24px] border border-white/7 bg-panel p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted">AGORA TOCANDO</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">
                      Primeira Canção
                    </h2>
                  </div>
                  <AudioLines className="text-brand-soft" size={20} />
                </div>
                <div className="mt-8 space-y-5">
                  <p className="font-mono text-sm text-chord">G</p>
                  <p className="text-xl font-semibold tracking-tight text-foreground">
                    Uma canção começa quando o tempo encontra a letra.
                  </p>
                  <p className="font-mono text-sm text-chord">
                    Em&nbsp;&nbsp;&nbsp;C&nbsp;&nbsp;&nbsp;D
                  </p>
                </div>
                <div className="mt-10 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[42%] rounded-full bg-brand" />
                </div>
                <div className="mt-5 flex items-center justify-between text-xs text-muted">
                  <span>01:42</span>
                  <span>04:06</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 border-t border-white/10 py-7 sm:grid-cols-4">
          {features.map(([label, Icon]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
            >
              <Icon size={18} className="text-brand-soft" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                {String(label)}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Base preparada para a próxima etapa.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
