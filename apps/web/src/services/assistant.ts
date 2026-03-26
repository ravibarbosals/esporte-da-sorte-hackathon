import api, { getUpcomingMatches } from "@/services/api";
import {
  ConfidenceLevel,
  Match,
  MatchAnalysisBundle,
  ModelExplanationSection,
  PreMatchAnalysis,
} from "@/types";
import {
  adaptMatchDetail,
  adaptLiveReplayMatch,
  adaptReplayMatchDetail,
  adaptReplayTimeline,
  adaptUpcomingMatch,
  attachMatchToAnalysis,
} from "@/lib/adapters/assistant-adapters";
import {
  modelExplanationMock,
  preMatchAnalysisMock,
  upcomingMatchesMock,
} from "@/lib/mocks/assistant";

type SectionSource = "api" | "mock";

export type ExperienceMode = "live" | "replay" | "resiliente";

export type ExperienceMeta = {
  mode: ExperienceMode;
  label: string;
  hint: string;
};

export type MatchAnalysisSectionStatus = {
  match: SectionSource;
  predictions: SectionSource;
  timeline: SectionSource;
  momentum: SectionSource;
  scenarios: SectionSource;
  keyPlayers: SectionSource;
};

export type MatchAnalysisResolved = {
  bundle: MatchAnalysisBundle;
  sectionStatus: MatchAnalysisSectionStatus;
  availability: MatchDetailAvailability;
  hasPartialFallback: boolean;
  experience: ExperienceMeta;
};

export type SectionAvailability = {
  available: boolean;
  reasonUnavailable?: string;
  confidence: ConfidenceLevel;
};

export type MatchDetailAvailability = {
  probabilities: SectionAvailability;
  headToHead: SectionAvailability;
  teamComparisons: SectionAvailability;
  factors: SectionAvailability;
  momentum: SectionAvailability;
  timeline: SectionAvailability;
  scenarios: SectionAvailability;
  insights: SectionAvailability;
  keyPlayers: SectionAvailability;
};

const UNAVAILABLE = {
  probabilities:
    "Ainda nao ha dados suficientes para estimar este indicador com confianca.",
  teamComparisons: "Comparativo indisponivel com os dados atuais da partida.",
  factors:
    "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
  momentum:
    "Ainda nao ha dados suficientes para estimar este indicador com confianca.",
  timeline: "Ainda nao ha eventos recentes suficientes para compor a timeline.",
  scenarios:
    "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
  insights:
    "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
  keyPlayers:
    "Dados insuficientes para destacar jogadores influentes nesta partida.",
} as const;

type LiveMatchesResolved = {
  matches: Match[];
  source: SectionSource;
  experience: ExperienceMeta;
};

function resolveExperienceMeta(
  payload?: Record<string, unknown> | null,
): ExperienceMeta {
  const source = String(payload?.source ?? "")
    .trim()
    .toLowerCase();
  const mode = String(payload?.mode ?? "")
    .trim()
    .toLowerCase();

  if (source === "betsapi") {
    return {
      mode: "live",
      label: "Ao vivo",
      hint: "Partidas em tempo real com atualizacao continua da BetsAPI.",
    };
  }

  if (source === "statsbomb-replay" || mode === "replay") {
    return {
      mode: "replay",
      label: "Replay analitico",
      hint: "Sem jogos ao vivo na BetsAPI neste momento. Exibindo replay analitico com eventos reais do StatsBomb.",
    };
  }

  if (source === "fallback") {
    return {
      mode: "resiliente",
      label: "Cobertura resiliente",
      hint: "Fontes principais indisponiveis no momento. Exibindo cobertura de contingencia para manter a experiencia.",
    };
  }

  return {
    mode: "resiliente",
    label: "Cobertura resiliente",
    hint: "A leitura esta em estabilizacao enquanto as fontes principais reconectam.",
  };
}

