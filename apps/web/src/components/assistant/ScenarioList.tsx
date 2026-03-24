import { Scenario } from "@/types";

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
              {scenario.title}
            </h3>
            <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xl font-bold text-emerald-300">
              {scenario.probability}%
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-300">{scenario.explanation}</p>
          <p className="mt-2 rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-400">
            Pode mudar se: {scenario.whatCanChange}
          </p>
        </article>
      ))}
    </div>
  );
}
