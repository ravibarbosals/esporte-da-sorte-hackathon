"use client";

import { useEffect, useState } from "react";
import { MatchAnalysisBundle } from "@/types";
import {
  MatchDetailAvailability,
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
  const [availability, setAvailability] =
    useState<MatchDetailAvailability | null>(null);
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
        setAvailability(result.availability);
        setHasPartialFallback(result.hasPartialFallback);
        setExperience(result.experience);
        setLastUpdated(Date.now());
      } catch (error) {
        if (!mounted) {
          return;
        }

        // Em falha de refresh, preserva ultimo snapshot valido para evitar flicker.
        if (isInitialLoad) {
          setAnalysis(null);
          setSectionStatus(null);
          setAvailability(null);
        }

        setHasPartialFallback(true);
        setExperience({
          mode: "resiliente",
          label: "Cobertura resiliente",
          hint: isInitialLoad
            ? "Nao foi possivel montar a leitura completa neste instante."
            : "Instabilidade momentanea detectada. Mantendo a ultima leitura valida.",
        });

        console.error("Falha ao atualizar analise da partida", {
          matchId,
          isInitialLoad,
          error,
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
    availability,
    hasPartialFallback,
    experience,
  };
}
