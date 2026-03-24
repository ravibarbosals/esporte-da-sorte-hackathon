import { Insight } from "@/types";
import { AlertTriangle, Lightbulb, Radar } from "lucide-react";

type InsightPanelProps = {
  insights: Insight[];
};

const toneStyles: Record<Insight["tone"], string> = {
  positivo: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  alerta: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  neutro: "border-sky-500/30 bg-sky-500/10 text-sky-100",
};

const toneIcon: Record<Insight["tone"], React.ReactNode> = {
  positivo: <Lightbulb size={16} className="text-emerald-300" />,
  alerta: <AlertTriangle size={16} className="text-amber-300" />,
  neutro: <Radar size={16} className="text-sky-300" />,
};

export default function InsightPanel({ insights }: InsightPanelProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {insights.map((insight) => (
        <article
          key={insight.id}
          className={`rounded-2xl border p-4 ${toneStyles[insight.tone]}`}
        >
          <div className="mb-2 flex items-center gap-2">
            {toneIcon[insight.tone]}
            <h3 className="text-sm font-semibold">{insight.title}</h3>
          </div>
          <p className="text-sm text-slate-200">{insight.text}</p>
        </article>
      ))}
    </div>
  );
}
