import Link from "next/link";
import { Match } from "@/types";
import {
  formatDecimalOdd,
  formatMatchStatusLabel,
  formatMinuteLabel,
  formatScorePair,
  normalizeSourceTag,
  safeText,
} from "@/components/assistant/presentation-formatters";

type MatchCardProps = {
  match: Match;
  highlightLive?: boolean;
};

function buildTimeLabel(match: Match): string {
  return formatMinuteLabel(
    match.minute,
    safeText(match.kickoffLabel, "Horario indisponivel"),
  );
}

function sourceBadge(
  match: Match,
): { label: string; className: string } | null {
  const sourceTag = normalizeSourceTag(match.source, match.isLive);

  if (sourceTag === "live-real") {
    return {
      label: "LIVE REAL",
      className: "border-rose-500/40 bg-rose-500/20 text-rose-200",
    };
  }

  if (sourceTag === "replay") {
    return {
      label: "REPLAY",
      className: "border-sky-500/40 bg-sky-500/20 text-sky-200",
    };
  }

  if (sourceTag === "fallback") {
    return {
      label: "COBERTURA RESILIENTE",
      className: "border-amber-500/40 bg-amber-500/20 text-amber-200",
    };
  }

  return null;
}

export default function MatchCard({
  match,
  highlightLive = true,
}: MatchCardProps) {
  const badge = sourceBadge(match);
  const homeName = safeText(match.homeTeam?.name, "Time da casa");
  const awayName = safeText(match.awayTeam?.name, "Time visitante");
  const score = formatScorePair(match.score?.home, match.score?.away);
  const insight = safeText(
    match.miniInsight,
    "Informacoes insuficientes nesta partida para gerar leitura contextual.",
  );
  const statusLabel = formatMatchStatusLabel(
    match.status,
    match.phase,
    match.isLive,
  );
  const leagueName = safeText(match.leagueName, "Liga indisponivel");
  const hasOdds =
    Number(match.odds?.home) > 1 &&
    Number(match.odds?.draw) > 1 &&
    Number(match.odds?.away) > 1;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/95 to-slate-950 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/40"
    >
      <article className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {highlightLive && statusLabel === "AO VIVO" ? (
              <span className="rounded-full bg-rose-500/20 px-2 py-1 text-[10px] font-semibold text-rose-300">
                AO VIVO
              </span>
            ) : null}
            {statusLabel === "AGENDADO" ? (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                UPCOMING
              </span>
            ) : null}
            {badge ? (
              <span
                className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${badge.className}`}
              >
                {badge.label}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-slate-400">
            {buildTimeLabel(match)}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">{leagueName}</p>
            <p className="mt-1 text-base font-semibold text-white sm:text-lg">
              {homeName} {score.home} x {score.away} {awayName}
            </p>
          </div>
          <span className="rounded-md border border-slate-700 bg-slate-900/90 px-2 py-1 text-[11px] font-semibold text-slate-300">
            {statusLabel}
          </span>
        </div>

        {hasOdds ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
            <div className="mb-2 grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] uppercase text-slate-400">1</p>
                <p className="text-sm font-semibold text-white">
                  {formatDecimalOdd(match.odds?.home, "-")}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">X</p>
                <p className="text-sm font-semibold text-white">
                  {formatDecimalOdd(match.odds?.draw, "-")}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">2</p>
                <p className="text-sm font-semibold text-white">
                  {formatDecimalOdd(match.odds?.away, "-")}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              {safeText(match.odds?.market, "1x2")} ·{" "}
              {safeText(match.odds?.source, "origem indisponivel")}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2">
            <p className="text-[11px] text-amber-200">
              Odds indisponiveis para este jogo no momento.
            </p>
          </div>
        )}

        {!hasOdds ? (
          <p className="line-clamp-1 text-[11px] text-slate-500">{insight}</p>
        ) : null}
      </article>
    </Link>
  );
}
