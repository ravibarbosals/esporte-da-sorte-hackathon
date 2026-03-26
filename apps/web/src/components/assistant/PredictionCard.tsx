import { useEffect, useRef, useState } from "react";
import { Prediction } from "@/types";
import {
  formatPercent,
  safeText,
} from "@/components/assistant/presentation-formatters";

type PredictionCardProps = {
  prediction: Prediction;
};

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const previousProbability = useRef(prediction.probability);
  const [isUpdated, setIsUpdated] = useState(false);
  const isHighProbability = prediction.probability >= 60;
  const isRisky =
    prediction.probability >= 50 &&
    safeText(prediction.name, "").toLowerCase().includes("cartao");

  const nameText = safeText(prediction.name, "Cenario indisponivel");
  const summaryText = safeText(
    prediction.summary,
    "Sem contexto suficiente para resumir este cenario no momento.",
  );

  useEffect(() => {
    if (previousProbability.current !== prediction.probability) {
      setIsUpdated(true);
      const timer = window.setTimeout(() => setIsUpdated(false), 900);
      previousProbability.current = prediction.probability;
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [prediction.probability]);

  return (
    <article
      className={`rounded-2xl border p-4 transition-all duration-300 ${
        isUpdated
          ? "border-emerald-400/80 shadow-lg shadow-emerald-500/15"
          : "border-slate-800"
      }`}
      style={{
        background: isHighProbability
          ? "linear-gradient(180deg, rgba(16,185,129,0.13) 0%, rgba(15,23,42,0.92) 55%)"
          : isRisky
            ? "linear-gradient(180deg, rgba(245,158,11,0.12) 0%, rgba(15,23,42,0.92) 55%)"
            : undefined,
      }}
    >
      <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">
        Previsao
      </p>
      <div className="flex items-start justify-between gap-3">
        <h3 className="max-w-[70%] text-sm font-semibold text-white">
          {nameText}
        </h3>
        <span
          className={`rounded-lg border px-2 py-1 text-2xl font-bold transition-all duration-300 ${
            isUpdated ? "text-emerald-200" : "text-emerald-300"
          }`}
          style={{
            borderColor: "rgba(16,185,129,0.35)",
            background: "rgba(16,185,129,0.1)",
          }}
        >
          {formatPercent(prediction.probability, "0%")}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-100">{summaryText}</p>
    </article>
  );
}
