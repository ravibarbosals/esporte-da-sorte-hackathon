"use client";

import LoadingState from "@/components/assistant/LoadingState";
import EmptyState from "@/components/assistant/EmptyState";
import SectionHeader from "@/components/assistant/SectionHeader";
import { useModelExplanation } from "@/lib/hooks/use-model-explanation";

export default function ModeloPage() {
  const { sections, loading } = useModelExplanation();

  if (loading) {
    return <LoadingState label="Preparando explicacao do modelo..." />;
  }

  if (sections.length === 0) {
    return (
      <EmptyState
        title="Sem explicacao de modelo"
        description="Nao foi possivel carregar os blocos de transparencia agora."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-sky-300">
          Modelo
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Como analisamos cada partida
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
          Esta pagina documenta sinais, metodo de combinacao e limites da
          previsao. O sistema interpreta dados e probabilidades, nao garante
          resultados.
        </p>
      </header>

      {sections.map((section) => (
        <section
          key={section.id}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
        >
          <SectionHeader title={section.title} subtitle={section.content} />
          <ul className="grid gap-2 sm:grid-cols-2">
            {section.bullets.map((bullet) => (
              <li
                key={bullet}
                className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-300"
              >
                {bullet}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