function buildTechnicalBundle(match: Match): MatchAnalysisBundle {
  return {
    match,
    odds: undefined,
    headlineInsight: {
      id: "headline-unavailable",
      title: "Leitura parcial",
      text: "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
      tone: "neutro",
    },
    recentContext:
      "Ainda nao ha dados suficientes para estimar este indicador com confianca.",
    winnerProbabilities: {
      home: 0,
      draw: 0,
      away: 0,
    },
    momentum: {
      minute: match.minute ?? 0,
      home: 0,
      away: 0,
      trend: "estavel",
      summary:
        "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
    },
    headToHead: undefined,
    predictions: [],
    factors: [],
    timeline: [],
    scenarios: [],
    keyPlayers: [],
    teamComparisons: [],
    textualInsights: [],
  };
}

function buildTechnicalMatch(matchId: string): Match {
  return {
    id: matchId,
    leagueName: "Partida ao vivo",
    status: "live",
    isLive: true,
    minute: 0,
    kickoffLabel: "Ao vivo",
    score: { home: 0, away: 0 },
    homeTeam: { id: `home-${matchId}`, name: "Time da casa" },
    awayTeam: { id: `away-${matchId}`, name: "Time visitante" },
    miniInsight:
      "Leitura inicial disponivel. Contexto completo em atualizacao continua.",
  };
}

function isFallbackPayload(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = String((value as Record<string, unknown>).source ?? "")
    .trim()
    .toLowerCase();

  return source === "fallback";
}

