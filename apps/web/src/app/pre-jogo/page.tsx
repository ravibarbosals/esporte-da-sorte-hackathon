"use client";

import LoadingState from "@/components/assistant/LoadingState";
import EmptyState from "@/components/assistant/EmptyState";
import MomentumBar from "@/components/assistant/MomentumBar";
import SectionHeader from "@/components/assistant/SectionHeader";
import { usePreMatch } from "@/lib/hooks/use-pre-match";

export default function PreJogoPage() {
  const { items, loading } = usePreMatch();

  if (loading) {
    return <LoadingState label="Carregando leitura pre-jogo..." />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Sem analises de pre-jogo"
        description="Quando os confrontos forem preparados, os cenarios iniciais serao exibidos aqui."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-sky-300">
          Pre-jogo
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Leitura antes do apito inicial
        </h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          Forma recente, confronto direto, tendencia tatico-ofensiva e
          probabilidade inicial interpretada.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => {
          const homeProb = item.initialProbabilities[0]?.probability ?? 0;
          const awayProb =
            item.initialProbabilities[item.initialProbabilities.length - 1]
              ?.probability ?? 0;

          return (
            <article
              key={item.matchId}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <SectionHeader
                title={`Partida ${item.matchId}`}
                subtitle={item.h2hSummary}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                  <p className="text-xs text-slate-400">
                    Forma recente mandante
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {item.homeForm}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                  <p className="text-xs text-slate-400">
                    Forma recente visitante
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {item.awayForm}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>{item.offensiveTrend}</p>
                <p>{item.defensiveTrend}</p>
              </div>

              <div className="mt-4">
                <MomentumBar
                  homeLabel={item.initialProbabilities[0]?.label ?? "Casa"}
                  awayLabel={
                    item.initialProbabilities[
                      item.initialProbabilities.length - 1
                    ]?.label ?? "Visitante"
                  }
                  homeValue={homeProb}
                  awayValue={awayProb}
                />
              </div>

              <p className="mt-4 text-sm text-emerald-100">
                {item.interpretation}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Jogadores-chave: {item.keyPlayers.join(", ")}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
