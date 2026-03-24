type LoadingStateProps = {
  label?: string;
  compact?: boolean;
};

export default function LoadingState({
  label = "Consolidando sinais da partida...",
  compact = false,
}: LoadingStateProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
      <div className="h-1 w-full animate-pulse bg-gradient-to-r from-emerald-500/20 via-emerald-300/50 to-sky-400/20" />
      <div className={compact ? "p-4" : "p-6 sm:p-8"}>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="mt-1 text-xs text-slate-400">
          Cruzando contexto recente, variacao de probabilidade e eventos-chave.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-20 animate-pulse rounded-xl border border-slate-800 bg-slate-950/60" />
          <div className="h-20 animate-pulse rounded-xl border border-slate-800 bg-slate-950/60" />
          <div className="h-20 animate-pulse rounded-xl border border-slate-800 bg-slate-950/60 sm:col-span-2 lg:col-span-1" />
        </div>
      </div>
    </div>
  );
}
