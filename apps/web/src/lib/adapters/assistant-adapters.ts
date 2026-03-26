import {
  Match,
  MatchAnalysisBundle,
  Prediction,
  TimelineEvent,
  LiveMomentumSnapshot,
  TrendDirection,
} from "@/types";

function normalizeText(value: unknown, fallback: string): string {
  const parsed = String(value ?? "").trim();
  return parsed.length > 0 ? parsed : fallback;
}

function sanitizeModelText(value: unknown, fallback: string): string {
  const raw = normalizeText(value, fallback);
  const withoutAssignments = raw
    .replace(/\b[a-z]+(?:_[a-z]+)+\s*=\s*-?\d+(?:\.\d+)?\b/gi, "")
    .replace(/\s*\|\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return withoutAssignments.length > 0 ? withoutAssignments : fallback;
}

function humanizeFactorName(name: string): string {
  const normalized = name.toLowerCase();

  const map: Record<string, string> = {
    score_diff: "diferenca no placar",
    xg_diff: "diferenca de xG",
    momentum_diff: "balanco de momentum",
    fouls_total: "volume de faltas",
    cards_total: "cartoes no jogo",
    shots_diff: "diferenca de finalizacoes",
    shots_on_target_diff: "diferenca de finalizacoes no alvo",
  };

  if (map[normalized]) {
    return map[normalized];
  }

  return normalized.replace(/_/g, " ");
}

function formatFactorValue(value: unknown): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "sinal neutro";
  }

  if (Number.isInteger(parsed)) {
    return String(parsed);
  }

  return parsed.toFixed(2);
}

function buildFactorsNarrative(value: unknown, fallback: string): string {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }

  const topFactors = value
    .slice(0, 3)
    .map((factor) => factor as Record<string, unknown>)
    .map((factor) => {
      const label = humanizeFactorName(String(factor.name ?? "sinal"));
      const formattedValue = formatFactorValue(factor.value);
      return `${label}: ${formattedValue}`;
    })
    .filter((item) => item.trim().length > 0);

  if (topFactors.length === 0) {
    return fallback;
  }

  return `Sinais que mais pesaram agora: ${topFactors.join("; ")}.`;
}

function toMinute(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function toLiveMinute(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 180) {
    return fallback;
  }
  return parsed;
}

function normalizeKickoffLabel(value: unknown, fallback: string): string {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const date = new Date(value > 1e12 ? value : value * 1000);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }

    if (/^\d{9,13}$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric) && numeric > 0) {
        const date = new Date(numeric > 1e12 ? numeric : numeric * 1000);
        return date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    return trimmed;
  }

  return fallback;
}

function normalizeTrend(
  value: unknown,
  fallback: TrendDirection,
): TrendDirection {
  if (value === "subindo" || value === "estavel" || value === "caindo") {
    return value;
  }
  return fallback;
}

function isTruthySignal(value: unknown): boolean {
  const signal = String(value ?? "")
    .trim()
    .toLowerCase();
  return signal === "1" || signal === "true" || signal === "yes";
}

function normalizeMatchStatus(raw: Record<string, unknown>): Match["status"] {
  const phaseValue = String(raw.phase ?? "").toLowerCase();
  if (
    phaseValue === "live" ||
    phaseValue === "upcoming" ||
    phaseValue === "finished"
  ) {
    return phaseValue;
  }

  const isLiveFlag =
    raw.is_live === true || raw.is_live === 1 || raw.is_live === "1";
  if (isLiveFlag) {
    return "live";
  }

  const statusValue = String(raw.status ?? "").toLowerCase();
  const timeStatusValue = String(raw.time_status ?? "").toLowerCase();
  const composite = `${statusValue} ${timeStatusValue}`;

  if (
    timeStatusValue === "2" ||
    timeStatusValue === "3" ||
    composite.includes("finished") ||
    composite.includes("ended") ||
    composite.includes("final") ||
    composite.includes("ft") ||
    composite.includes("cancelled") ||
    composite.includes("canceled") ||
    composite.includes("abandoned")
  ) {
    return "finished";
  }

  if (
    timeStatusValue === "1" ||
    composite.includes("live") ||
    composite.includes("inplay") ||
    composite.includes("running") ||
    isTruthySignal(raw.inplay) ||
    isTruthySignal(raw.live)
  ) {
    return "live";
  }

  return "upcoming";
}

function toSafeNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseGoalValue(value: unknown): number {
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    const nested =
      toSafeNumber(row.goals) ??
      toSafeNumber(row.score) ??
      toSafeNumber(row.value);
    return nested ?? 0;
  }

  const parsed = toSafeNumber(value);
  return parsed ?? 0;
}

function parseScore(score: unknown): { home: number; away: number } {
  if (typeof score === "string") {
    // Aceita formatos comuns de placar: "1-0", "1:0", "1 x 0".
    const matched = score.match(/(-?\d+)\s*[-:x]\s*(-?\d+)/i);
    if (matched) {
      return {
        home: parseGoalValue(matched[1]),
        away: parseGoalValue(matched[2]),
      };
    }
  }

  if (score && typeof score === "object") {
    const maybeScore = score as Record<string, unknown>;
    // Normaliza variações de payload sem inferir gols inexistentes.
    return {
      home: parseGoalValue(
        maybeScore.home ?? maybeScore.home_score ?? maybeScore[0],
      ),
      away: parseGoalValue(
        maybeScore.away ?? maybeScore.away_score ?? maybeScore[1],
      ),
    };
  }

  return { home: 0, away: 0 };
}

function extractTeamName(
  value: unknown,
  fallback: string,
  alternatives: unknown[] = [],
): string {
  const fromValue =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? String((value as { name?: unknown }).name ?? "")
        : "";

  const candidate = normalizeText(fromValue, "").trim();
  if (candidate) {
    return candidate;
  }

  for (const alt of alternatives) {
    const altName =
      typeof alt === "string"
        ? alt
        : alt && typeof alt === "object"
          ? String((alt as { name?: unknown }).name ?? "")
          : "";
    const parsed = normalizeText(altName, "").trim();
    if (parsed) {
      return parsed;
    }
  }

  return fallback;
}

function extractCompetitionName(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    const parsed = value.trim();
    return parsed || fallback;
  }

  if (value && typeof value === "object") {
    const fromName = String((value as { name?: unknown }).name ?? "").trim();
    if (fromName) {
      return fromName;
    }
  }

  return fallback;
}

function extractTeamId(
  value: unknown,
  fallback: string,
  alternatives: unknown[] = [],
): string {
  if (value && typeof value === "object") {
    const objectId = String((value as { id?: unknown }).id ?? "").trim();
    if (objectId) {
      return objectId;
    }
  }

  for (const alt of alternatives) {
    const altId =
      typeof alt === "object" && alt !== null
        ? String((alt as { id?: unknown }).id ?? "").trim()
        : String(alt ?? "").trim();
    if (altId) {
      return altId;
    }
  }

  return fallback;
}

function parseMatchOdds(
  raw: Record<string, unknown>,
): Match["odds"] | undefined {
  const direct = (raw.odds ?? {}) as Record<string, unknown>;
  const homeDirect = Number(direct.home ?? direct.homeOdds);
  const drawDirect = Number(direct.draw ?? direct.drawOdds);
  const awayDirect = Number(direct.away ?? direct.awayOdds);

  const homeFallback = Number(raw.home_odds ?? raw.homeOdds);
  const drawFallback = Number(raw.draw_odds ?? raw.drawOdds);
  const awayFallback = Number(raw.away_odds ?? raw.awayOdds);

  const home = Number.isFinite(homeDirect) ? homeDirect : homeFallback;
  const draw = Number.isFinite(drawDirect) ? drawDirect : drawFallback;
  const away = Number.isFinite(awayDirect) ? awayDirect : awayFallback;

  if (home > 1 && draw > 1 && away > 1) {
    return {
      home,
      draw,
      away,
      bookmaker: normalizeText(direct.bookmaker ?? raw.bookmaker, ""),
      market: normalizeText(direct.market ?? raw.market, "1x2"),
      source: normalizeText(direct.source ?? raw.source, ""),
      updatedAt: normalizeText(direct.updatedAt ?? raw.updatedAt, ""),
    };
  }

  return undefined;
}

