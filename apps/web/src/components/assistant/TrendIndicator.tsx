import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { TrendDirection } from "@/types";

type TrendIndicatorProps = {
  trend: TrendDirection;
};

const trendMap: Record<
  TrendDirection,
  { label: string; color: string; icon: React.ReactNode }
> = {
  subindo: {
    label: "Subindo",
    color: "text-emerald-300",
    icon: <ArrowUpRight size={14} />,
  },
  estavel: {
    label: "Estavel",
    color: "text-sky-300",
    icon: <ArrowRight size={14} />,
  },
  caindo: {
    label: "Caindo",
    color: "text-rose-300",
    icon: <ArrowDownRight size={14} />,
  },
};

export default function TrendIndicator({ trend }: TrendIndicatorProps) {
  const item = trendMap[trend];

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${item.color}`}
    >
      {item.icon}
      {item.label}
    </span>
  );
}
