"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import PredictionCard from "@/components/assistant/PredictionCard";
import SectionHeader from "@/components/assistant/SectionHeader";
import LoadingState from "@/components/assistant/LoadingState";
import EmptyState from "@/components/assistant/EmptyState";
import ErrorState from "@/components/assistant/ErrorState";
import OddButton from "../../../components/match/OddButton";
import { useMatchAnalysis } from "@/lib/hooks/use-match-analysis";
import {
  formatDecimalOdd,
  formatMinuteLabel,
  formatScorePair,
  safeText,
} from "@/components/assistant/presentation-formatters";

function SectionUnavailable({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
      {message}
    </div>
  );
}

function TeamCrest({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="h-12 w-12 rounded-full border border-slate-700 object-cover"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-bold text-slate-200">
      {initials || "--"}
    </div>
  );
}

function FormStrip({ label, value }: { label: string; value: string }) {
  const chars = value
    .toUpperCase()
    .replace(/[^VED]/g, "")
    .split("")
    .slice(0, 5);

  if (chars.length === 0) return null;

  return (
    <div>
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <div className="flex gap-1.5">
        {chars.map((char, idx) => (
          <span
            key={`${label}-${idx}-${char}`}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
              char === "V"
                ? "bg-emerald-500/20 text-emerald-200"
                : char === "E"
                  ? "bg-slate-700 text-slate-200"
                  : "bg-rose-500/20 text-rose-200"
            }`}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatBar({
  title,
  homeValue,
  awayValue,
  homeName,
  awayName,
  unit,
}: {
  title: string;
  homeValue: number;
  awayValue: number;
  homeName: string;
  awayName: string;
  unit?: string;
}) {
  const total = Math.max(1, homeValue + awayValue);
  const homePct = Math.max(0, Math.min(100, (homeValue / total) * 100));

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>{homeName}</span>
        <span>{title}</span>
        <span>{awayName}</span>
      </div>
      <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-200">
        <span>
          {homeValue}
          {unit ?? ""}
        </span>
        <span>
          {awayValue}
          {unit ?? ""}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${homePct}%` }}
        />
      </div>
    </article>
  );
}