export function adaptLiveMatch(raw: unknown, index: number): Match {
  const item = (raw ?? {}) as Record<string, unknown>;
  const ts = Number(item.match_time ?? item.time ?? 0);
  const minute = Number(item.minute ?? 0);
  const score = parseScore(item.score ?? item.ss);

  return {
    id: String(item.id ?? `live-${index}`),
    source: normalizeText(item.source, "betsapi"),
    leagueName:
      String(
        item.league_name ?? (item.league as { name?: string })?.name ?? "Liga",
      ).trim() || "Liga",
    leagueCountry:
      typeof item.league_country === "string" ? item.league_country : undefined,
    phase: "live",
    minute: Number.isFinite(minute) && minute > 0 ? minute : undefined,
    status: "live",
    isLive: true,
    kickoffLabel:
      ts > 0
        ? new Date(ts * 1000).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--",
    score,
    odds: parseMatchOdds(item),
    homeTeam: {
      id: extractTeamId(item.home, `h-${index}`, [
        item.home_id,
        item.home_team_external_id,
      ]),
      name: extractTeamName(item.homeTeam, "Time da casa", [
        item.home_team,
        item.home,
      ]),
    },
    awayTeam: {
      id: extractTeamId(item.away, `a-${index}`, [
        item.away_id,
        item.away_team_external_id,
      ]),
      name: extractTeamName(item.awayTeam, "Time visitante", [
        item.away_team,
        item.away,
      ]),
    },
    miniInsight:
      "Leitura em andamento: aguardando consolidacao completa do contexto recente.",
  };
}

export function adaptLiveReplayMatch(raw: unknown, index: number): Match {
  const item = (raw ?? {}) as Record<string, unknown>;
  const source = normalizeText(item.source, "statsbomb-replay").toLowerCase();
  const status = normalizeMatchStatus(item);
  const score = parseScore(item.score ?? item.ss);
  const minute = status === "live" ? toLiveMinute(item.minute, 0) : undefined;
  const kickoffFallback = source === "betsapi" ? "Ao vivo" : "Replay";
  const homeRef = item.home ?? item.homeTeam;
  const awayRef = item.away ?? item.awayTeam;

  return {
    id: String(item.id ?? `live-replay-${index}`),
    source,
    leagueName: extractCompetitionName(item.competition, "StatsBomb Replay"),
    phase: status,
    status,
    isLive: source === "betsapi" && status === "live",
    minute,
    kickoffLabel: normalizeKickoffLabel(
      item.kickoff ?? item.matchDate ?? item.time,
      kickoffFallback,
    ),
    score,
    odds: parseMatchOdds(item),
    homeTeam: {
      id: extractTeamId(homeRef, `h-r-${index}`, [
        item.home_id,
        item.home_team_external_id,
      ]),
      name: extractTeamName(item.homeTeam, "Time da casa", [
        item.home_team,
        item.home,
        item.O1,
      ]),
    },
    awayTeam: {
      id: extractTeamId(awayRef, `a-r-${index}`, [
        item.away_id,
        item.away_team_external_id,
      ]),
      name: extractTeamName(item.awayTeam, "Time visitante", [
        item.away_team,
        item.away,
        item.O2,
      ]),
    },
    miniInsight: normalizeText(
      item.miniInsight,
      "Leitura em andamento com dados reais de replay.",
    ),
  };
}

export function adaptMatchDetail(raw: unknown, fallback: Match): Match {
  const item = (raw ?? {}) as Record<string, unknown>;
  const status = normalizeMatchStatus(item);
  const state = (item.state ?? {}) as Record<string, unknown>;
  const homeState = (state.home ?? {}) as Record<string, unknown>;
  const awayState = (state.away ?? {}) as Record<string, unknown>;
  const scoreCandidate =
    item.score ??
    item.result ??
    item.ss ??
    (homeState.goals !== undefined || awayState.goals !== undefined
      ? { home: homeState.goals, away: awayState.goals }
      : fallback.score);
  const ts = Number(item.match_time ?? item.time ?? 0);
  const minute =
    status === "live"
      ? toMinute(
          item.minute ?? item.played_time ?? item.elapsed,
          fallback.minute ?? 0,
        )
      : undefined;

  return {
    id: String(item.id ?? item.external_id ?? fallback.id),
    source: normalizeText(item.source, fallback.source ?? "fallback"),
    leagueName: normalizeText(
      item.league_name ?? (item.league as { name?: string })?.name,
      fallback.leagueName,
    ),
    leagueCountry:
      typeof item.league_country === "string"
        ? item.league_country
        : fallback.leagueCountry,
    phase: status,
    minute,
    status,
    isLive: status === "live",
    kickoffLabel:
      ts > 0
        ? new Date(ts * 1000).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : fallback.kickoffLabel,
    score: parseScore(scoreCandidate),
    homeTeam: {
      id: extractTeamId(item.homeTeam ?? item.home, fallback.homeTeam.id, [
        item.home_id,
        item.home_team_external_id,
      ]),
      name: extractTeamName(item.homeTeam, fallback.homeTeam.name, [
        item.home_team,
        item.home,
      ]),
    },
    awayTeam: {
      id: extractTeamId(item.awayTeam ?? item.away, fallback.awayTeam.id, [
        item.away_id,
        item.away_team_external_id,
      ]),
      name: extractTeamName(item.awayTeam, fallback.awayTeam.name, [
        item.away_team,
        item.away,
      ]),
    },
    miniInsight: fallback.miniInsight,
  };
}

