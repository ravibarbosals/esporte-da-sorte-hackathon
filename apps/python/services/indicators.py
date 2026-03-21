import duckdb
import statistics
from datetime import datetime, timedelta

def inconsistency_index(team, n_games=10):
    """
    Índice de Inconsistência: quanto os resultados variam?
    > 0.8 = muito inconsistente (impredível)
    < 0.3 = consistente (previsível)
    """
    con = duckdb.connect()
    con.execute("""
        CREATE TABLE matches AS 
        SELECT * FROM read_json_auto('data/raw/matches_laliga.json')
    """)
    
    recent = con.execute(f"""
        SELECT 
            home_score, away_score,
            home_team.home_team_name as home_team,
            away_team.away_team_name as away_team
        FROM matches
        WHERE home_team.home_team_name = '{team}' 
           OR away_team.away_team_name = '{team}'
        ORDER BY match_date DESC
        LIMIT {n_games}
    """).fetchall()
    
    if not recent or len(recent) < 2:
        return 0.5
    
    gols = []
    for match in recent:
        if match[2] == team:  # home
            gols.append(match[0])
        else:  # away
            gols.append(match[1])
    
    media = statistics.mean(gols)
    desvio = statistics.stdev(gols) if len(gols) > 1 else 0
    
    if media == 0:
        return 0
    
    return round(desvio / media, 2)


def fatigue_factor(team, days_window=14):
    """
    Fator de Fadiga: quantos jogos em 14 dias?
    > 4 = cansado
    2-3 = normal
    """
    con = duckdb.connect()
    con.execute("""
        CREATE TABLE matches AS 
        SELECT * FROM read_json_auto('data/raw/matches_laliga.json')
    """)
    
    # Aqui você precisaria de data real, mas com dados estáticos:
    # Assumindo que podemos contar os últimos 5 jogos
    recent = con.execute(f"""
        SELECT COUNT(*) as match_count
        FROM (
            SELECT home_team.home_team_name as team FROM matches
            WHERE home_team.home_team_name = '{team}'
            ORDER BY match_date DESC
            LIMIT 10
        )
    """).fetchone()
    
    # Simplificado: retorna quantos jogos em 10 últimos
    return recent[0] if recent else 2


def reaction_index(team):
    """
    Poder de Reação: qual % de vitórias após derrota?
    0.7 = 70% de chance de vencer após perder (time resiliente)
    0.3 = 30% (time desmoralizável)
    """
    con = duckdb.connect()
    con.execute("""
        CREATE TABLE matches AS 
        SELECT * FROM read_json_auto('data/raw/matches_laliga.json')
    """)
    
    recent = con.execute(f"""
        SELECT 
            home_score, away_score,
            home_team.home_team_name as home_team,
            away_team.away_team_name as away_team
        FROM matches
        WHERE home_team.home_team_name = '{team}' 
           OR away_team.away_team_name = '{team}'
        ORDER BY match_date DESC
        LIMIT 20
    """).fetchall()
    
    if not recent or len(recent) < 2:
        return 0.5
    
    reactions = []
    
    for i in range(len(recent) - 1):
        curr_match = recent[i]
        next_match = recent[i + 1]
        
        # Verificar se perdeu na rodada atual
        if curr_match[2] == team:  # home
            lost = curr_match[0] < curr_match[1]
            next_won = next_match[0] > next_match[1]
        else:  # away
            lost = curr_match[1] < curr_match[0]
            next_won = next_match[1] > next_match[0]
        
        if lost:
            reactions.append(1 if next_won else 0)
    
    if not reactions:
        return 0.5
    
    return round(statistics.mean(reactions), 2)


