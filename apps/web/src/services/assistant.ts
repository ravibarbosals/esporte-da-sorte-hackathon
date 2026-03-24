import api, { getUpcomingMatches } from "@/services/api";
import {
  Match,
  MatchAnalysisBundle,
  ModelExplanationSection,
  PreMatchAnalysis,
} from "@/types";
import {
  adaptLiveReplayMatch,
  adaptReplayMatchDetail,
  adaptReplayPredictions,
  adaptReplayTimeline,
  adaptReplayMomentum,
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
  hasPartialFallback: boolean;
  experience: ExperienceMeta;
};

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
    headlineInsight: {
      id: "tech-headline",
      title: "Leitura em consolidacao",
      text: "Dados ao vivo em consolidacao. A leitura sera refinada a cada atualizacao.",
      tone: "neutro",
    },
    recentContext:
      "Contexto parcial disponivel. Os blocos serao enriquecidos conforme novos sinais chegarem.",
    winnerProbabilities: {
      home: 34,
      draw: 33,
      away: 33,
    },
    momentum: {
      minute: match.minute ?? 0,
      home: 50,
      away: 50,
      trend: "estavel",
      summary: "Momentum neutro enquanto sinais detalhados sao processados.",
    },
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
  const [matchResult, predictionResult, timelineResult, momentumResult] =
    await Promise.allSettled([
      api.get(`/matches/${matchId}?minute=67`),
      api.get(`/matches/${matchId}/predictions?minute=67`),
      api.get(`/matches/${matchId}/timeline?minute=67`),
      api.get(`/matches/${matchId}/momentum?minute=67`),
    ]);

  const matchFromApi = isFulfilled(matchResult)
    ? (matchResult.value as { data: Record<string, unknown> }).data
    : null;
  const predictionFromApi = isFulfilled(predictionResult)
    ? (predictionResult.value as { data: Record<string, unknown> }).data
    : null;
  const timelineFromApi = isFulfilled(timelineResult)
    ? (timelineResult.value as { data: Record<string, unknown> }).data
    : null;
  const momentumFromApi = isFulfilled(momentumResult)
    ? (momentumResult.value as { data: Record<string, unknown> }).data
    : null;

  const sectionStatus: MatchAnalysisSectionStatus = {
    match: matchFromApi && !isFallbackPayload(matchFromApi) ? "api" : "mock",
    predictions:
      predictionFromApi && !isFallbackPayload(predictionFromApi)
        ? "api"
        : "mock",
    timeline:
      timelineFromApi && !isFallbackPayload(timelineFromApi) ? "api" : "mock",
    momentum:
      momentumFromApi && !isFallbackPayload(momentumFromApi) ? "api" : "mock",
    scenarios: "mock",
    keyPlayers: "mock",
  };

  if (!matchFromApi) {
    throw new Error("Sem dados de partida para montar analise");
  }

  const technicalMatch = buildTechnicalMatch(matchId);

  const match = adaptReplayMatchDetail(matchFromApi, technicalMatch);

  const base = attachMatchToAnalysis(buildTechnicalBundle(match), match);

  const bundle: MatchAnalysisBundle = {
    ...base,
    predictions: isFulfilled(predictionResult)
      ? adaptReplayPredictions(
          (predictionResult.value as any).data,
          base.predictions,
          {
            homeTeamName: match.homeTeam.name,
            awayTeamName: match.awayTeam.name,
            homeScore: match.score.home,
            awayScore: match.score.away,
          },
        )
      : base.predictions,
    timeline: isFulfilled(timelineResult)
      ? adaptReplayTimeline((timelineResult.value as any).data, base.timeline)
      : base.timeline,
    momentum: isFulfilled(momentumResult)
      ? adaptReplayMomentum((momentumResult.value as any).data, base.momentum)
      : base.momentum,
    scenarios: base.scenarios,
    keyPlayers: base.keyPlayers,
  };

  if (isFulfilled(predictionResult)) {
    const predictionData = (predictionResult.value as any).data as Record<
      string,
      unknown
    >;
    const winnerBlock = (predictionData.winnerProbability ?? {}) as Record<
      string,
      unknown
    >;
    const winner = (winnerBlock.probability ?? {}) as Record<string, unknown>;

    bundle.winnerProbabilities = {
      home:
        Number(winner.home ?? bundle.winnerProbabilities.home) ||
        bundle.winnerProbabilities.home,
      draw:
        Number(winner.draw ?? bundle.winnerProbabilities.draw) ||
        bundle.winnerProbabilities.draw,
      away:
        Number(winner.away ?? bundle.winnerProbabilities.away) ||
        bundle.winnerProbabilities.away,
    };

    bundle.recentContext = sanitizeEditorialText(
      winnerBlock.explanation,
      bundle.recentContext,
    );
  }

  if (isFulfilled(matchResult)) {
    const matchData = (matchResult.value as any).data as Record<
      string,
      unknown
    >;
    const state = (matchData.state ?? {}) as Record<string, unknown>;
    const recentEvents = (state.recentEvents ?? []) as string[];

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
    ];
  }

  const hasPartialFallback =
    sectionStatus.match === "mock" ||
    sectionStatus.predictions === "mock" ||
    sectionStatus.timeline === "mock" ||
    sectionStatus.momentum === "mock";

  const experience = resolveExperienceMeta(
    (matchFromApi as Record<string, unknown> | null) ?? null,
  );

  return {
    bundle,
    sectionStatus,
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