function sanitizeEditorialText(value: unknown, fallback: string): string {
  const parsed = String(value ?? "").trim();
  if (!parsed) {
    return fallback;
  }

  const cleaned = parsed
    .replace(/\b[a-z]+(?:_[a-z]+)+\s*=\s*-?\d+(?:\.\d+)?\b/gi, "")
    .replace(/\s*\|\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned || fallback;
}

function hasMeaningfulComparison(bundle: MatchAnalysisBundle): boolean {
  const validRows = bundle.teamComparisons.filter(
    (row) => Number(row.homeValue) > 0 || Number(row.awayValue) > 0,
  );
  return validRows.length >= 2;
}

function hasMeaningfulHeadToHead(bundle: MatchAnalysisBundle): boolean {
  const summary = String(bundle.headToHead?.summary ?? "").trim();
  const homeForm = String(bundle.headToHead?.homeForm ?? "").trim();
  const awayForm = String(bundle.headToHead?.awayForm ?? "").trim();

  return summary.length >= 8 || homeForm.length > 0 || awayForm.length > 0;
}

function hasMeaningfulPredictions(bundle: MatchAnalysisBundle): boolean {
  return bundle.predictions.some(
    (row) =>
      Number.isFinite(row.probability) &&
      row.probability > 0 &&
      String(row.name ?? "").trim().length > 0,
  );
}

function hasMeaningfulFactors(bundle: MatchAnalysisBundle): boolean {
  return bundle.factors.some(
    (row) =>
      String(row.label ?? "").trim().length > 0 &&
      Number.isFinite(row.value) &&
      row.value > 0,
  );
}

function hasMeaningfulMomentum(bundle: MatchAnalysisBundle): boolean {
  const home = Number(bundle.momentum.home);
  const away = Number(bundle.momentum.away);
  const minute = Number(bundle.momentum.minute);

  return (
    Number.isFinite(home) &&
    Number.isFinite(away) &&
    home >= 0 &&
    away >= 0 &&
    home + away > 0 &&
    Number.isFinite(minute) &&
    minute > 0
  );
}

function hasMeaningfulTimeline(bundle: MatchAnalysisBundle): boolean {
  return bundle.timeline.some(
    (event) =>
      Number.isFinite(event.minute) &&
      event.minute > 0 &&
      String(event.title ?? "").trim().length >= 4 &&
      String(event.description ?? "").trim().length >= 8,
  );
}

function hasMeaningfulScenarios(bundle: MatchAnalysisBundle): boolean {
  return bundle.scenarios.some(
    (row) =>
      Number.isFinite(row.probability) &&
      row.probability > 0 &&
      String(row.title ?? "").trim().length > 0 &&
      String(row.explanation ?? "").trim().length > 0,
  );
}

function hasUsefulInsights(bundle: MatchAnalysisBundle): boolean {
  if (
    bundle.textualInsights.some(
      (item) =>
        String(item.title ?? "").trim().length > 0 &&
        String(item.text ?? "").trim().length >= 12,
    )
  ) {
    return true;
  }

  const headline = String(bundle.headlineInsight.text ?? "").trim();
  return (
    headline.length > 0 &&
    !headline.includes("Informacoes insuficientes nesta partida")
  );
}

function hasMeaningfulKeyPlayers(bundle: MatchAnalysisBundle): boolean {
  return bundle.keyPlayers.some(
    (row) =>
      String(row.name ?? "").trim().length > 0 &&
      String(row.team ?? "").trim().length > 0 &&
      Number.isFinite(row.probability) &&
      row.probability > 0,
  );
}

function buildAvailability(
  bundle: MatchAnalysisBundle,
  sectionStatus: MatchAnalysisSectionStatus,
): MatchDetailAvailability {
  const probabilitiesAvailable =
    sectionStatus.predictions === "api" && hasMeaningfulPredictions(bundle);
  const headToHeadAvailable = hasMeaningfulHeadToHead(bundle);
  const comparisonsAvailable = hasMeaningfulComparison(bundle);
  const factorsAvailable = hasMeaningfulFactors(bundle);
  const momentumAvailable =
    sectionStatus.momentum === "api" && hasMeaningfulMomentum(bundle);
  const timelineAvailable =
    sectionStatus.timeline === "api" && hasMeaningfulTimeline(bundle);
  const scenariosAvailable = hasMeaningfulScenarios(bundle);
  const insightsAvailable = hasUsefulInsights(bundle);
  const keyPlayersAvailable = hasMeaningfulKeyPlayers(bundle);

  return {
    probabilities: {
      available: probabilitiesAvailable,
      reasonUnavailable: probabilitiesAvailable
        ? undefined
        : UNAVAILABLE.probabilities,
      confidence: probabilitiesAvailable ? "media" : "baixa",
    },
    headToHead: {
      available: headToHeadAvailable,
      reasonUnavailable: headToHeadAvailable
        ? undefined
        : "Historico de confrontos diretos indisponivel com os dados atuais.",
      confidence: headToHeadAvailable ? "media" : "baixa",
    },
    teamComparisons: {
      available: comparisonsAvailable,
      reasonUnavailable: comparisonsAvailable
        ? undefined
        : UNAVAILABLE.teamComparisons,
      confidence: comparisonsAvailable ? "media" : "baixa",
    },
    factors: {
      available: factorsAvailable,
      reasonUnavailable: factorsAvailable ? undefined : UNAVAILABLE.factors,
      confidence: factorsAvailable ? "media" : "baixa",
    },
    momentum: {
      available: momentumAvailable,
      reasonUnavailable: momentumAvailable ? undefined : UNAVAILABLE.momentum,
      confidence: momentumAvailable ? "media" : "baixa",
    },
    timeline: {
      available: timelineAvailable,
      reasonUnavailable: timelineAvailable ? undefined : UNAVAILABLE.timeline,
      confidence: timelineAvailable ? "media" : "baixa",
    },
    scenarios: {
      available: scenariosAvailable,
      reasonUnavailable: scenariosAvailable ? undefined : UNAVAILABLE.scenarios,
      confidence: scenariosAvailable ? "media" : "baixa",
    },
    insights: {
      available: insightsAvailable,
      reasonUnavailable: insightsAvailable ? undefined : UNAVAILABLE.insights,
      confidence: insightsAvailable ? "media" : "baixa",
    },
    keyPlayers: {
      available: keyPlayersAvailable,
      reasonUnavailable: keyPlayersAvailable
        ? undefined
        : UNAVAILABLE.keyPlayers,
      confidence: keyPlayersAvailable ? "media" : "baixa",
    },
  };
}

function isFulfilled<T>(
  result: PromiseSettledResult<T>,
): result is PromiseFulfilledResult<T> {
  return result.status === "fulfilled";
}

export async function getLiveMatchesForAssistant(): Promise<Match[]> {
  const result = await getLiveMatchesForAssistantResolved();
  return result.matches;
}

export async function getLiveMatchesForAssistantResolved(): Promise<LiveMatchesResolved> {
  try {
    const { data } = await api.get("/matches/live?minute=67");
    const payload = data as Record<string, unknown>;
    const rawMatches = payload?.matches;
    const isFallbackSource = isFallbackPayload(data);
    const experience = resolveExperienceMeta(payload);

    if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
      return {
        matches: [],
        source: "mock",
        experience,
      };
    }

    return {
      matches: rawMatches.map((item, index) =>
        adaptLiveReplayMatch(item, index),
      ),
      source: isFallbackSource ? "mock" : "api",
      experience,
    };
  } catch {
    return {
      matches: [],
      source: "mock",
      experience: {
        mode: "resiliente",
        label: "Cobertura resiliente",
        hint: "Nao foi possivel consultar a camada ao vivo neste instante. Tentando reconectar automaticamente.",
      },
    };
  }
}

