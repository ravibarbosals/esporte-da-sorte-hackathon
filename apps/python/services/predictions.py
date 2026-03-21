import duckdb
from scipy.stats import poisson
import statistics

def calc_team_strength(team, matches_recentes=5):
    """Calcula força do time baseado em desempenho recente (Nível 1)"""
    con = duckdb.connect()
    con.execute("""
        CREATE TABLE matches AS 
        SELECT * FROM read_json_auto('data/raw/matches_laliga.json')
    """)
    
    # Últimas 5 partidas
    recent = con.execute(f"""
        SELECT 
            home_score, away_score,
            home_team.home_team_name as home_team,
            away_team.away_team_name as away_team
        FROM matches
        WHERE home_team.home_team_name = '{team}' 
           OR away_team.away_team_name = '{team}'
        ORDER BY match_date DESC
        LIMIT {matches_recentes}
    """).fetchall()
    
    if not recent:
        return 1.0  # Default se não houver histórico
    
    gols_marcados = []
    gols_sofridos = []
    
    for match in recent:
        home_team, away_team = match[2], match[3]
        home_score, away_score = match[0], match[1]
        
        if home_team == team:
            gols_marcados.append(home_score)
            gols_sofridos.append(away_score)
        else:
            gols_marcados.append(away_score)
            gols_sofridos.append(home_score)
    
    media_gf = statistics.mean(gols_marcados) if gols_marcados else 0
    media_ga = statistics.mean(gols_sofridos) if gols_sofridos else 0
    
    # Força = (média gols a favor - média gols contra) * peso + gols marcados * peso
    strength = (media_gf - media_ga) * 0.5 + (media_gf * 0.3)
    return max(0.5, strength)  # Mínimo 0.5


def predict_goals_poisson(home_team, away_team):
    """Estima gols esperados (xG) para ambos times"""
    HOME_ADVANTAGE = 0.3
    
    home_strength = calc_team_strength(home_team)
    away_strength = calc_team_strength(away_team)
    
    # Time da casa marca mais gols por vantagem
    xg_home = home_strength - (away_strength * 0.7) + HOME_ADVANTAGE
    xg_away = away_strength - (home_strength * 0.7)
    
    return max(0.5, xg_home), max(0.5, xg_away)


def match_probabilities(xg_home, xg_away):
    """Calcula P(Vitória Home), P(Empate), P(Vitória Away) usando Poisson"""
    
    home_win = 0
    draws = 0
    
    # Matriz de possibilidades (até 10 gols por time)
    for h in range(0, 10):
        for a in range(0, 10):
            prob = poisson.pmf(h, xg_home) * poisson.pmf(a, xg_away)
            
            if h > a:
                home_win += prob
            elif h == a:
                draws += prob
    
    away_win = 1 - home_win - draws
    
    return {
        "home_win": round(home_win * 100, 1),
        "draw": round(draws * 100, 1),
        "away_win": round(away_win * 100, 1),
        "xg_home": round(xg_home, 2),
        "xg_away": round(xg_away, 2)
    }


def predict_match(home_team, away_team):
    """Endpoint principal: retorna previsão completa"""
    xg_home, xg_away = predict_goals_poisson(home_team, away_team)
    probs = match_probabilities(xg_home, xg_away)
    
    return {
        "home_team": home_team,
        "away_team": away_team,
        **probs
    }