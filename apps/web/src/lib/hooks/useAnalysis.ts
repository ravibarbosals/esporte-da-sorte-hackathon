import { useCallback, useState } from "react";
import { AnalysisData, HeadToHeadMatch, TeamForm } from "@/types/analysis";
import { mockAnalysisData } from "@/lib/mocks/analysisData";

type FullPredictionPayload = {
  prediction?: Record<string, unknown>;
  indicators?: Record<string, unknown>;
};

type H2hPayload = Array<Record<string, unknown>> | Record<string, unknown>;

const NEST_API =
  process.env.NEXT_PUBLIC_NEST_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

function toNum(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDate(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString("pt-BR");
}

function getH2hRows(payload: H2hPayload): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const maybeRows = (payload as Record<string, unknown>).matches;
    if (Array.isArray(maybeRows)) {
      return maybeRows as Array<Record<string, unknown>>;
    }
  }

  return [];
}

function mapH2HMatches(payload: H2hPayload): HeadToHeadMatch[] {
  return getH2hRows(payload)
    .slice(0, 5)
    .map((m) => ({
      date: formatDate(m.date),
      competition: String(m.competition ?? "Head to Head"),
      homeTeam: String(m.home ?? m.home_team ?? "Time da casa"),
      awayTeam: String(m.away ?? m.away_team ?? "Time visitante"),
      homeScore: toNum(m.home_score),
      awayScore: toNum(m.away_score),
      stadium:
        typeof m.stadium === "string" && m.stadium.trim()
          ? m.stadium.trim()
          : undefined,
    }));
}

function buildFormFromH2h(
  matches: HeadToHeadMatch[],
  teamName: string,
): TeamForm[] {
  return matches.map((m) => {
    const isHome = m.homeTeam === teamName;
    const goalsFor = isHome ? m.homeScore : m.awayScore;
    const goalsAgainst = isHome ? m.awayScore : m.homeScore;

    const result: TeamForm["result"] =
      goalsFor > goalsAgainst ? "W" : goalsFor === goalsAgainst ? "D" : "L";

    return {
      match: `${m.homeTeam} vs ${m.awayTeam}`,
      result,
      score: `${m.homeScore}-${m.awayScore}`,
    };
  });
}

function calcConfidence(
  pred: Record<string, unknown>,
  oddType: string,
): number {
  const directConfidence = toNum(pred.confidence, NaN);
  if (Number.isFinite(directConfidence)) {
    return directConfidence <= 1
      ? Math.round(directConfidence * 100)
      : Math.round(directConfidence);
  }

  const lower = oddType.toLowerCase();
  if (lower.includes("empate")) {
    return Math.round(toNum(pred.draw, 0.5) * 100);
  }
  if (lower.includes("fora") || lower.includes("visit")) {
    return Math.round(toNum(pred.away_win, 0.5) * 100);
  }
  return Math.round(toNum(pred.home_win, 0.5) * 100);
}

function buildNote(
  pred: Record<string, unknown>,
  indicators: Record<string, unknown>,
  home: string,
  away: string,
  oddType: string,
): string {
  const hp = Math.round(toNum(pred.home_win, 0.33) * 1000) / 10;
  const dp = Math.round(toNum(pred.draw, 0.33) * 1000) / 10;
  const ap = Math.round(toNum(pred.away_win, 0.33) * 1000) / 10;

  const xgh = toNum(pred.xg_home, NaN);
  const xga = toNum(pred.xg_away, NaN);

  const homeInconsistency = toNum(
    (indicators.home as Record<string, unknown> | undefined)?.inconsistency,
    NaN,
  );
  const awayInconsistency = toNum(
    (indicators.away as Record<string, unknown> | undefined)?.inconsistency,
    NaN,
  );

  let note = `Analise: ${home} x ${away} | Mercado selecionado: ${oddType}. `;
  note += `Probabilidades: ${home} ${hp}% | Empate ${dp}% | ${away} ${ap}%. `;

  if (Number.isFinite(xgh) && Number.isFinite(xga)) {
    note += `xG estimado: ${home} ${xgh.toFixed(2)} vs ${away} ${xga.toFixed(2)}. `;
  }

  if (
    Number.isFinite(homeInconsistency) &&
    Number.isFinite(awayInconsistency)
  ) {
    note += `Indice de inconsistencia: ${home} ${homeInconsistency.toFixed(2)} | ${away} ${awayInconsistency.toFixed(2)}.`;
  }

  return note.trim();
}

function normalizeShortName(team: string) {
  return (
    team
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 3)
      .map((chunk) => chunk[0]?.toUpperCase() ?? "")
      .join("") || "---"
  );
}

export interface UseAnalysisOptions {
  competitionId?: string;
  useMock?: boolean;
}

export function useAnalysis({
  competitionId = "53",
  useMock = false,
}: UseAnalysisOptions = {}) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(
    async (
      homeTeam: string,
      awayTeam: string,
      oddType: string,
      oddValue: string,
    ) => {
      setLoading(true);
      setError(null);

      if (useMock) {
        await new Promise((r) => setTimeout(r, 450));
        setData({
          ...mockAnalysisData,
          homeTeam: {
            ...mockAnalysisData.homeTeam,
            name: homeTeam,
            shortName: normalizeShortName(homeTeam),
          },
          awayTeam: {
            ...mockAnalysisData.awayTeam,
            name: awayTeam,
            shortName: normalizeShortName(awayTeam),
          },
          oddType,
          oddValue,
        });
        setLoading(false);
        return;
      }

      try {
        const he = encodeURIComponent(homeTeam);
        const ae = encodeURIComponent(awayTeam);

        const [fullRes, h2hRes] = await Promise.allSettled([
          fetch(`${NEST_API}/predictions/${he}/${ae}/full`),
          fetch(`${NEST_API}/predictions/h2h/${competitionId}/${he}/${ae}`),
        ]);

        const fullPayload: FullPredictionPayload =
          fullRes.status === "fulfilled" && fullRes.value.ok
            ? ((await fullRes.value.json()) as FullPredictionPayload)
            : {};

        const h2hPayload: H2hPayload =
          h2hRes.status === "fulfilled" && h2hRes.value.ok
            ? ((await h2hRes.value.json()) as H2hPayload)
            : [];

        const prediction = fullPayload.prediction ?? {};
        const indicators = fullPayload.indicators ?? {};
        const h2hMatches = mapH2HMatches(h2hPayload);

        const fallbackH2h =
          h2hMatches.length > 0 ? h2hMatches : mockAnalysisData.h2h;
        const homeForm = buildFormFromH2h(fallbackH2h, homeTeam);
        const awayForm = buildFormFromH2h(fallbackH2h, awayTeam);

        setData({
          homeTeam: {
            name: homeTeam,
            shortName: normalizeShortName(homeTeam),
            color: "#009C3B",
          },
          awayTeam: {
            name: awayTeam,
            shortName: normalizeShortName(awayTeam),
            color: "#0055A4",
          },
          h2h: fallbackH2h,
          homeForm: homeForm.length > 0 ? homeForm : mockAnalysisData.homeForm,
          awayForm: awayForm.length > 0 ? awayForm : mockAnalysisData.awayForm,
          oddType,
          oddValue,
          confidence: calcConfidence(prediction, oddType),
          analystNote: buildNote(
            prediction,
            indicators,
            homeTeam,
            awayTeam,
            oddType,
          ),
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erro ao buscar analise no backend";
        setError(message);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [competitionId, useMock],
  );

  return { data, loading, error, fetchAnalysis };
}
