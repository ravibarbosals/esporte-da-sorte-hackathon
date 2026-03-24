import Link from "next/link";
import { Match } from "@/types";
import { ChevronRight } from "lucide-react";

type MatchCardProps = {
  match: Match;
  highlightLive?: boolean;
};

export default function MatchCard({
  match,
  highlightLive = true,
}: MatchCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/85 to-slate-950 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/40">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {highlightLive && match.isLive ? (
            <span className="rounded-full bg-rose-500/20 px-2 py-1 text-[10px] font-semibold text-rose-300">
              AO VIVO
            </span>
          ) : null}
          <span className="text-xs text-slate-400">{match.leagueName}</span>
        </div>
        <span className="text-xs text-slate-500">
          {match.minute ? `${match.minute}'` : match.kickoffLabel}
        </span>
      </div>

      <p className="text-sm font-semibold text-white">
        {match.homeTeam.name} {match.score.home} x {match.score.away}{" "}
        {match.awayTeam.name}
      </p>
      <p className="mt-2 rounded-md border border-slate-800 bg-slate-900/80 p-2 text-sm text-slate-300">
        {match.miniInsight}
      </p>

      <Link
        href={`/matches/${match.id}`}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
      >
        Abrir leitura completa
        <ChevronRight size={14} />
      </Link>
    </article>
  );
}
