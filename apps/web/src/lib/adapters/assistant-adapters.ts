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

function normalizeTrend(
  value: unknown,
  fallback: TrendDirection,
): TrendDirection {
  if (value === "subindo" || value === "estavel" || value === "caindo") {
    return value;
  }
  return fallback;
}

function normalizeMatchStatus(raw: Record<string, unknown>): Match["status"] {
  const statusValue = String(raw.time_status ?? raw.status ?? "").toLowerCase();

  if (
    statusValue === "1" ||
    statusValue.includes("live") ||
    statusValue.includes("inplay") ||
    statusValue.includes("running")
  ) {
    return "live";
  }

  if (
    statusValue === "3" ||
    statusValue.includes("finished") ||
    statusValue.includes("ended")
  ) {
    return "finished";
  }

  return "upcoming";
}

function parseScore(score: unknown): { home: number; away: number } {
  if (typeof score === "string" && score.includes("-")) {
    const [homeRaw, awayRaw] = score.split("-").map((v) => Number(v.trim()));
    return {
      home: Number.isFinite(homeRaw) ? homeRaw : 0,
      away: Number.isFinite(awayRaw) ? awayRaw : 0,
    };
  }

  if (score && typeof score === "object") {
    const maybeScore = score as { home?: unknown; away?: unknown };
    return {
      home: Number(maybeScore.home) || 0,
      away: Number(maybeScore.away) || 0,
    };
  }

  return { home: 0, away: 0 };
}

export function adaptLiveMatch(raw: unknown, index: number): Match {
  const item = (raw ?? {}) as Record<string, unknown>;
  const ts = Number(item.match_time ?? item.time ?? 0);
  const minute = Number(item.minute ?? 0);
  const score = parseScore(item.score);

  return {
    id: String(item.id ?? `live-${index}`),
    leagueName:
      String(
        item.league_name ?? (item.league as { name?: string })?.name ?? "Liga",
      ).trim() || "Liga",
    leagueCountry:
      typeof item.league_country === "string" ? item.league_country : undefined,
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
    homeTeam: {
      id: String(item.home_id ?? `h-${index}`),
      name: String(
        item.home_team ??
          (item.home as { name?: string })?.name ??
          "Time da casa",
      ),
    },
    awayTeam: {
      id: String(item.away_id ?? `a-${index}`),
      name: String(
        item.away_team ??
          (item.away as { name?: string })?.name ??
          "Time visitante",
      ),
    },
    miniInsight:
      "Leitura em andamento: aguardando consolidacao completa do contexto recente.",
  };
}

export function adaptLiveReplayMatch(raw: unknown, index: number): Match {
  const item = (raw ?? {}) as Record<string, unknown>;
  const score = parseScore(item.score);
  const minute = toMinute(item.minute, 67);

  return {
    id: String(item.id ?? `live-replay-${index}`),
    leagueName: normalizeText(item.competition, "StatsBomb Replay"),
    status: "live",
    isLive: true,
    minute,
    kickoffLabel: normalizeText(item.kickoff, "Replay"),
    score,
    homeTeam: {
      id: String(item.id ?? `h-r-${index}`),
      name: normalizeText(item.homeTeam, "Time da casa"),
    },
    awayTeam: {
      id: String(item.id ?? `a-r-${index}`),
      name: normalizeText(item.awayTeam, "Time visitante"),
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
    leagueName: normalizeText(
      item.league_name ?? (item.league as { name?: string })?.name,
      fallback.leagueName,
    ),
    leagueCountry:
      typeof item.league_country === "string"
        ? item.league_country
        : fallback.leagueCountry,
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
    score: parseScore(item.score ?? item.result ?? fallback.score),
    homeTeam: {
      id: String(item.home_id ?? fallback.homeTeam.id),
      name: normalizeText(
        item.home_team ?? (item.home as { name?: string })?.name,
        fallback.homeTeam.name,
      ),
    },
    awayTeam: {
      id: String(item.away_id ?? fallback.awayTeam.id),
      name: normalizeText(
        item.away_team ?? (item.away as { name?: string })?.name,
        fallback.awayTeam.name,
      ),
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
    leagueName: normalizeText(competition.name, fallback.leagueName),
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
      id: String(homeTeam.id ?? fallback.homeTeam.id),
      name: normalizeText(homeTeam.name, fallback.homeTeam.name),
    },
    awayTeam: {
      id: String(awayTeam.id ?? fallback.awayTeam.id),
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
      ...fallback.find((f) => f.id === "p-home-win")!,
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
      ...fallback.find((f) => f.id === "p-next-goal")!,
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
      ...fallback.find((f) => f.id === "p-card")!,
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
      ...fallback.find((f) => f.id === "p-comeback")!,
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
      ...fallback.find((f) => f.id === "p-penalty")!,
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

  return fallback.map(
    (itemFallback) => mapped[itemFallback.id] ?? itemFallback,
  );
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
    home: toMinute(item.homeMomentum, fallback.home),
    away: toMinute(item.awayMomentum, fallback.away),
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

  return {
    id: String(item.id ?? `upcoming-${index}`),
    leagueName:
      String(
        item.league_name ?? (item.league as { name?: string })?.name ?? "Liga",
      ).trim() || "Liga",
    leagueCountry:
      typeof item.league_country === "string" ? item.league_country : undefined,
    status: "upcoming",
    isLive: false,
    kickoffLabel:
      ts > 0
        ? new Date(ts * 1000).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Em breve",
    score: { home: 0, away: 0 },
    homeTeam: {
      id: String(item.home_id ?? `h-u-${index}`),
      name: String(
        item.home_team ??
          (item.home as { name?: string })?.name ??
          "Time da casa",
      ),
    },
    awayTeam: {
      id: String(item.away_id ?? `a-u-${index}`),
      name: String(
        item.away_team ??
          (item.away as { name?: string })?.name ??
          "Time visitante",
      ),
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
