export interface ReplayLiveMatchDto {
  id: string;
  source?: string;
  status: string;
  competition: string;
  matchDate: string;
  kickoff: string;
  minute: number;
  homeTeam: string;
  awayTeam: string;
  score: {
    home: number;
    away: number;
  };
  odds?: {
    homeOdds: number;
    drawOdds: number;
    awayOdds: number;
    market?: string;
    source?: string;
    bookmaker?: string;
    updatedAt?: string;
  };
  updatedAt?: string;
  miniInsight: string;
}

export interface ReplayLiveResponseDto {
  source: string;
  updatedAt?: string;
  minute: number;
  matches: ReplayLiveMatchDto[];
}

export interface ReplayMomentumDto {
  matchId?: string;
  source?: string;
  mode?: string;
  status?: string;
  updatedAt?: string;
  minute: number;
  homeTeam: string;
  awayTeam: string;
  homeMomentum: number;
  awayMomentum: number;
  trend: string;
  summary: string;
}

export interface ReplayTimelineEventDto {
  id: string;
  minute: number;
  team: string;
  type: string;
  impact: string;
  description: string;
}

export interface ReplayTimelineDto {
  matchId: string;
  source?: string;
  mode?: string;
  status?: string;
  updatedAt?: string;
  minute: number;
  events: ReplayTimelineEventDto[];
}

export interface ReplayPredictionsDto {
  matchId: string;
  source?: string;
  mode?: string;
  status?: string;
  updatedAt?: string;
  minute?: number;
  homeTeam?: string;
  awayTeam?: string;
  odds?: {
    homeOdds?: number | null;
    drawOdds?: number | null;
    awayOdds?: number | null;
    market?: string;
    source?: string;
    bookmaker?: string;
    updatedAt?: string;
  };
  winnerProbability?: Record<string, unknown>;
  nextGoalProbability?: Record<string, unknown>;
  cardRisk?: Record<string, unknown>;
  comebackChance?: Record<string, unknown>;
  penaltyRisk?: Record<string, unknown>;
}

export interface ReplayPreMatchDto {
  matchId: string;
  source?: string;
  mode?: string;
  status?: string;
  updatedAt?: string;
  minute?: number;
  homeTeam: string;
  awayTeam: string;
  homeForm: string;
  awayForm: string;
  h2hSummary: string;
  interpretation: string;
  averages?: Record<string, unknown>;
  headToHead?: Array<Record<string, unknown>>;
}