export async function getUpcomingMatchesForAssistant(): Promise<Match[]> {
  try {
    const raw = await getUpcomingMatches();
    if (!Array.isArray(raw) || raw.length === 0) {
      return upcomingMatchesMock;
    }

    return raw.map((item, index) => adaptUpcomingMatch(item, index));
  } catch {
    return upcomingMatchesMock;
  }
}

export async function getMatchAnalysis(
  matchId: string,
): Promise<MatchAnalysisBundle> {
  const result = await getMatchAnalysisResolved(matchId);
  return result.bundle;
}

export async function getMatchAnalysisResolved(
  matchId: string,
): Promise<MatchAnalysisResolved> {
  const [matchResult, timelineResult] = await Promise.allSettled([
    api.get(`/matches/${matchId}?minute=67`),
    api.get(`/matches/${matchId}/timeline?minute=67`),
  ]);

  const matchFromApi = isFulfilled(matchResult)
    ? (matchResult.value as { data: Record<string, unknown> }).data
    : null;
  const timelineFromApi = isFulfilled(timelineResult)
    ? (timelineResult.value as { data: Record<string, unknown> }).data
    : null;

  const sectionStatus: MatchAnalysisSectionStatus = {
    match: matchFromApi && !isFallbackPayload(matchFromApi) ? "api" : "mock",
    predictions: "mock",
    timeline:
      timelineFromApi && !isFallbackPayload(timelineFromApi) ? "api" : "mock",
    momentum: "mock",
    scenarios: "mock",
    keyPlayers: "mock",
  };

  if (!matchFromApi) {
    throw new Error("Sem dados de partida para montar analise");
  }

  const technicalMatch = buildTechnicalMatch(matchId);

  const matchSource = String(
    (matchFromApi as Record<string, unknown>).source ?? "",
  )
    .trim()
    .toLowerCase();
  const match =
    matchSource === "statsbomb-replay"
      ? adaptReplayMatchDetail(matchFromApi, technicalMatch)
      : adaptMatchDetail(matchFromApi, technicalMatch);

  const base = attachMatchToAnalysis(buildTechnicalBundle(match), match);

  const bundle: MatchAnalysisBundle = {
    ...base,
    predictions: base.predictions,
    timeline: isFulfilled(timelineResult)
      ? adaptReplayTimeline((timelineResult.value as any).data, base.timeline)
      : base.timeline,
    momentum: base.momentum,
    scenarios: base.scenarios,
    keyPlayers: base.keyPlayers,
  };

  if (isFulfilled(matchResult)) {
    const matchData = (matchResult.value as any).data as Record<
      string,
      unknown
    >;
    const state = (matchData.state ?? {}) as Record<string, unknown>;
    const recentEvents = ((state.recentEvents ?? []) as string[])
      .map((item) => String(item ?? "").trim())
      .filter((item) => item.length > 0);

    bundle.headlineInsight = {
      ...bundle.headlineInsight,
      text: sanitizeEditorialText(
        state.miniInsight,
        bundle.headlineInsight.text,
      ),
    };

    if (Array.isArray(recentEvents) && recentEvents.length > 0) {
      bundle.textualInsights = [
        {
          id: "live-recent-events",
          title: "Eventos recentes",
          text: recentEvents.slice(-2).join(" "),
          tone: "neutro",
        },
        ...bundle.textualInsights.slice(0, 1),
      ];
    }

    const homeStats = (state.home ?? {}) as Record<string, unknown>;
    const awayStats = (state.away ?? {}) as Record<string, unknown>;
    bundle.teamComparisons = [
      {
        title: "xG acumulado",
        homeValue: Number(
          homeStats.xg ?? bundle.teamComparisons[0]?.homeValue ?? 0,
        ),
        awayValue: Number(
          awayStats.xg ?? bundle.teamComparisons[0]?.awayValue ?? 0,
        ),
      },
      {
        title: "Finalizacoes",
        homeValue: Number(homeStats.shots ?? 0),
        awayValue: Number(awayStats.shots ?? 0),
      },
      {
        title: "No alvo",
        homeValue: Number(homeStats.shotsOnTarget ?? 0),
        awayValue: Number(awayStats.shotsOnTarget ?? 0),
      },
      {
        title: "Cartoes amarelos",
        homeValue: Number(homeStats.yellowCards ?? 0),
        awayValue: Number(awayStats.yellowCards ?? 0),
      },
    ].filter((row) => Number(row.homeValue) > 0 || Number(row.awayValue) > 0);
  }

  const hasPartialFallback =
    sectionStatus.match === "mock" ||
    sectionStatus.predictions === "mock" ||
    sectionStatus.timeline === "mock" ||
    sectionStatus.momentum === "mock";

  const availability = buildAvailability(bundle, sectionStatus);

  const experience = resolveExperienceMeta(
    (matchFromApi as Record<string, unknown> | null) ?? null,
  );

  return {
    bundle,
    sectionStatus,
    availability,
    hasPartialFallback,
    experience,
  };
}

