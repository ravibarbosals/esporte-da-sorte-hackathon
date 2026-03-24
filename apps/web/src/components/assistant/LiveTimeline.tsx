import { useEffect, useRef, useState } from "react";
import { TimelineEvent } from "@/types";

type LiveTimelineProps = {
  events: TimelineEvent[];
};

export default function LiveTimeline({ events }: LiveTimelineProps) {
  const knownIdsRef = useRef<Set<string>>(new Set());
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (knownIdsRef.current.size === 0) {
      knownIdsRef.current = new Set(events.map((item) => item.id));
      return;
    }

    const newIds = events
      .filter((item) => !knownIdsRef.current.has(item.id))
      .map((item) => item.id);

    if (newIds.length > 0) {
      setFreshIds(new Set(newIds));
      const timer = window.setTimeout(() => setFreshIds(new Set()), 1800);
      knownIdsRef.current = new Set(events.map((item) => item.id));
      return () => window.clearTimeout(timer);
    }

    knownIdsRef.current = new Set(events.map((item) => item.id));
    return undefined;
  }, [events]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <p>Evolucao cronologica com comentarios contextuais</p>
        <p>{events.length} sinais monitorados</p>
      </div>
      <div className="relative space-y-4">
        <div className="absolute bottom-0 left-[1.2rem] top-0 w-px bg-slate-700/70" />
        {events.map((event) => (
          <article
            key={event.id}
            className="relative grid grid-cols-[auto_1fr] gap-3"
          >
            <div className="mt-1">
              <span className="inline-flex min-w-10 justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                {event.minute}'
              </span>
            </div>
            <div
              className={`rounded-xl border bg-slate-950/60 p-3 transition-all duration-300 ${
                freshIds.has(event.id)
                  ? "border-emerald-400/60 shadow-md shadow-emerald-500/15"
                  : "border-slate-800"
              }`}
            >
              <p className="text-[11px] uppercase tracking-wide text-amber-300">
                {event.impactLabel}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {event.title}
              </p>
              <p className="mt-1 text-sm text-slate-300">{event.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
