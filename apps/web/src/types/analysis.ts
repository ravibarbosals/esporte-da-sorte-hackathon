export interface AnalysisTeam {
  name: string;
  shortName: string;
  logo?: string;
  flagEmoji?: string;
  color: string;
}

export interface HeadToHeadMatch {
  date: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  stadium?: string;
}

export interface TeamForm {
  match: string;
  result: "W" | "D" | "L";
  score: string;
}

export interface AnalysisData {
  homeTeam: AnalysisTeam;
  awayTeam: AnalysisTeam;
  h2h: HeadToHeadMatch[];
  homeForm: TeamForm[];
  awayForm: TeamForm[];
  oddType: string;
  oddValue: string;
  confidence: number;
  analystNote: string;
}