export async function getPreMatchAnalyses(): Promise<PreMatchAnalysis[]> {
  try {
    const responses = await Promise.all(
      preMatchAnalysisMock.map((item) =>
        api.get(`/matches/${item.matchId}/pre-match`).then((response) => ({
          ok: true,
          data: response.data,
          matchId: item.matchId,
        })),
      ),
    );

    return preMatchAnalysisMock.map((mockItem) => {
      const response = responses.find(
        (result) => result.matchId === mockItem.matchId,
      );
      const payload = response?.data as Record<string, unknown> | undefined;
      if (!payload) {
        return mockItem;
      }

      return {
        ...mockItem,
        homeForm: String(payload.homeForm ?? mockItem.homeForm),
        awayForm: String(payload.awayForm ?? mockItem.awayForm),
        interpretation: String(
          payload.interpretation ?? mockItem.interpretation,
        ),
      };
    });
  } catch {
    return preMatchAnalysisMock;
  }
}

export async function getModelExplanation(): Promise<
  ModelExplanationSection[]
> {
  try {
    const { data } = await api.get("/model/explanation");
    if (!Array.isArray(data) || data.length === 0) {
      return modelExplanationMock;
    }

    return data.map((item: Record<string, unknown>, index: number) => ({
      id: String(item.id ?? `model-${index}`),
      title: String(item.title ?? "Explicacao"),
      content: String(item.content ?? ""),
      bullets: Array.isArray(item.bullets)
        ? item.bullets.map((bullet) => String(bullet))
        : [],
    }));
  } catch {
    return modelExplanationMock;
  }
}
