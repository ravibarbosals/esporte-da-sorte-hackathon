import {
  Match,
  MatchAnalysisBundle,
  ModelExplanationSection,
  PreMatchAnalysis,
} from "@/types";

export const liveMatchesMock: Match[] = [
  {
    id: "laliga-7781",
    leagueName: "LaLiga",
    leagueCountry: "Espanha",
    minute: 67,
    status: "live",
    isLive: true,
    kickoffLabel: "21:00",
    score: { home: 1, away: 0 },
    homeTeam: { id: "rma", name: "Real Madrid", shortName: "RMA" },
    awayTeam: { id: "atm", name: "Atletico de Madrid", shortName: "ATM" },
    miniInsight:
      "O mandante cresceu nos ultimos 8 minutos e acelera pelo corredor esquerdo.",
  },
  {
    id: "seriea-5542",
    leagueName: "Serie A",
    leagueCountry: "Italia",
    minute: 54,
    status: "live",
    isLive: true,
    kickoffLabel: "20:45",
    score: { home: 0, away: 0 },
    homeTeam: { id: "rom", name: "Roma", shortName: "ROM" },
    awayTeam: { id: "laz", name: "Lazio", shortName: "LAZ" },
    miniInsight:
      "Jogo travado, baixa producao ofensiva e alto risco disciplinar no meio-campo.",
  },
  {
    id: "epl-9912",
    leagueName: "Premier League",
    leagueCountry: "Inglaterra",
    minute: 73,
    status: "live",
    isLive: true,
    kickoffLabel: "19:30",
    score: { home: 2, away: 1 },
    homeTeam: { id: "ars", name: "Arsenal", shortName: "ARS" },
    awayTeam: { id: "new", name: "Newcastle", shortName: "NEW" },
    miniInsight:
      "Alta chance de cartao no fim: pressao visitante e linha defensiva esticada.",
  },
  {
    id: "br-4021",
    leagueName: "Brasileirao",
    leagueCountry: "Brasil",
    minute: 36,
    status: "live",
    isLive: true,
    kickoffLabel: "18:00",
    score: { home: 0, away: 1 },
    homeTeam: { id: "pal", name: "Palmeiras", shortName: "PAL" },
    awayTeam: { id: "fla", name: "Flamengo", shortName: "FLA" },
    miniInsight:
      "Visitante em transicao rapida; mandante tenta responder com volume pelo centro.",
  },
];

export const upcomingMatchesMock: Match[] = [
  {
    id: "ucl-203",
    leagueName: "Champions League",
    leagueCountry: "Europa",
    status: "upcoming",
    isLive: false,
    kickoffLabel: "Amanh\u00e3, 16:00",
    score: { home: 0, away: 0 },
    homeTeam: { id: "bay", name: "Bayern", shortName: "BAY" },
    awayTeam: { id: "mci", name: "Man City", shortName: "MCI" },
    miniInsight:
      "Pre-jogo com expectativa de alta intensidade e volume de finalizacoes.",
  },
  {
    id: "lib-900",
    leagueName: "Libertadores",
    leagueCountry: "America do Sul",
    status: "upcoming",
    isLive: false,
    kickoffLabel: "Hoje, 22:00",
    score: { home: 0, away: 0 },
    homeTeam: { id: "flu", name: "Fluminense", shortName: "FLU" },
    awayTeam: { id: "boc", name: "Boca Juniors", shortName: "BOC" },
    miniInsight:
      "Confronto tende a alternar dominio territorial e bolas paradas decisivas.",
  },
];

