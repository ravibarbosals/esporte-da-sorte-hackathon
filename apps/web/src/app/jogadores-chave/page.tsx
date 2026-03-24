"use client";

import KeyPlayersPanel from "@/components/assistant/KeyPlayersPanel";
import SectionHeader from "@/components/assistant/SectionHeader";
import LoadingState from "@/components/assistant/LoadingState";
import EmptyState from "@/components/assistant/EmptyState";
import { useAssistantHomeData } from "@/lib/hooks/use-assistant-home-data";

export default function JogadoresChavePage() {
  const { featured, loading } = useAssistantHomeData();

  if (loading) {
    return <LoadingState label="Calculando impacto dos jogadores..." />;
  }

  if (!featured) {
    return (
      <EmptyState
        title="Sem dados de jogadores-chave"
        description="Nao foi possivel montar os destaques individuais neste momento."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">
          Jogadores-chave
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Quem mais muda o jogo agora
        </h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          Destaques individuais com chance de participacao em gol, risco
          disciplinar e impacto tatico.
        </p>
      </header>

      <section>
        <SectionHeader
          title="Leitura individual"
          subtitle="Base conceitual pronta para dados enriquecidos do Postgres"
        />
        <KeyPlayersPanel players={featured.keyPlayers} />
      </section>
    </div>
  );
}
