import { Scenario } from "@/types";
import {
  formatPercent,
  safeText,
} from "@/components/assistant/presentation-formatters";

type ScenarioListProps = {
  items: Scenario[];
};

export default function ScenarioList({ items }: ScenarioListProps) {
  return (
    <div className="grid gap-3">
      {items.map((scenario) => (
        <article
          key={scenario.id}
          className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">
              {safeText(scenario.title, "Cenario indisponivel")}
            </h3>
            <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xl font-bold text-emerald-300">
              {formatPercent(scenario.probability, "0%")}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {safeText(
              scenario.explanation,
              "Sem explicacao suficiente para este cenario no momento.",
            )}
          </p>
          <p className="mt-2 rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-400">
            Pode mudar se:{" "}
            {safeText(
              scenario.whatCanChange,
              "nao ha gatilhos confiaveis disponiveis agora.",
            )}
          </p>
        </article>
      ))}
    </div>
  );
}
