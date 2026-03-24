type ErrorStateProps = {
  title?: string;
  description: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Atualizacao parcial neste bloco",
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
      <p className="text-sm font-semibold text-rose-200">{title}</p>
      <p className="mt-1 text-sm text-rose-100/90">{description}</p>
      <p className="mt-1 text-xs text-rose-100/70">
        A leitura geral segue ativa com os sinais disponiveis.
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md border border-rose-300/30 bg-rose-300/10 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-300/20"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}
