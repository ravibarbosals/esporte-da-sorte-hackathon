export interface Player {
  player: string;
  squad: string;
  comp: string;
  pos: string;
  age: number;
  gols: number;
  assists: number;
  cartoes_amarelos: number;
  cartoes_vermelhos: number;
  minutos: number;
  chutes: number;
  chutes_no_alvo: number;
  gols_por_90: number;
}

export interface Team {
  id: number;
  name: string;
  comp: string;
  total_yellow_cards: number;
  total_red_cards: number;
  avg_yellow_cards: number;
  avg_goals: number;
  avg_assists: number;
}

export interface Match {
  id: number;
  external_id: string;
  bet365_id: string;
  home_team: string;
  away_team: string;
  league_name: string;
  league_country: string;
  match_time: string;
  time_status: string;
  score: string;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  extra: {
    round?: number;
    stadium_data?: {
      name: string;
      city: string;
      country: string;
    };
    home_pos?: string;
    away_pos?: string;
  };
}

export interface Prediction {
  home_team: string;
  away_team: string;
  home_win: number;
  draw: number;
  away_win: number;
  xg_home: number;
  xg_away: number;
}

export interface Indicators {
  home: {
    team: string;
    inconsistency: number;
    fatigue: number;
    reaction_index: number;
    offensive_efficiency: number;
    defensive_efficiency: number;
    avg_goals_for: number;
    avg_goals_against: number;
  };
  away: {
    team: string;
    inconsistency: number;
    fatigue: number;
    reaction_index: number;
    offensive_efficiency: number;
    defensive_efficiency: number;
    avg_goals_for: number;
    avg_goals_against: number;
  };
  h2h: {
    team_a_win_rate: number;
    team_b_win_rate: number;
    avg_total_goals: number;
    total_encounters: number;
  };
}

export interface FullAnalysis {
  prediction: Prediction;
  indicators: Indicators;
  generated_at: string;
}

export interface Insight {
  id: number;
  type: string;
  title: string;
  description: string;
  data: object;
  created_at: string;
}