"use client";

import { useEffect, useState } from "react";
import { Match, MatchAnalysisBundle } from "@/types";
import {
  ExperienceMeta,
  getLiveMatchesForAssistantResolved,
  getMatchAnalysisResolved,
  MatchAnalysisSectionStatus,
} from "@/services/assistant";

type AssistantHomeState = {
  featured: MatchAnalysisBundle | null;
  liveMatches: Match[];
  loading: boolean;
  isRefreshing: boolean;
  lastUpdated: number | null;
  liveSource: "api" | "mock";
  experience: ExperienceMeta;
  featuredSectionStatus: MatchAnalysisSectionStatus | null;
  hasPartialFallback: boolean;
};

const POLLING_INTERVAL_MS = 15000;

export function useAssistantHomeData(): AssistantHomeState {
  const [state, setState] = useState<AssistantHomeState>({
    featured: null,
    liveMatches: [],
    loading: true,
    isRefreshing: false,
    lastUpdated: null,
    liveSource: "mock",
    experience: {
      mode: "resiliente",
      label: "Cobertura resiliente",
      hint: "A leitura esta em estabilizacao enquanto as fontes principais reconectam.",
    },
    featuredSectionStatus: null,
    hasPartialFallback: false,
  });

  useEffect(() => {
    let mounted = true;
    let inFlight = false;

    const refresh = async (isInitialLoad: boolean) => {
      if (inFlight) {
        return;
      }

      inFlight = true;
      if (!isInitialLoad && mounted) {
        setState((prev) => ({
          ...prev,
          isRefreshing: true,
        }));
      }

      try {
        const liveResult = await getLiveMatchesForAssistantResolved();
        const featuredMatch = liveResult.matches[0];
        const featuredResult = featuredMatch
          ? await getMatchAnalysisResolved(featuredMatch.id)
          : null;

        if (!mounted) {
          return;
        }

        setState({
          featured: featuredResult?.bundle ?? null,
          liveMatches: liveResult.matches,
          loading: false,
          isRefreshing: false,
          lastUpdated: Date.now(),
          liveSource: liveResult.source,
          experience: liveResult.experience,
          featuredSectionStatus: featuredResult?.sectionStatus ?? null,
          hasPartialFallback:
            liveResult.experience.mode === "resiliente" ||
            Boolean(featuredResult?.hasPartialFallback),
        });
      } catch {
        if (!mounted) {
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          isRefreshing: false,
          experience: {
            mode: "resiliente",
            label: "Cobertura resiliente",
            hint: "Nao foi possivel atualizar a camada ao vivo neste momento.",
          },
          hasPartialFallback: true,
        }));
      } finally {
        inFlight = false;
      }
    };

    void refresh(true);
    const timer = window.setInterval(() => {
      void refresh(false);
    }, POLLING_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  return state;
}
