import { ModelFactor } from "@/types";

type ModelFactorsPanelProps = {
  factors: ModelFactor[];
};

function getFactorColor(direction: ModelFactor["direction"]) {
  if (direction === "positivo") {
    return "bg-emerald-500";
  }
  if (direction === "negativo") {
    return "bg-rose-500";
  }
  return "bg-sky-500";
}

export default function ModelFactorsPanel({ factors }: ModelFactorsPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 sm:p-5">
      <div className="space-y-4">
        {factors.map((factor) => (
          <article
            key={factor.id}
            className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-100">
                {factor.label}
              </p>
              <span className="text-xs font-semibold text-slate-300">
                {factor.value}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${getFactorColor(factor.direction)}`}
                style={{
                  width: `${Math.max(0, Math.min(100, factor.value))}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-400">{factor.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