export function adaptReplayMatchDetail(raw: unknown, fallback: Match): Match {
  const item = (raw ?? {}) as Record<string, unknown>;
  const state = (item.state ?? {}) as Record<string, unknown>;
  const competition = (item.competition ?? {}) as Record<string, unknown>;
  const homeTeam = (item.homeTeam ?? {}) as Record<string, unknown>;
  const awayTeam = (item.awayTeam ?? {}) as Record<string, unknown>;
  const homeState = (state.home ?? {}) as Record<string, unknown>;
  const awayState = (state.away ?? {}) as Record<string, unknown>;

  return {
    id: String(item.id ?? fallback.id),
    source: normalizeText(item.source, fallback.source ?? "statsbomb-replay"),
    leagueName: normalizeText(competition.name, fallback.leagueName),
    phase: "live",
    status: "live",
    isLive: true,
    minute: toMinute(state.minute, fallback.minute ?? 67),
    kickoffLabel: normalizeText(
      (item.scheduled as Record<string, unknown> | undefined)?.kickoff,
      fallback.kickoffLabel,
    ),
    score: {
      home: toMinute(homeState.goals, fallback.score.home),
      away: toMinute(awayState.goals, fallback.score.away),
    },
    homeTeam: {
      id: extractTeamId(homeTeam, fallback.homeTeam.id, [item.home_id]),
      name: normalizeText(homeTeam.name, fallback.homeTeam.name),
    },
    awayTeam: {
      id: extractTeamId(awayTeam, fallback.awayTeam.id, [item.away_id]),
      name: normalizeText(awayTeam.name, fallback.awayTeam.name),
    },
    miniInsight: sanitizeModelText(state.miniInsight, fallback.miniInsight),
  };
}

type ReplayPredictionContext = {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
};

function resolveComebackTeam(context?: ReplayPredictionContext): string {
  if (!context) {
    return "time que esta atras";
  }

  if (context.homeScore < context.awayScore) {
    return context.homeTeamName;
  }

  if (context.awayScore < context.homeScore) {
    return context.awayTeamName;
  }

  return `${context.homeTeamName} ou ${context.awayTeamName}`;
}

export function adaptPredictions(
  raw: unknown,
  fallback: Prediction[],
): Prediction[] {
  const payloadList = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? [raw]
      : [];

  if (payloadList.length === 0) {
    return fallback;
  }

  const merged = [...fallback];
  const first = payloadList[0] as Record<string, unknown>;

  const table = [
    {
      id: "p-home-win",
      keys: ["home_win", "homeWin", "prob_home_win"],
      summary: "home_win_summary",
    },
    {
      id: "p-next-goal",
      keys: ["next_goal_10m", "nextGoal10m", "prob_next_goal_10m"],
      summary: "next_goal_summary",
    },
    {
      id: "p-card",
      keys: ["card_15m", "card15m", "prob_card_15m"],
      summary: "card_summary",
    },
    {
      id: "p-comeback",
      keys: ["draw_or_comeback", "drawOrComeback", "prob_draw_or_comeback"],
      summary: "draw_or_comeback_summary",
    },
    {
      id: "p-penalty",
      keys: ["penalty", "penalty_chance", "prob_penalty"],
      summary: "penalty_summary",
    },
  ];

  for (const rule of table) {
    const index = merged.findIndex((item) => item.id === rule.id);
    if (index < 0) {
      continue;
    }

    const fromObject = rule.keys
      .map((key) => Number(first[key]))
      .find((value) => Number.isFinite(value) && value >= 0);

    const fromListItem = payloadList.find((item) => {
      const row = item as Record<string, unknown>;
      return normalizeText(row.id ?? row.name ?? "", "") === rule.id;
    }) as Record<string, unknown> | undefined;

    const probability = Number(
      fromListItem?.probability ?? fromObject ?? merged[index].probability,
    );

    merged[index] = {
      ...merged[index],
      probability: Number.isFinite(probability)
        ? Math.max(0, Math.min(100, probability))
        : merged[index].probability,
      trend: normalizeTrend(fromListItem?.trend, merged[index].trend),
      summary: normalizeText(
        fromListItem?.summary ?? first[rule.summary],
        merged[index].summary,
      ),
      why: normalizeText(fromListItem?.why, merged[index].why),
    };
  }

  return merged;
}

