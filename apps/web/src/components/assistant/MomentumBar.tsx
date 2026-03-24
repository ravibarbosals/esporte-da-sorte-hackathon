import { useEffect, useRef, useState } from "react";

type MomentumBarProps = {
  homeLabel: string;
  awayLabel: string;
  homeValue: number;
  awayValue: number;
};

export default function MomentumBar({
  homeLabel,
  awayLabel,
  homeValue,
  awayValue,
}: MomentumBarProps) {
  const safeHome = Math.max(0, Math.min(100, homeValue));
  const safeAway = Math.max(0, Math.min(100, awayValue));
  const lastValueRef = useRef(safeHome);
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    if (lastValueRef.current !== safeHome) {
      setIsUpdated(true);
      lastValueRef.current = safeHome;
      const timer = window.setTimeout(() => setIsUpdated(false), 800);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [safeHome]);

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        Dominio e intensidade no recorte recente
      </p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-emerald-200">{homeLabel}</span>
        <span className="font-semibold text-sky-200">{awayLabel}</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
        <div
          className={`h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-sky-500 transition-all duration-500 ${
            isUpdated ? "brightness-125" : ""
          }`}
          style={{ width: `${safeHome}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-emerald-300">
          {homeLabel}: {safeHome}%
        </span>
        <span className="text-sky-300">
          {awayLabel}: {safeAway}%
        </span>
      </div>
    </div>
  );
}
