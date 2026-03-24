"use client";

import Link from "next/link";
import MatchHero from "@/components/assistant/MatchHero";
import MatchCard from "@/components/assistant/MatchCard";
import ModelFactorsPanel from "@/components/assistant/ModelFactorsPanel";
import LiveTimeline from "@/components/assistant/LiveTimeline";
import PredictionCard from "@/components/assistant/PredictionCard";
import ScenarioList from "@/components/assistant/ScenarioList";
import InsightPanel from "@/components/assistant/InsightPanel";
import SectionHeader from "@/components/assistant/SectionHeader";
import LoadingState from "@/components/assistant/LoadingState";
import EmptyState from "@/components/assistant/EmptyState";
import { useAssistantHomeData } from "@/lib/hooks/use-assistant-home-data";

export default function AssistantPage() {
  const {
    featured,
    liveMatches,
    loading,
    isRefreshing,
    lastUpdated,
    experience,
    hasPartialFallback,
  } = useAssistantHomeData();

  const modePanelClass =
    experience.mode === "live"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : experience.mode === "replay"
        ? "border-sky-500/30 bg-sky-500/10 text-sky-100"
        : "border-amber-500/30 bg-amber-500/10 text-amber-100";

  if (loading) {
    return <LoadingState label="Montando central de decisao esportiva..." />;
  }

  if (!featured) {
    return (
      <EmptyState
        title="Sem leitura principal no momento"
        description="Nao encontramos dados suficientes para montar o jogo em destaque agora."
      />
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
            Assistente de partida
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Central de decisao esportiva
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
            Leitura editorial para decisao rapida: quem esta mais perto de
            vencer, por que o sinal mudou e qual cenario lidera neste momento.
          </p>
        </div>
        <div className="text-right">
          <Link
            href="/modelo"
            className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/20"
          >
            Como analisamos
          </Link>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isRefreshing ? "animate-pulse bg-emerald-300" : "bg-slate-500"
              }`}
            />
            {isRefreshing
              ? "Atualizando sinais da partida"
              : lastUpdated
                ? `Ultima atualizacao: ${new Date(lastUpdated).toLocaleTimeString("pt-BR")}`
                : "Sem atualizacao recente"}
          </div>
        </div>
      </header>

      <div className={`rounded-xl border px-4 py-3 text-sm ${modePanelClass}`}>
        <p className="inline-flex items-center rounded-full border border-current/40 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
          {experience.label}
        </p>
        <p className="mt-2">{experience.hint}</p>
      </div>

      {hasPartialFallback ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Atualizacao parcial: alguns blocos estao em modo resiliente enquanto a
          API normaliza o fluxo.
        </div>
      ) : null}

      <MatchHero
        data={featured}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        contextLabel={experience.label}
        contextMode={experience.mode}
      />

      <section>
        <SectionHeader
          title="Previsoes principais"
          subtitle="Probabilidades explicaveis com tendencia e confianca operacional"
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {featured.predictions.map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Por que o modelo acha isso?"
          subtitle="Fatores que mais pesam na leitura atual da partida"
        />
        <ModelFactorsPanel factors={featured.factors} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <SectionHeader
            title="Timeline inteligente"
            subtitle="Eventos e interpretacoes automaticas"
          />
          <LiveTimeline events={featured.timeline} />
        </div>
        <div>
          <SectionHeader
            title="Cenarios provaveis"
            subtitle="Leitura de curto prazo da partida"
          />
          <ScenarioList items={featured.scenarios} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="O que mudou recentemente"
          subtitle="Sintese automatica para apoiar a decisao no curto prazo"
        />
        <InsightPanel
          insights={[featured.headlineInsight, ...featured.textualInsights]}
        />
      </section>

      <section>
        <SectionHeader
          title={
            experience.mode === "replay"
              ? "Partidas em replay analitico"
              : "Partidas ao vivo"
          }
          subtitle="Cada jogo com mini insight contextual"
          rightSlot={
            <Link
              href="/live"
              className={`text-sm font-semibold ${
                experience.mode === "live"
                  ? "text-emerald-300 hover:text-emerald-200"
                  : "text-sky-300 hover:text-sky-200"
              }`}
            >
              {experience.mode === "replay"
                ? "Ver central de replay"
                : "Ver central ao vivo"}
            </Link>
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          {liveMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>
    </div>
  );
}