export function adaptReplayPredictions(
  raw: unknown,
  fallback: Prediction[],
  context?: ReplayPredictionContext,
): Prediction[] {
  const fallbackById = new Map(fallback.map((item) => [item.id, item]));
  const getBasePrediction = (id: string, defaults: Prediction): Prediction => {
    const fromFallback = fallbackById.get(id);
    if (!fromFallback) {
      return defaults;
    }

    return {
      ...defaults,
      ...fromFallback,
    };
  };

  const item = (raw ?? {}) as Record<string, unknown>;
  const winner =
    ((item.winnerProbability as Record<string, unknown> | undefined)
      ?.probability as Record<string, unknown> | undefined) ?? {};
  const nextGoal =
    ((item.nextGoalProbability as Record<string, unknown> | undefined)
      ?.probability as Record<string, unknown> | undefined) ?? {};
  const card =
    ((item.cardRisk as Record<string, unknown> | undefined)?.probability as
      | Record<string, unknown>
      | undefined) ?? {};

  const mapped: Record<string, Prediction> = {
    "p-home-win": {
      ...getBasePrediction("p-home-win", {
        id: "p-home-win",
        name: `Vitoria de ${context?.homeTeamName ?? "time da casa"}`,
        probability: 0,
        confidence: "baixa",
        trend: "estavel",
        summary:
          "Ainda nao ha dados suficientes para estimar este indicador com confianca.",
        why: "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
      }),
      name: `Vitoria de ${context?.homeTeamName ?? "time da casa"}`,
      probability: toMinute(winner.home, 0),
      trend: normalizeTrend(
        (item.winnerProbability as Record<string, unknown> | undefined)?.trend,
        "estavel",
      ),
      summary: sanitizeModelText(
        (item.winnerProbability as Record<string, unknown> | undefined)
          ?.explanation,
        fallback.find((f) => f.id === "p-home-win")?.summary ??
          `Cenario atual favorece ${context?.homeTeamName ?? "o time da casa"} no desfecho.`,
      ),
      why: buildFactorsNarrative(
        (item.winnerProbability as Record<string, unknown> | undefined)
          ?.factors,
        fallback.find((f) => f.id === "p-home-win")?.why ?? "",
      ),
      confidence:
        toMinute(
          Number(
            (item.winnerProbability as Record<string, unknown> | undefined)
              ?.confidence,
          ) * 100,
          50,
        ) >= 70
          ? "alta"
          : toMinute(
                Number(
                  (
                    item.winnerProbability as
                      | Record<string, unknown>
                      | undefined
                  )?.confidence,
                ) * 100,
                50,
              ) >= 45
            ? "media"
            : "baixa",
    },
    "p-next-goal": {
      ...getBasePrediction("p-next-goal", {
        id: "p-next-goal",
        name: "Proximo gol nos proximos 10 min",
        probability: 0,
        confidence: "baixa",
        trend: "estavel",
        summary:
          "Ainda nao ha dados suficientes para estimar este indicador com confianca.",
        why: "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
      }),
      name: "Proximo gol nos proximos 10 min",
      probability: Math.max(
        toMinute(nextGoal.home, 0),
        toMinute(nextGoal.away, 0),
      ),
      trend: normalizeTrend(
        (item.nextGoalProbability as Record<string, unknown> | undefined)
          ?.trend,
        "estavel",
      ),
      summary: sanitizeModelText(
        (item.nextGoalProbability as Record<string, unknown> | undefined)
          ?.explanation,
        fallback.find((f) => f.id === "p-next-goal")?.summary ?? "",
      ),
      why: normalizeText(
        `${context?.homeTeamName ?? "Time da casa"} ${toMinute(nextGoal.home, 0)}%, ${context?.awayTeamName ?? "time visitante"} ${toMinute(nextGoal.away, 0)}% e sem gol ${toMinute(nextGoal.none, 0)}% no recorte curto.`,
        fallback.find((f) => f.id === "p-next-goal")?.why ?? "",
      ),
    },
    "p-card": {
      ...getBasePrediction("p-card", {
        id: "p-card",
        name: "Chance de cartao nos proximos 15 min",
        probability: 0,
        confidence: "baixa",
        trend: "estavel",
        summary:
          "Ainda nao ha dados suficientes para estimar este indicador com confianca.",
        why: "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
      }),
      name: "Chance de cartao nos proximos 15 min",
      probability: toMinute(card.total, toMinute(item.cardRisk as unknown, 0)),
      trend: normalizeTrend(
        (item.cardRisk as Record<string, unknown> | undefined)?.trend,
        "estavel",
      ),
      summary: sanitizeModelText(
        (item.cardRisk as Record<string, unknown> | undefined)?.explanation,
        fallback.find((f) => f.id === "p-card")?.summary ?? "",
      ),
      why: buildFactorsNarrative(
        (item.cardRisk as Record<string, unknown> | undefined)?.factors,
        fallback.find((f) => f.id === "p-card")?.why ?? "",
      ),
    },
    "p-comeback": {
      ...getBasePrediction("p-comeback", {
        id: "p-comeback",
        name: "Chance de empate ou virada",
        probability: 0,
        confidence: "baixa",
        trend: "estavel",
        summary:
          "Ainda nao ha dados suficientes para estimar este indicador com confianca.",
        why: "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
      }),
      name: "Chance de empate ou virada",
      probability: toMinute(
        (item.comebackChance as Record<string, unknown> | undefined)
          ?.probability,
        fallback.find((f) => f.id === "p-comeback")?.probability ?? 0,
      ),
      trend: normalizeTrend(
        (item.comebackChance as Record<string, unknown> | undefined)?.trend,
        "estavel",
      ),
      summary: sanitizeModelText(
        (item.comebackChance as Record<string, unknown> | undefined)
          ?.explanation,
        fallback.find((f) => f.id === "p-comeback")?.summary ?? "",
      ),
      why: normalizeText(
        `Equipe com maior chance de reagir: ${resolveComebackTeam(context)}.`,
        fallback.find((f) => f.id === "p-comeback")?.why ?? "",
      ),
    },
    "p-penalty": {
      ...getBasePrediction("p-penalty", {
        id: "p-penalty",
        name: "Chance de penalti",
        probability: 0,
        confidence: "baixa",
        trend: "estavel",
        summary:
          "Ainda nao ha dados suficientes para estimar este indicador com confianca.",
        why: "Informacoes insuficientes nesta partida para gerar esta leitura em tempo real.",
      }),
      name: "Chance de penalti",
      probability: toMinute(
        (item.penaltyRisk as Record<string, unknown> | undefined)?.probability,
        fallback.find((f) => f.id === "p-penalty")?.probability ?? 0,
      ),
      trend: normalizeTrend(
        (item.penaltyRisk as Record<string, unknown> | undefined)?.trend,
        "estavel",
      ),
      summary: sanitizeModelText(
        (item.penaltyRisk as Record<string, unknown> | undefined)?.explanation,
        fallback.find((f) => f.id === "p-penalty")?.summary ?? "",
      ),
      why: buildFactorsNarrative(
        (item.penaltyRisk as Record<string, unknown> | undefined)?.factors,
        fallback.find((f) => f.id === "p-penalty")?.why ?? "",
      ),
    },
  };

  const orderedIds = [
    "p-home-win",
    "p-next-goal",
    "p-card",
    "p-comeback",
    "p-penalty",
  ];

  return orderedIds
    .map((id) => mapped[id])
    .filter((row) => Number.isFinite(row.probability) && row.probability > 0)
    .map((row) => ({
      ...row,
      probability: Math.max(0, Math.min(100, row.probability)),
    }));
}