const baseAnalysis: MatchAnalysisBundle = {
  match: liveMatchesMock[0],
  headlineInsight: {
    id: "i-main",
    title: "Mandante mais perto de vencer",
    text: "O mandante cresceu nos ultimos 10 minutos e criou tres entradas perigosas na area.",
    tone: "positivo",
  },
  recentContext:
    "A chance de gol aumentou com a pressao recente: 6 acoes no ultimo terco e 2 finalizacoes no alvo desde os 58'.",
  winnerProbabilities: {
    home: 58,
    draw: 27,
    away: 15,
  },
  momentum: {
    minute: 67,
    home: 71,
    away: 29,
    trend: "subindo",
    summary: "Pressao alta do mandante com recuperacao rapida apos perda.",
  },
  predictions: [
    {
      id: "p-home-win",
      name: "Vitoria do mandante",
      probability: 58,
      confidence: "alta",
      trend: "subindo",
      summary: "Controle territorial e volume de acoes ofensivas em alta.",
      why: "xG recente superior e adversario recuado.",
    },
    {
      id: "p-next-goal",
      name: "Proximo gol nos proximos 10 min",
      probability: 41,
      confidence: "media",
      trend: "subindo",
      summary:
        "Sequencia de finalizacoes elevou o risco para a defesa visitante.",
      why: "2 finalizacoes no alvo em 6 minutos.",
    },
    {
      id: "p-card",
      name: "Chance de cartao nos proximos 15 min",
      probability: 49,
      confidence: "media",
      trend: "estavel",
      summary:
        "Jogo mais fisico no corredor esquerdo com disputas consecutivas.",
      why: "Faltas acumuladas e um defensor ja amarelado.",
    },
    {
      id: "p-comeback",
      name: "Chance de empate ou virada",
      probability: 24,
      confidence: "baixa",
      trend: "caindo",
      summary:
        "Visitante perdeu intensidade e conecta menos passes no ultimo terco.",
      why: "Menos transicoes perigosas apos os 60'.",
    },
    {
      id: "p-penalty",
      name: "Chance de penalti",
      probability: 18,
      confidence: "baixa",
      trend: "estavel",
      summary:
        "Entrada frequente na area aumenta contato, mas sem padrao de risco alto.",
      why: "Poucos duelos diretos dentro da pequena area.",
    },
  ],
  factors: [
    {
      id: "f-press",
      label: "Pressao ofensiva",
      value: 86,
      direction: "positivo",
      description: "Mandante recupera a bola em media 6s apos perda.",
    },
    {
      id: "f-xg",
      label: "xG recente",
      value: 73,
      direction: "positivo",
      description: "Ultimos 12 minutos com maior qualidade de finalizacao.",
    },
    {
      id: "f-possession-third",
      label: "Posse no ultimo terco",
      value: 68,
      direction: "positivo",
      description: "Equipe da casa ocupa melhor as entrelinhas ofensivas.",
    },
    {
      id: "f-shots-target",
      label: "Finalizacoes no alvo",
      value: 62,
      direction: "positivo",
      description: "Visitante permite chute limpo na entrada da area.",
    },
    {
      id: "f-corners",
      label: "Escanteios recentes",
      value: 54,
      direction: "neutro",
      description:
        "Bolas paradas elevam perigo, mas sem grande variacao de xG.",
    },
    {
      id: "f-fouls",
      label: "Faltas acumuladas",
      value: 61,
      direction: "negativo",
      description:
        "Risco disciplinar aumenta para o visitante no segundo tempo.",
    },
  ],
  timeline: [
    {
      id: "t-55",
      minute: 55,
      type: "substituicao",
      title: "Substituicao ofensiva aumenta agressividade",
      description:
        "Entrada de atacante de profundidade acelerou corridas nas costas da zaga.",
      impactLabel: "Impacto medio",
    },
    {
      id: "t-59",
      minute: 59,
      type: "finalizacao",
      title: "Duas finalizacoes em sequencia",
      description:
        "Sequencia de ataques elevou a chance de gol no curto prazo.",
      impactLabel: "Impacto alto",
    },
    {
      id: "t-63",
      minute: 63,
      type: "cartao",
      title: "Amarelo para defensor visitante",
      description:
        "Duelo individual passou a ter maior risco de nova infracao.",
      impactLabel: "Alerta disciplinar",
    },
    {
      id: "t-66",
      minute: 66,
      type: "variacao",
      title: "Queda de intensidade visitante",
      description:
        "Menor presenca no campo de ataque e menos progressao com bola.",
      impactLabel: "Impacto medio",
    },
  ],
  scenarios: [
    {
      id: "s-1",
      title: "Vitoria por 1 gol",
      probability: 44,
      explanation: "Mandante sustenta volume e controla transicoes no fim.",
      whatCanChange:
        "Uma substituicao com mais velocidade no visitante pode reequilibrar.",
    },
    {
      id: "s-2",
      title: "Empate com gol tardio",
      probability: 21,
      explanation: "Visitante ganha folego final e explora bola parada.",
      whatCanChange:
        "Se o mandante mantiver pressao, este cenario perde forca.",
    },
    {
      id: "s-3",
      title: "Ampliacao do placar ate os 80'",
      probability: 29,
      explanation:
        "Pressao alta e recuperacao no terco ofensivo favorecem novo gol.",
      whatCanChange: "Queda fisica ou ajuste defensivo do visitante.",
    },
  ],
  keyPlayers: [
    {
      id: "kp-1",
      name: "Vinicius Jr.",
      team: "Real Madrid",
      role: "participacao_em_gol",
      probability: 47,
      summary: "Aparece livre no corredor e gera superioridade em duelos.",
    },
    {
      id: "kp-2",
      name: "Savic",
      team: "Atletico de Madrid",
      role: "risco_disciplinar",
      probability: 39,
      summary: "Ja amarelado e sobrecarregado em transicoes defensivas.",
    },
    {
      id: "kp-3",
      name: "Bellingham",
      team: "Real Madrid",
      role: "impacto_ofensivo",
      probability: 52,
      summary: "Conecta setor criativo com entradas em area no tempo certo.",
    },
    {
      id: "kp-4",
      name: "Gimenez",
      team: "Atletico de Madrid",
      role: "impacto_defensivo",
      probability: 41,
      summary: "Lidera cortes e protege area em cruzamentos.",
    },
  ],
  teamComparisons: [
    { title: "xG acumulado", homeValue: 1.62, awayValue: 0.81, unit: "" },
    { title: "Finalizacoes no alvo", homeValue: 6, awayValue: 3 },
    { title: "Posse no ultimo terco", homeValue: 64, awayValue: 36, unit: "%" },
    { title: "Escanteios", homeValue: 7, awayValue: 3 },
  ],
  textualInsights: [
    {
      id: "ti-1",
      title: "Leitura de momento",
      text: "Confianca media-alta: o volume ofensivo cresceu, e a defesa visitante cede mais espacos entre linhas.",
      tone: "positivo",
    },
    {
      id: "ti-2",
      title: "Risco de oscilacao",
      text: "Se o mandante reduzir pressao pos-perda, a chance de empate volta a subir rapidamente.",
      tone: "alerta",
    },
  ],
};

