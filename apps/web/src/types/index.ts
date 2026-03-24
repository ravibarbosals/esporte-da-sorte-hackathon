export type ConfidenceLevel = "baixa" | "media" | "alta";

export type TrendDirection = "subindo" | "estavel" | "caindo";

export type MatchStatus = "live" | "upcoming" | "finished";

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  rank?: number;
  recentForm?: Array<"V" | "E" | "D">;
}

export interface Match {
  id: string;
  leagueName: string;
  leagueCountry?: string;
  minute?: number;
  status: MatchStatus;
  isLive: boolean;
  kickoffLabel: string;
  score: {
    home: number;
    away: number;
  };
  homeTeam: Team;
  awayTeam: Team;
  miniInsight: string;
}

export interface Prediction {
  id: string;
  name: string;
  probability: number;
  confidence: ConfidenceLevel;
  trend: TrendDirection;
  summary: string;
  why: string;
}

export interface Scenario {
  id: string;
  title: string;
  probability: number;
  explanation: string;
  whatCanChange: string;
}

export interface Insight {
  id: string;
  title: string;
  text: string;
  tone: "positivo" | "alerta" | "neutro";
}

export interface TimelineEvent {
  id: string;
  minute: number;
  type:
    | "substituicao"
    | "finalizacao"
    | "cartao"
    | "pressao"
    | "variacao"
    | "gol"
    | "outro";
  title: string;
  description: string;
  impactLabel: string;
}

export interface ModelFactor {
  id: string;
  label: string;
  value: number;
  direction: "positivo" | "negativo" | "neutro";
  description: string;
}

export interface KeyPlayer {
  id: string;
  name: string;
  team: string;
  role:
    | "participacao_em_gol"
    | "risco_disciplinar"
    | "impacto_ofensivo"
    | "impacto_defensivo";
  probability: number;
  summary: string;
}

export interface LiveMomentumSnapshot {
  minute: number;
  home: number;
  away: number;
  trend: TrendDirection;
  summary: string;
}

export interface PreMatchAnalysis {
  matchId: string;
  homeForm: string;
  awayForm: string;
  h2hSummary: string;
  offensiveTrend: string;
  defensiveTrend: string;
  keyPlayers: string[];
  initialProbabilities: Array<{
    label: string;
    probability: number;
  }>;
  interpretation: string;
}

export interface TeamComparison {
  title: string;
  homeValue: number;
  awayValue: number;
  unit?: string;
}

export interface ModelExplanationSection {
  id: string;
  title: string;
  content: string;
  bullets: string[];
}

export interface MatchAnalysisBundle {
  match: Match;
  headlineInsight: Insight;
  recentContext: string;
  winnerProbabilities: {
    home: number;
    draw: number;
    away: number;
  };
  momentum: LiveMomentumSnapshot;
  predictions: Prediction[];
  factors: ModelFactor[];
  timeline: TimelineEvent[];
  scenarios: Scenario[];
  keyPlayers: KeyPlayer[];
  teamComparisons: TeamComparison[];
  textualInsights: Insight[];
}
