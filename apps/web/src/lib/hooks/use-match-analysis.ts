"use client";

import { useEffect, useState } from "react";
import { MatchAnalysisBundle } from "@/types";
import {
  ExperienceMeta,
  getMatchAnalysisResolved,
  MatchAnalysisSectionStatus,
} from "@/services/assistant";

const POLLING_INTERVAL_MS = 15000;

export function useMatchAnalysis(matchId: string) {
  const [analysis, setAnalysis] = useState<MatchAnalysisBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [sectionStatus, setSectionStatus] =
    useState<MatchAnalysisSectionStatus | null>(null);
  const [hasPartialFallback, setHasPartialFallback] = useState(false);
  const [experience, setExperience] = useState<ExperienceMeta>({
    mode: "resiliente",
    label: "Cobertura resiliente",
    hint: "A leitura sera normalizada automaticamente assim que as fontes reconectarem.",
  });

  useEffect(() => {
    let mounted = true;
    let inFlight = false;

    const refresh = async (isInitialLoad: boolean) => {
      if (!matchId || inFlight) {
        return;
      }

      inFlight = true;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const result = await getMatchAnalysisResolved(matchId);
        if (!mounted) {
          return;
        }

        setAnalysis(result.bundle);
        setSectionStatus(result.sectionStatus);
        setHasPartialFallback(result.hasPartialFallback);
        setExperience(result.experience);
        setLastUpdated(Date.now());
      } catch {
        if (!mounted) {
          return;
        }
        setAnalysis(null);
        setSectionStatus(null);
        setHasPartialFallback(true);
        setExperience({
          mode: "resiliente",
          label: "Cobertura resiliente",
          hint: "Nao foi possivel montar a leitura completa neste instante.",
        });
      } finally {
        if (!mounted) {
          return;
        }
        setLoading(false);
        setIsRefreshing(false);
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
  }, [matchId]);

  return {
    analysis,
    loading,
    isRefreshing,
    lastUpdated,
    sectionStatus,
    hasPartialFallback,
    experience,
  };
}
