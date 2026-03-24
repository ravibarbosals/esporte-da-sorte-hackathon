"use client";

import MatchCard from "@/components/assistant/MatchCard";
import SectionHeader from "@/components/assistant/SectionHeader";
import LoadingState from "@/components/assistant/LoadingState";
import EmptyState from "@/components/assistant/EmptyState";
import { useLiveAndUpcoming } from "@/lib/hooks/use-live-and-upcoming";

export default function LivePage() {
  const { liveMatches, loading } = useLiveAndUpcoming();

  if (loading) {
    return <LoadingState label="Monitorando partidas ao vivo..." />;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
          Ao vivo
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Central de leitura em tempo real
        </h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          Cada partida com contexto atualizado, momentum e mini insight pronto
          para decisao.
        </p>
      </header>

      <SectionHeader
        title="Partidas em andamento"
        subtitle="Foco em interpretacao, nao em tabela estatica"
      />

      {liveMatches.length === 0 ? (
        <EmptyState
          title="Nenhuma partida ao vivo agora"
          description="Assim que jogos iniciarem, o assistente mostrara mudancas de contexto aqui."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {liveMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