export const matchAnalysisByIdMock: Record<string, MatchAnalysisBundle> = {
  [baseAnalysis.match.id]: baseAnalysis,
  [liveMatchesMock[1].id]: {
    ...baseAnalysis,
    match: liveMatchesMock[1],
    momentum: {
      minute: 54,
      home: 48,
      away: 52,
      trend: "estavel",
      summary: "Equilibrio de territorio com baixa qualidade de chances.",
    },
    headlineInsight: {
      id: "i-roma-lazio",
      title: "Empate com baixa margem de erro",
      text: "As equipes criam pouco e priorizam transicao defensiva.",
      tone: "neutro",
    },
  },
  [liveMatchesMock[2].id]: {
    ...baseAnalysis,
    match: liveMatchesMock[2],
    momentum: {
      minute: 73,
      home: 56,
      away: 44,
      trend: "estavel",
      summary: "Jogo franco com risco alto de contra-ataque.",
    },
  },
  [liveMatchesMock[3].id]: {
    ...baseAnalysis,
    match: liveMatchesMock[3],
    momentum: {
      minute: 36,
      home: 43,
      away: 57,
      trend: "subindo",
      summary: "Visitante mais vertical e eficiente na transicao.",
    },
  },
};

export const preMatchAnalysisMock: PreMatchAnalysis[] = [
  {
    matchId: "ucl-203",
    homeForm: "V-V-E-V-D",
    awayForm: "V-V-V-E-V",
    h2hSummary: "Ultimos 5 confrontos: 2 vitorias BAY, 2 MCI e 1 empate.",
    offensiveTrend: "Ambos acima de 1.8 xG medio nos ultimos jogos.",
    defensiveTrend: "MCI sofre menos finalizacoes no alvo por partida.",
    keyPlayers: ["Kane", "Musiala", "Haaland", "Foden"],
    initialProbabilities: [
      { label: "Vitoria Bayern", probability: 34 },
      { label: "Empate", probability: 26 },
      { label: "Vitoria City", probability: 40 },
    ],
    interpretation:
      "Confronto de alta intensidade com vantagem leve do visitante pela consistencia defensiva recente.",
  },
  {
    matchId: "lib-900",
    homeForm: "V-E-V-D-V",
    awayForm: "E-V-D-V-E",
    h2hSummary:
      "Historico curto e equilibrado, com gols em 4 dos ultimos 5 jogos.",
    offensiveTrend:
      "Fluminense acelera posse no ultimo terco; Boca e forte em bola parada.",
    defensiveTrend:
      "Ambos os times alternam blocos medio e baixo conforme o contexto.",
    keyPlayers: ["Arias", "Cano", "Cavani", "Medina"],
    initialProbabilities: [
      { label: "Vitoria Fluminense", probability: 39 },
      { label: "Empate", probability: 33 },
      { label: "Vitoria Boca", probability: 28 },
    ],
    interpretation:
      "Partida de detalhes com cenario de empate forte, mas com janela para gol tardio em transicao ou bola parada.",
  },
];

