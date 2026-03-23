import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

// --- INSIGHTS ---
export const getInsights = async () => {
  const { data } = await api.get("/insights");
  return data;
};

export const getInsightPhrases = async () => {
  const { data } = await api.get("/insights/frases");
  return data;
};

// --- PLAYERS ---
export const getTopScorers = async (limit = 10) => {
  const { data } = await api.get(`/players/top-scorers?limit=${limit}`);
  return data;
};

export const getPlayerProfile = async (name: string) => {
  const { data } = await api.get(`/players/${encodeURIComponent(name)}`);
  return data;
};

export const getSquadPlayers = async (time: string) => {
  const { data } = await api.get(`/players/time/${encodeURIComponent(time)}`);
  return data;
};

// --- TEAMS ---
export const getTeams = async () => {
  const { data } = await api.get("/teams");
  return data;
};

export const getTeamByLeague = async (comp: string) => {
  const { data } = await api.get(`/teams/league/${encodeURIComponent(comp)}`);
  return data;
};

export const getTeamByName = async (name: string) => {
  const { data } = await api.get(`/teams/${encodeURIComponent(name)}`);
  return data;
};

export const getMostAggressiveTeams = async (limit = 10) => {
  const { data } = await api.get(`/teams/most-aggressive?limit=${limit}`);
  return data;
};

export const getTopScoringTeams = async (limit = 10) => {
  const { data } = await api.get(`/teams/top-scoring?limit=${limit}`);
  return data;
};

// --- MATCHES ---
export const getUpcomingMatches = async () => {
  const { data } = await api.get("/matches/upcoming");
  return data;
};

export const getLiveMatches = async () => {
  const { data } = await api.get("/matches/live");
  return data;
};

export const getMatchesByTeam = async (team: string) => {
  const { data } = await api.get(`/matches/team/${encodeURIComponent(team)}`);
  return data;
};

// --- PREDICTIONS ---
export const getMatchPrediction = async (home: string, away: string) => {
  const { data } = await api.get(
    `/predictions/${encodeURIComponent(home)}/${encodeURIComponent(away)}`,
  );
  return data;
};

export const getMatchIndicators = async (home: string, away: string) => {
  const { data } = await api.get(
    `/predictions/${encodeURIComponent(home)}/${encodeURIComponent(away)}/indicators`,
  );
  return data;
};

export const getFullAnalysis = async (home: string, away: string) => {
  const { data } = await api.get(
    `/predictions/${encodeURIComponent(home)}/${encodeURIComponent(away)}/full`,
  );
  return data;
};

export default api;
