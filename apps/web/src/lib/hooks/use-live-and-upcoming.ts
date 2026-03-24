"use client";

import { useEffect, useState } from "react";
import { Match } from "@/types";
import {
  getLiveMatchesForAssistant,
  getUpcomingMatchesForAssistant,
} from "@/services/assistant";

export function useLiveAndUpcoming() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLiveMatches(live);
        setUpcomingMatches(upcoming);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setLiveMatches([]);
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
    upcomingMatches,
    loading,
  };
}
