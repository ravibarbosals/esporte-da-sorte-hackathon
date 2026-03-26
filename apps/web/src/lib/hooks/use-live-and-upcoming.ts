"use client";

import { useEffect, useState } from "react";
import { Match } from "@/types";
import {
  getLiveMatchesForAssistant,
  getUpcomingMatchesForAssistant,
} from "@/services/assistant";

export function useLiveAndUpcoming() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [replayMatches, setReplayMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const splitByStatus = (live: Match[], upcoming: Match[]) => {
    const byId = new Map<string, Match>();

    for (const match of upcoming) {
      byId.set(match.id, match);
    }

    // Live sobrescreve upcoming quando a mesma partida aparece nas duas fontes.
    for (const match of live) {
      byId.set(match.id, match);
    }

    const merged = Array.from(byId.values());

    const liveReal = live.filter(
      (match) =>
        String(match.source ?? "").toLowerCase() === "betsapi" &&
        match.phase === "live",
    );

    const replayOnly = live.filter(
      (match) =>
        String(match.source ?? "").toLowerCase() === "statsbomb-replay",
    );

    return {
      live: liveReal,
      replay: replayOnly,
      upcoming: merged.filter(
        (match) => match.phase === "upcoming" || match.status === "upcoming",
      ),
    };
  };

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getLiveMatchesForAssistant(),
      getUpcomingMatchesForAssistant(),
    ])
      .then(([live, upcoming]) => {
        if (!mounted) {
          return;
        }
        const classified = splitByStatus(live, upcoming);
        setLiveMatches(classified.live);
        setReplayMatches(classified.replay);
        setUpcomingMatches(classified.upcoming);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setLiveMatches([]);
        setReplayMatches([]);
        setUpcomingMatches([]);
      })
      .finally(() => {
        if (!mounted) {
          return;
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    liveMatches,
    replayMatches,
    upcomingMatches,
    loading,
  };
}
