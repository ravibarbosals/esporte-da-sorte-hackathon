type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="min-h-[168px] rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8">
      <span className="inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] font-semibold text-sky-200">
        Sem dados no momento
      </span>
      <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <p className="mt-1 text-xs text-slate-500">
        A visualizacao sera atualizada automaticamente quando novos dados
        chegarem.
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
