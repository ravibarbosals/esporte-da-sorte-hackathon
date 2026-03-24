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
  source?: string;
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
  updatedAt?: string;
  minute: number;
  events: ReplayTimelineEventDto[];
}