export const modelExplanationMock: ModelExplanationSection[] = [
  {
    id: "m-1",
    title: "Quais sinais entram no calculo",
    content:
      "O modelo combina sinais de contexto recente da partida com historico e comportamento tatico das equipes.",
    bullets: [
      "Pressao ofensiva e recuperacao pos-perda",
      "xG recente e qualidade das finalizacoes",
      "Posse no ultimo terco e superioridade territorial",
      "Ritmo disciplinar: faltas e cartoes",
    ],
  },
  {
    id: "m-2",
    title: "Heuristica, estatistica e previsao",
    content:
      "Heuristicas ajudam a interpretar padroes taticos; estatistica quantifica tendencia; previsao combina ambos em probabilidade.",
    bullets: [
      "Heuristica: leitura de contexto de jogo",
      "Estatistica: frequencia e distribuicao historica",
      "Previsao: probabilidade dinamica atualizada",
    ],
  },
  {
    id: "m-3",
    title: "O que significa confianca",
    content:
      "Confianca indica robustez dos sinais disponiveis no momento, nao certeza de resultado.",
    bullets: [
      "Alta: sinais convergentes e consistentes",
      "Media: sinais mistos com tendencia clara",
      "Baixa: contexto volatil ou pouco sinal",
    ],
  },
  {
    id: "m-4",
    title: "Transparencia de dados",
    content:
      "Utilizamos dados consolidados de eventos, desempenho e mercado para interpretar cenarios.",
    bullets: [
      "Eventos da partida em tempo quase real",
      "Historico recente de equipes e jogadores",
      "Indicadores enriquecidos por modelo interno",
      "O sistema interpreta dados, nao garante resultados",
    ],
  },
];
