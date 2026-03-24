import { ConfidenceLevel } from "@/types";

type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
};

const styles: Record<ConfidenceLevel, string> = {
  baixa: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  media: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  alta: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

export default function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${styles[level]}`}
    >
      Confianca {level}
    </span>
  );
}
