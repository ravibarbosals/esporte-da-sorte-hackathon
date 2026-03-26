import { AnalysisData, HeadToHeadMatch } from "@/types/analysis";

export const mockAnalysisData: AnalysisData = {
  homeTeam: {
    name: "Brasil",
    shortName: "BRA",
    flagEmoji: "🇧🇷",
    color: "#009C3B",
  },
  awayTeam: {
    name: "Franca",
    shortName: "FRA",
    flagEmoji: "🇫🇷",
    color: "#002395",
  },
  h2h: [
    {
      date: "27/03/2024",
      competition: "Amistoso Internacional",
      homeTeam: "Brasil",
      awayTeam: "Franca",
      homeScore: 3,
      awayScore: 3,
    },
    {
      date: "26/09/2021",
      competition: "Amistoso Internacional",
      homeTeam: "Franca",
      awayTeam: "Brasil",
      homeScore: 1,
      awayScore: 1,
    },
    {
      date: "09/11/2017",
      competition: "Amistoso Internacional",
      homeTeam: "Franca",
      awayTeam: "Brasil",
      homeScore: 3,
      awayScore: 1,
    },
    {
      date: "28/03/2015",
      competition: "Amistoso Internacional",
      homeTeam: "Franca",
      awayTeam: "Brasil",
      homeScore: 1,
      awayScore: 3,
    },
    {
      date: "26/06/2006",
      competition: "Copa do Mundo 2006",
      homeTeam: "Brasil",
      awayTeam: "Franca",
      homeScore: 0,
      awayScore: 1,
    },
  ],
  homeForm: [
    { match: "vs ARG", result: "W", score: "2-1" },
    { match: "vs URU", result: "W", score: "1-0" },
    { match: "vs COL", result: "D", score: "1-1" },
    { match: "vs CHI", result: "W", score: "3-0" },
    { match: "vs VEN", result: "W", score: "2-0" },
  ],
  awayForm: [
    { match: "vs ESP", result: "W", score: "2-0" },
    { match: "vs ALE", result: "L", score: "0-1" },
    { match: "vs BEL", result: "W", score: "3-1" },
    { match: "vs ITA", result: "D", score: "2-2" },
    { match: "vs POR", result: "W", score: "1-0" },
  ],
  oddType: "Vitoria Casa",
  oddValue: "2.90",
  confidence: 62,
  analystNote:
    "Dados de demonstracao para modo fallback. Conecte a API para leitura ao vivo.",
};

export function getH2HStats(matches: HeadToHeadMatch[], teamName: string) {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let totalGoals = 0;
  let over25 = 0;
  let btts = 0;

  matches.forEach((m) => {
    const isHome = m.homeTeam === teamName;
    const tf = isHome ? m.homeScore : m.awayScore;
    const to = isHome ? m.awayScore : m.homeScore;

    if (tf > to) wins += 1;
    else if (tf === to) draws += 1;
    else losses += 1;

    totalGoals += m.homeScore + m.awayScore;
    if (m.homeScore + m.awayScore > 2) over25 += 1;
    if (m.homeScore > 0 && m.awayScore > 0) btts += 1;
  });

  return {
    wins,
    draws,
    losses,
    avgGoals: matches.length ? (totalGoals / matches.length).toFixed(1) : "0.0",
    over25Pct: matches.length ? Math.round((over25 / matches.length) * 100) : 0,
    bttsPct: matches.length ? Math.round((btts / matches.length) * 100) : 0,
  };
}

export function getMatchResult(
  match: HeadToHeadMatch,
  teamName: string,
): "W" | "D" | "L" {
  const isHome = match.homeTeam === teamName;
  const tf = isHome ? match.homeScore : match.awayScore;
  const to = isHome ? match.awayScore : match.homeScore;

  if (tf > to) return "W";
  if (tf === to) return "D";
  return "L";
}