export default function MatchDetailPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params?.matchId ?? "";
  const {
    analysis,
    loading,
    isRefreshing,
    lastUpdated,
    availability,
    hasPartialFallback,
    experience,
  } = useMatchAnalysis(matchId);

  const isAnalysisFromAnotherMatch =
    Boolean(analysis) && analysis?.match?.id !== matchId;

  const modeBadgeClass =
    experience.mode === "live"
      ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
      : experience.mode === "replay"
        ? "border-sky-500/40 bg-sky-500/15 text-sky-100"
        : "border-amber-500/40 bg-amber-500/15 text-amber-100";

  if (loading || isAnalysisFromAnotherMatch) {
    return <LoadingState label="Carregando detalhe da partida..." />;
  }

  if (!analysis) {
    return (
      <EmptyState
        title="Partida nao encontrada"
        description="Nao foi possivel montar a analise completa com os dados atuais."
      />
    );
  }

  const homeName = safeText(analysis.match.homeTeam.name, "Time da casa");
  const awayName = safeText(analysis.match.awayTeam.name, "Time visitante");
  const score = formatScorePair(
    analysis.match.score.home,
    analysis.match.score.away,
  );
  const timeLabel = formatMinuteLabel(
    analysis.match.minute,
    safeText(analysis.match.kickoffLabel, "Horario indisponivel"),
  );

  const hasOdds =
    Number(analysis.odds?.homeOdds) > 1 &&
    Number(analysis.odds?.drawOdds) > 1 &&
    Number(analysis.odds?.awayOdds) > 1;

  const matchupSummary = safeText(
    analysis.headToHead?.summary,
    "Historico de confrontos diretos indisponivel com os dados atuais.",
  );

  // ── Monta objetos Team para o OddButton ─────────────────────────────
  const homeTeam = {
    name: homeName,
    shortName: homeName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase(),
    logoUrl: analysis.match.homeTeam.logoUrl,
    color: "#00c853",
  };

  const awayTeam = {
    name: awayName,
    shortName: awayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase(),
    logoUrl: analysis.match.awayTeam.logoUrl,
    color: "#0055A4",
  };

  // competitionId vindo do próprio match (ajuste o campo conforme seu tipo)
  const competitionId = String(
    (analysis.match as unknown as Record<string, unknown>).competitionId ??
      (analysis.match as unknown as Record<string, unknown>).competition_id ??
      "1",
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/matches"
          className="inline-flex items-center text-sm font-semibold text-emerald-300 hover:text-emerald-200"
        >
          ← Voltar para partidas
        </Link>
      </header>

      {hasPartialFallback ? (
        <ErrorState description="Cobertura parcial ativa: exibindo apenas blocos com base suficiente." />
      ) : null}

      {/* ── Hero do jogo ──────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/95 to-slate-950 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${modeBadgeClass}`}
          >
            {experience.label}
          </span>
          <div className="text-right text-xs text-slate-400">
            <p>{analysis.match.leagueName}</p>
            <p>
              {isRefreshing
                ? "Atualizando"
                : lastUpdated
                  ? `Atualizado ${new Date(lastUpdated).toLocaleTimeString("pt-BR")}`
                  : "Sem atualizacao recente"}
            </p>
          </div>
        </div>

        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-3 sm:justify-end">
            <TeamCrest
              name={homeName}
              logoUrl={analysis.match.homeTeam.logoUrl}
            />
            <div className="sm:text-right">
              <p className="text-base font-semibold text-white">{homeName}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-center">
            <p className="text-3xl font-bold text-white">
              {score.home} x {score.away}
            </p>
            <p className="text-xs text-slate-300">{timeLabel}</p>
          </div>

          <div className="flex items-center gap-3 sm:justify-start">
            <TeamCrest
              name={awayName}
              logoUrl={analysis.match.awayTeam.logoUrl}
            />
            <div>
              <p className="text-base font-semibold text-white">{awayName}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Odds principais ───────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Odds principais" subtitle={undefined} />
        {hasOdds ? (
          <>
            {/* OddButtons com análise integrada */}
            <div className="grid gap-3 md:grid-cols-3">
              <OddButton
                label={homeName}
                value={formatDecimalOdd(analysis.odds?.homeOdds, "-")}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                oddType={`Vitória ${homeName}`}
                competitionId={competitionId}
              />
              <OddButton
                label="Empate"
                value={formatDecimalOdd(analysis.odds?.drawOdds, "-")}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                oddType="Empate"
                competitionId={competitionId}
              />
              <OddButton
                label={awayName}
                value={formatDecimalOdd(analysis.odds?.awayOdds, "-")}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                oddType={`Vitória ${awayName}`}
                competitionId={competitionId}
              />
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Mercado: {safeText(analysis.odds?.market, "1x2")} · Origem:{" "}
              {safeText(analysis.odds?.source, "betsapi")} · Atualizacao:{" "}
              {safeText(analysis.odds?.updatedAt, "nao informada")}
            </p>
          </>
        ) : (
          <SectionUnavailable message="Odds reais indisponiveis no momento." />
        )}
      </section>

      {/* ── Previsões ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Previsoes do jogo" subtitle={undefined} />
        {availability?.probabilities.available ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {analysis.predictions.slice(0, 3).map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        ) : (
          <SectionUnavailable
            message={
              availability?.probabilities.reasonUnavailable ??
              "Ainda nao ha dados suficientes para estimar este indicador com confianca."
            }
          />
        )}
      </section>

      {/* ── Confrontos diretos ────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Confrontos diretos" subtitle={undefined} />
        {availability?.headToHead.available ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <FormStrip
                label={homeName}
                value={analysis.headToHead?.homeForm ?? ""}
              />
              <FormStrip
                label={awayName}
                value={analysis.headToHead?.awayForm ?? ""}
              />
            </div>
            <p className="text-sm text-slate-200">{matchupSummary}</p>
          </div>
        ) : (
          <SectionUnavailable
            message={
              availability?.headToHead.reasonUnavailable ??
              "Historico de confrontos diretos indisponivel com os dados atuais."
            }
          />
        )}
      </section>

      {/* ── Estatísticas ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Estatisticas do jogo" subtitle={undefined} />
        {availability?.teamComparisons.available ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {analysis.teamComparisons.slice(0, 6).map((item) => (
              <StatBar
                key={item.title}
                title={item.title}
                homeValue={item.homeValue}
                awayValue={item.awayValue}
                homeName={homeName}
                awayName={awayName}
                unit={item.unit}
              />
            ))}
          </div>
        ) : (
          <SectionUnavailable
            message={
              availability?.teamComparisons.reasonUnavailable ??
              "Estatisticas principais indisponiveis para esta partida."
            }
          />
        )}
      </section>
    </div>
  );
}
