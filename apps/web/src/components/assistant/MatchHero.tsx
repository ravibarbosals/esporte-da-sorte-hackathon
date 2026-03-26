import { MatchAnalysisBundle } from "@/types";
import { Activity, Radio } from "lucide-react";
import MomentumBar from "@/components/assistant/MomentumBar";
import {
  formatMinuteLabel,
  formatScorePair,
  formatPercent,
  safeText,
} from "@/components/assistant/presentation-formatters";

type MatchHeroProps = {
  data: MatchAnalysisBundle;
  lastUpdated?: number | null;
  isRefreshing?: boolean;
  contextLabel?: string;
  contextMode?: "live" | "replay" | "resiliente";
};

export default function MatchHero({
  data,
  lastUpdated,
  isRefreshing = false,
  contextLabel = "Ao vivo",
  contextMode = "live",
}: MatchHeroProps) {
  const {
    match,
    headlineInsight,
    momentum,
    winnerProbabilities,
    recentContext,
  } = data;

  const isLiveMode = contextMode === "live";
  const minuteText = formatMinuteLabel(
    match.minute,
    isLiveMode ? "Minuto nao confirmado" : "Recorte indisponivel",
  );
  const timeLabel = minuteText.includes("'")
    ? isLiveMode
      ? `Minuto ${minuteText.replace("'", "")}`
      : `Recorte ${minuteText.replace("'", "")}`
    : minuteText;
  const score = formatScorePair(match.score?.home, match.score?.away);
  const homeName = safeText(match.homeTeam?.name, "Time da casa");
  const awayName = safeText(match.awayTeam?.name, "Time visitante");
  const leagueName = safeText(match.leagueName, "Liga indisponivel");
  const headlineText = safeText(
    headlineInsight?.text,
    "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
  );
  const contextText = safeText(
    recentContext,
    "Ainda nao ha dados suficientes para estimar este indicador com confianca.",
  );
  const momentumText = safeText(
    momentum?.summary,
    "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
  );

  const badgeClass =
    contextMode === "live"
      ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
      : contextMode === "replay"
        ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
        : "border-amber-500/40 bg-amber-500/15 text-amber-200";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_rgba(15,23,42,0.96)_45%)] p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}
          >
            {isLiveMode ? (
              <Radio size={12} className="animate-pulse" />
            ) : (
              <Activity size={12} />
            )}
            {contextLabel}
          </span>
          <span className="text-xs text-slate-300">{leagueName}</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-200">{timeLabel}</p>
          <p className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isRefreshing ? "animate-pulse bg-emerald-300" : "bg-slate-500"
              }`}
            />
            {isRefreshing
              ? "Atualizando leitura em tempo real"
              : lastUpdated
                ? `Atualizado ${new Date(lastUpdated).toLocaleTimeString("pt-BR")}`
                : "Sem atualizacao recente"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-sm font-medium text-emerald-100">Jogo em foco</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {homeName} {score.home} x {score.away} {awayName}
          </h1>
          <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {headlineText}
          </p>
          <p className="mt-2 text-sm text-slate-300">{contextText}</p>
          <p className="mt-2 text-xs text-slate-400">
            Leitura orientada a decisao: contexto de jogo, variacao recente e
            nivel de confianca do modelo.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">{homeName}</p>
              <p className="text-lg font-bold text-emerald-300">
                {formatPercent(winnerProbabilities.home, "0%")}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">Empate</p>
              <p className="text-lg font-bold text-sky-300">
                {formatPercent(winnerProbabilities.draw, "0%")}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
              <p className="text-xs text-slate-400">{awayName}</p>
              <p className="text-lg font-bold text-amber-300">
                {formatPercent(winnerProbabilities.away, "0%")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-200">
            <Activity size={16} className="text-emerald-300" />
            <h2 className="text-sm font-semibold">
              {isLiveMode ? "Momentum ao vivo" : "Momentum do replay"}
            </h2>
          </div>
          <MomentumBar
            homeLabel={homeName}
            awayLabel={awayName}
            homeValue={momentum.home}
            awayValue={momentum.away}
          />
          <p className="mt-3 rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-300">
            {momentumText}
          </p>
        </div>
      </div>
    </section>
  );
}