export function adaptTimeline(
  raw: unknown,
  fallback: TimelineEvent[],
): TimelineEvent[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback;
  }

  const normalized = raw
    .map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>;

      return {
        id: normalizeText(row.id, `timeline-${index}`),
        minute: toMinute(row.minute ?? row.time ?? row.elapsed, index + 1),
        type: "outro" as const,
        title: normalizeText(row.title ?? row.event, `Evento ${index + 1}`),
        description: normalizeText(
          row.description ?? row.commentary,
          "Atualizacao de contexto da partida.",
        ),
        impactLabel: normalizeText(
          row.impactLabel ?? row.impact,
          "Impacto moderado",
        ),
      };
    })
    .sort((a, b) => a.minute - b.minute);

  return normalized.length > 0 ? normalized : fallback;
}

export function adaptReplayTimeline(
  raw: unknown,
  fallback: TimelineEvent[],
): TimelineEvent[] {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const events = payload.events;

  if (!Array.isArray(events) || events.length === 0) {
    return fallback;
  }

  const normalized: TimelineEvent[] = events.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    const type = normalizeText(row.type, "outro") as TimelineEvent["type"];
    const eventType: TimelineEvent["type"] =
      type === "gol" ||
      type === "finalizacao" ||
      type === "cartao" ||
      type === "substituicao"
        ? type
        : "outro";

    return {
      id: normalizeText(row.id, `timeline-replay-${index}`),
      minute: toMinute(row.minute, index + 1),
      type: eventType,
      title: normalizeText(row.type, "Evento relevante"),
      description: normalizeText(row.description, "Sem descricao do evento."),
      impactLabel: normalizeText(row.impact, "Impacto moderado"),
    };
  });

  return normalized.sort((a, b) => a.minute - b.minute);
}