def offensive_vs_defensive_power(team):
    """
    Compara desempenho ofensivo vs defensivo recente
    offensive_efficiency > 1 = time marcando mais do que esperado
    defensive_efficiency > 1 = não está tomando gol demais (defesa boa)
    """
    con = duckdb.connect()
    con.execute("""
        CREATE TABLE matches AS 
        SELECT * FROM read_json_auto('data/raw/matches_laliga.json')
    """)
    
    recent = con.execute(f"""
        SELECT 
            home_score, away_score,
            home_team.home_team_name as home_team,
            away_team.away_team_name as away_team
        FROM matches
        WHERE home_team.home_team_name = '{team}' 
           OR away_team.away_team_name = '{team}'
        ORDER BY match_date DESC
        LIMIT 8
    """).fetchall()
    
    gols_marcados = []
    gols_sofridos = []
    
    for match in recent:
        if match[2] == team:  # home
            gols_marcados.append(match[0])
            gols_sofridos.append(match[1])
        else:  # away
            gols_marcados.append(match[1])
            gols_sofridos.append(match[0])
    
    actual_for = statistics.mean(gols_marcados) if gols_marcados else 0
    actual_against = statistics.mean(gols_sofridos) if gols_sofridos else 0
    
    # Simplificado: assumindo xG esperado é 60% dos gols reais
    xg_for = actual_for * 0.6
    xg_against = actual_against * 0.6
    
    offensive_eff = actual_for / max(0.1, xg_for)
    defensive_eff = xg_against / max(0.1, actual_against)
    
    return {
        "offensive_efficiency": round(offensive_eff, 2),
        "defensive_efficiency": round(defensive_eff, 2),
        "avg_goals_for": round(actual_for, 2),
        "avg_goals_against": round(actual_against, 2)
    }


def h2h_advantage(team_a, team_b, n_games=5):
    """
    Histórico head-to-head: como se comportam um contra o outro?
    """
    con = duckdb.connect()
    con.execute("""
        CREATE TABLE matches AS 
        SELECT * FROM read_json_auto('data/raw/matches_laliga.json')
    """)
    
    encounters = con.execute(f"""
        SELECT 
            home_score, away_score,
            home_team.home_team_name as home_team,
            away_team.away_team_name as away_team,
            match_date
        FROM matches
        WHERE (home_team.home_team_name = '{team_a}' AND away_team.away_team_name = '{team_b}')
           OR (home_team.home_team_name = '{team_b}' AND away_team.away_team_name = '{team_a}')
        ORDER BY match_date DESC
        LIMIT {n_games}
    """).fetchall()
    
    if not encounters:
        return {
            "team_a_win_rate": 0.5,
            "team_b_win_rate": 0.5,
            "avg_total_goals": 2.5,
            "h2h_history": []
        }
    
    team_a_wins = 0
    team_b_wins = 0
    total_goals = []
    
    for match in encounters:
        home_score, away_score = match[0], match[1]
        home_team, away_team = match[2], match[3]
        total_goals.append(home_score + away_score)
        
        if home_team == team_a:
            if home_score > away_score:
                team_a_wins += 1
            elif away_score > home_score:
                team_b_wins += 1
        else:
            if away_score > home_score:
                team_a_wins += 1
            elif home_score > away_score:
                team_b_wins += 1
    
    total_matches = len(encounters)
    
    return {
        "team_a_win_rate": round(team_a_wins / total_matches, 2),
        "team_b_win_rate": round(team_b_wins / total_matches, 2),
        "avg_total_goals": round(statistics.mean(total_goals), 2),
        "total_encounters": total_matches
    }


def get_all_indicators(home_team, away_team):
    """
    Retorna todos os indicadores criativos para uma partida
    """
    return {
        "home": {
            "team": home_team,
            "inconsistency": inconsistency_index(home_team),
            "fatigue": fatigue_factor(home_team),
            "reaction_index": reaction_index(home_team),
            **offensive_vs_defensive_power(home_team)
        },
        "away": {
            "team": away_team,
            "inconsistency": inconsistency_index(away_team),
            "fatigue": fatigue_factor(away_team),
            "reaction_index": reaction_index(away_team),
            **offensive_vs_defensive_power(away_team)
        },
        "h2h": h2h_advantage(home_team, away_team)
    }