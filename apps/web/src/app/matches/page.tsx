"use client";

import { useMemo, useState } from "react";
import MatchCard from "@/components/assistant/MatchCard";
import SectionHeader from "@/components/assistant/SectionHeader";
import LoadingState from "@/components/assistant/LoadingState";
import EmptyState from "@/components/assistant/EmptyState";
import { useLiveAndUpcoming } from "@/lib/hooks/use-live-and-upcoming";

type MatchTab = "live" | "upcoming" | "replay";

export default function MatchesPage() {
  const { liveMatches, replayMatches, upcomingMatches, loading } =
    useLiveAndUpcoming();
  const [activeTab, setActiveTab] = useState<MatchTab>("live");

  const currentList = useMemo(() => {
    if (activeTab === "live") {
      return liveMatches;
    }
    if (activeTab === "upcoming") {
      return upcomingMatches;
    }
    return replayMatches;
  }, [activeTab, liveMatches, upcomingMatches, replayMatches]);

  if (loading) {
    return <LoadingState label="Atualizando grade de partidas..." />;
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
          Partidas
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
          Escolha o jogo para analisar
        </h1>
        <div className="mt-3 inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
          {liveMatches.length} jogo(s) ao vivo agora
        </div>
      </header>

      <div className="grid w-full grid-cols-3 rounded-xl border border-slate-800 bg-slate-900 p-1">
        <button
          onClick={() => setActiveTab("live")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
            activeTab === "live"
              ? "bg-rose-500 text-white shadow-sm shadow-rose-500/30"
              : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Ao vivo ({liveMatches.length})
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
            activeTab === "upcoming"
              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
              : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Proximas ({upcomingMatches.length})
        </button>
        <button
          onClick={() => setActiveTab("replay")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
            activeTab === "replay"
              ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30"
              : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Finalizados/Replay ({replayMatches.length})
        </button>
      </div>

      <section>
        <SectionHeader
          title={
            activeTab === "live"
              ? "Jogos ao vivo"
              : activeTab === "upcoming"
                ? "Proximos jogos"
                : "Jogos finalizados em replay"
          }
          subtitle={undefined}
        />

        {currentList.length === 0 ? (
          <EmptyState
            title={
              activeTab === "live"
                ? "Sem jogos ao vivo"
                : activeTab === "upcoming"
                  ? "Sem jogos futuros"
                  : "Sem jogos finalizados em replay"
            }
            description={
              activeTab === "live"
                ? "Nenhum jogo ao vivo neste momento."
                : activeTab === "upcoming"
                  ? "Nenhuma partida futura disponivel agora."
                  : "Nenhum replay disponivel no momento."
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {currentList.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                highlightLive={activeTab === "live"}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
