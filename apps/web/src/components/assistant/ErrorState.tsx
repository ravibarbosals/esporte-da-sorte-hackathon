type ErrorStateProps = {
  title?: string;
  description: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Bloco temporariamente indisponivel",
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="min-h-[112px] rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="text-sm font-semibold text-amber-100">{title}</p>
      <p className="mt-1 text-sm text-amber-50/90">{description}</p>
      <p className="mt-1 text-xs text-amber-100/80">
        A leitura geral segue ativa com os sinais disponiveis.
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md border border-amber-200/30 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/20"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}
