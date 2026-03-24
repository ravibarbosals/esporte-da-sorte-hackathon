"use client";

import { useMemo, useState } from "react";
import MatchCard from "@/components/assistant/MatchCard";
import SectionHeader from "@/components/assistant/SectionHeader";
import LoadingState from "@/components/assistant/LoadingState";
import EmptyState from "@/components/assistant/EmptyState";
import { useLiveAndUpcoming } from "@/lib/hooks/use-live-and-upcoming";

type MatchTab = "live" | "upcoming";

export default function MatchesPage() {
  const { liveMatches, upcomingMatches, loading } = useLiveAndUpcoming();
  const [activeTab, setActiveTab] = useState<MatchTab>("live");

  const currentList = useMemo(
    () => (activeTab === "live" ? liveMatches : upcomingMatches),
    [activeTab, liveMatches, upcomingMatches],
  );

  if (loading) {
    return (
      <LoadingState label="Atualizando partidas e sinais contextuais..." />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
          Partidas
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Radar de confrontos
        </h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          Lista de partidas com leitura interpretativa para acelerar decisao.
        </p>
      </header>

      <div className="grid w-full grid-cols-2 rounded-xl border border-slate-800 bg-slate-900 p-1">
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
          Agenda ({upcomingMatches.length})
        </button>
      </div>

      <section>
        <SectionHeader
          title={activeTab === "live" ? "Jogos ao vivo" : "Proximos jogos"}
          subtitle={
            activeTab === "live"
              ? "Com mini insights de contexto e ritmo da partida"
              : "Com leitura pre-jogo para antecipar cenarios"
          }
        />

        {currentList.length === 0 ? (
          <EmptyState
            title={
              activeTab === "live" ? "Sem jogos ao vivo" : "Sem jogos agendados"
            }
            description={
              activeTab === "live"
                ? "Assim que partidas entrarem em andamento, os insights aparecem aqui."
                : "A agenda sera preenchida quando novos confrontos forem disponibilizados."
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {currentList.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