export function adaptReplayMomentum(
  raw: unknown,
  fallback: LiveMomentumSnapshot,
): LiveMomentumSnapshot {
  const item = (raw ?? {}) as Record<string, unknown>;
  const trendRaw = normalizeText(item.trend, "estavel");

  return {
    minute: toMinute(item.minute, fallback.minute),
    home: toMinute(item.homeMomentum ?? item.home, fallback.home),
    away: toMinute(item.awayMomentum ?? item.away, fallback.away),
    trend:
      trendRaw === "home_up"
        ? "subindo"
        : trendRaw === "away_up"
          ? "caindo"
          : normalizeTrend(trendRaw, fallback.trend),
    summary: sanitizeModelText(item.summary, fallback.summary),
  };
}

export function adaptUpcomingMatch(raw: unknown, index: number): Match {
  const item = (raw ?? {}) as Record<string, unknown>;
  const ts = Number(item.match_time ?? item.time ?? 0);
  const status = normalizeMatchStatus(item);
  const score = parseScore(item.score ?? item.ss);
  const minute =
    status === "live"
      ? toMinute(item.minute ?? item.played_time ?? item.elapsed, 0)
      : undefined;

  return {
    // Em /matches/upcoming do backend, `id` pode ser interno de banco;
    // para rota de detalhe usamos prioridade para external_id.
    id: String(item.external_id ?? item.id ?? `upcoming-${index}`),
    source: normalizeText(item.source, "local"),
    leagueName:
      String(
        item.league_name ?? (item.league as { name?: string })?.name ?? "Liga",
      ).trim() || "Liga",
    leagueCountry:
      typeof item.league_country === "string" ? item.league_country : undefined,
    phase: status,
    minute,
    status,
    isLive: status === "live",
    kickoffLabel:
      ts > 0
        ? new Date(ts * 1000).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Em breve",
    score,
    odds: parseMatchOdds(item),
    homeTeam: {
      id: extractTeamId(item.home, `h-u-${index}`, [
        item.home_id,
        item.home_team_external_id,
      ]),
      name: extractTeamName(item.homeTeam, "Time da casa", [
        item.home_team,
        item.home,
      ]),
    },
    awayTeam: {
      id: extractTeamId(item.away, `a-u-${index}`, [
        item.away_id,
        item.away_team_external_id,
      ]),
      name: extractTeamName(item.awayTeam, "Time visitante", [
        item.away_team,
        item.away,
      ]),
    },
    miniInsight:
      "Pre-jogo em preparacao: tendencias iniciais serao atualizadas com sinais de escalao e forma recente.",
  };
}

export function attachMatchToAnalysis(
  base: MatchAnalysisBundle,
  match: Match,
): MatchAnalysisBundle {
  return {
    ...base,
    match,
  };
}
