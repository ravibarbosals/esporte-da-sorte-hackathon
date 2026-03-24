import { KeyPlayer } from "@/types";

type KeyPlayersPanelProps = {
  players: KeyPlayer[];
};

const roleLabel: Record<KeyPlayer["role"], string> = {
  participacao_em_gol: "Maior chance de participacao em gol",
  risco_disciplinar: "Maior risco disciplinar",
  impacto_ofensivo: "Maior impacto ofensivo",
  impacto_defensivo: "Maior impacto defensivo",
};

export default function KeyPlayersPanel({ players }: KeyPlayersPanelProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {players.map((player) => (
        <article
          key={player.id}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {roleLabel[player.role]}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{player.name}</p>
          <p className="text-xs text-slate-400">{player.team}</p>
          <p className="mt-3 text-2xl font-bold text-emerald-300">
            {player.probability}%
          </p>
          <p className="mt-2 text-xs text-slate-400">{player.summary}</p>
        </article>
      ))}
    </div>
  );
}
