"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import MatchHero from "@/components/assistant/MatchHero";
import PredictionCard from "@/components/assistant/PredictionCard";
import ModelFactorsPanel from "@/components/assistant/ModelFactorsPanel";
import LiveTimeline from "@/components/assistant/LiveTimeline";
import ScenarioList from "@/components/assistant/ScenarioList";
import KeyPlayersPanel from "@/components/assistant/KeyPlayersPanel";
import InsightPanel from "@/components/assistant/InsightPanel";
import SectionHeader from "@/components/assistant/SectionHeader";
import LoadingState from "@/components/assistant/LoadingState";
import EmptyState from "@/components/assistant/EmptyState";
import ErrorState from "@/components/assistant/ErrorState";
import MomentumBar from "@/components/assistant/MomentumBar";
import { useMatchAnalysis } from "@/lib/hooks/use-match-analysis";

export default function MatchDetailPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params?.matchId ?? "";
  const {
    analysis,
    loading,
    isRefreshing,
    lastUpdated,
    sectionStatus,
    hasPartialFallback,
    experience,
  } = useMatchAnalysis(matchId);

  const modeBadgeClass =
    experience.mode === "live"
      ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
      : experience.mode === "replay"
        ? "border-sky-500/40 bg-sky-500/15 text-sky-100"
        : "border-amber-500/40 bg-amber-500/15 text-amber-100";

  const modePanelClass =
    experience.mode === "live"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : experience.mode === "replay"
        ? "border-sky-500/30 bg-sky-500/10 text-sky-100"
        : "border-amber-500/30 bg-amber-500/10 text-amber-100";

  if (loading) {
    return <LoadingState label="Gerando leitura completa da partida..." />;
  }

  if (!analysis) {
    return (
      <EmptyState
        title="Partida nao encontrada"
        description="Nao foi possivel montar a analise completa com os dados atuais."
      />
    );
  }

  return (
    <div className="space-y-7">
      <header className="space-y-3 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950 p-4 sm:p-5">
        <Link
          href="/matches"
          className="inline-flex items-center text-sm font-semibold text-emerald-300 hover:text-emerald-200"
        >
          ← Voltar para partidas
        </Link>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Central de leitura da partida
        </h1>
        <p className="text-sm text-slate-300 sm:text-base">
          Decisao orientada por contexto: probabilidades explicaveis, sinais de
          momentum e eventos que alteraram o jogo minuto a minuto.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span
            className={`inline-flex rounded-full border px-2 py-1 font-semibold uppercase tracking-wide ${modeBadgeClass}`}
          >
            {experience.label}
          </span>
          <span
            className={`inline-flex rounded-full border px-2 py-1 ${
              isRefreshing
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            {isRefreshing
              ? "Atualizando leitura da partida"
              : "Leitura estabilizada"}
          </span>
          <span className="inline-flex rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1">
            {lastUpdated
              ? `Ultima atualizacao ${new Date(lastUpdated).toLocaleTimeString("pt-BR")}`
              : "Sem atualizacao recente"}
          </span>
        </div>
      </header>

      <div className={`rounded-xl border px-4 py-3 text-sm ${modePanelClass}`}>
        {experience.hint}
      </div>

      {hasPartialFallback ? (
        <ErrorState description="Alguns blocos estao em modo resiliente. A leitura principal segue ativa com os sinais disponiveis." />
      ) : null}

      <MatchHero
        data={analysis}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        contextLabel={experience.label}
        contextMode={experience.mode}
      />

      <section>
        <SectionHeader
          title="Probabilidades principais"
          subtitle="Leitura de curto prazo com tendencia, confianca e justificativa"
        />
        {sectionStatus?.predictions === "mock" ? (
          <div className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Probabilidades exibidas em cobertura resiliente temporaria.
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {analysis.predictions.map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div>
          <SectionHeader
            title="Momentum"
            subtitle="Comparativo dinamico de controle e intensidade"
          />
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <MomentumBar
              homeLabel={analysis.match.homeTeam.name}
              awayLabel={analysis.match.awayTeam.name}
              homeValue={analysis.momentum.home}
              awayValue={analysis.momentum.away}
            />
            <p className="mt-3 text-sm text-slate-300">
              {analysis.momentum.summary}
            </p>
          </div>
        </div>
        <div>
          <SectionHeader
            title="Comparacao entre times"
            subtitle="Indicadores que sustentam a leitura atual"
          />
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            {analysis.teamComparisons.map((item) => (
              <article key={item.title}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{analysis.match.homeTeam.name}</span>
                  <span>{item.title}</span>
                  <span>{analysis.match.awayTeam.name}</span>
                </div>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
                  <span>
                    {item.homeValue}
                    {item.unit ?? ""}
                  </span>
                  <span>
                    {item.awayValue}
                    {item.unit ?? ""}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, (item.homeValue / (item.homeValue + item.awayValue || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Por que o modelo acha isso?"
          subtitle="Contribuicoes visuais dos sinais principais"
        />
        <ModelFactorsPanel factors={analysis.factors} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionHeader
            title="Timeline inteligente"
            subtitle="Mudancas recentes na partida"
          />
          {sectionStatus?.timeline === "mock" ? (
            <div className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Timeline em cobertura resiliente temporaria.
            </div>
          ) : null}
          <LiveTimeline events={analysis.timeline} />
        </div>
        <div>
          <SectionHeader
            title="Cenarios provaveis"
            subtitle="Projecoes de curto prazo"
          />
          <ScenarioList items={analysis.scenarios} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Jogadores mais influentes"
          subtitle="Destaques individuais da leitura atual"
        />
        <KeyPlayersPanel players={analysis.keyPlayers} />
      </section>

      <section>
        <SectionHeader
          title="Insights textuais automaticos"
          subtitle="Resumo editorial para decisao em segundos"
        />
        <InsightPanel
          insights={[analysis.headlineInsight, ...analysis.textualInsights]}
        />
      </section>
    </div>
  );
}
