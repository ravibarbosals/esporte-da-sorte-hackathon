import duckdb
import os

DATA_PATH = "data/statsbomb/data"

def get_connection():
    con = duckdb.connect()
    return con

def get_match_xg(match_id: str):
    """xG por time numa partida específica"""
    con = get_connection()
    path = f"{DATA_PATH}/events/{match_id}.json"
    
    if not os.path.exists(path):
        return None

    return con.execute(f"""
        SELECT 
            team.name as time,
            ROUND(SUM(shot.statsbomb_xg), 3) as xg_total,
            COUNT(*) as total_chutes,
            SUM(CASE WHEN shot.outcome.name = 'Goal' THEN 1 ELSE 0 END) as gols
        FROM read_json_auto('{path}')
        WHERE type.name = 'Shot'
        GROUP BY team.name
    """).fetchall()

def get_team_xg_history(competition_id: str, team_name: str, limit: int = 10):
    """Histórico de xG do time nas últimas partidas"""
    con = get_connection()
    matches_path = f"{DATA_PATH}/matches/{competition_id}/*.json"

    matches = con.execute(f"""
        SELECT 
            match_id,
            match_date,
            home_team.home_team_name as home_team,
            away_team.away_team_name as away_team,
            home_score,
            away_score
        FROM read_json_auto('{matches_path}')
        WHERE home_team.home_team_name = '{team_name}'
           OR away_team.away_team_name = '{team_name}'
        ORDER BY match_date DESC
        LIMIT {limit}
    """).fetchall()

    results = []
    for match in matches:
        match_id = match[0]
        event_path = f"{DATA_PATH}/events/{match_id}.json"
        if not os.path.exists(event_path):
            continue

        xg_data = con.execute(f"""
            SELECT 
                team.name as time,
                ROUND(SUM(shot.statsbomb_xg), 3) as xg
            FROM read_json_auto('{event_path}')
            WHERE type.name = 'Shot'
            GROUP BY team.name
        """).fetchall()

        xg_map = {r[0]: r[1] for r in xg_data}
        team_xg = xg_map.get(team_name, 0)

        results.append({
            "match_id": match_id,
            "date": str(match[1]),
            "home": match[2],
            "away": match[3],
            "home_score": match[4],
            "away_score": match[5],
            "xg": team_xg
        })

    return results

def get_team_shot_profile(competition_id: str, team_name: str):
    """Perfil de chutes do time — posição, tipo, eficiência"""
    con = get_connection()
    events_path = f"{DATA_PATH}/events/*.json"

    return con.execute(f"""
        SELECT 
            shot.type.name as tipo_chute,
            shot.body_part.name as parte_corpo,
            COUNT(*) as total,
            ROUND(AVG(shot.statsbomb_xg), 4) as xg_medio,
            SUM(CASE WHEN shot.outcome.name = 'Goal' THEN 1 ELSE 0 END) as gols,
            ROUND(
                SUM(CASE WHEN shot.outcome.name = 'Goal' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
                1
            ) as taxa_conversao
        FROM read_json_auto('{events_path}')
        WHERE type.name = 'Shot'
          AND team.name = '{team_name}'
        GROUP BY shot.type.name, shot.body_part.name
        ORDER BY total DESC
    """).fetchall()

def get_h2h_xg(competition_id: str, team_a: str, team_b: str):
    """H2H com xG entre dois times"""
    con = get_connection()
    matches_path = f"{DATA_PATH}/matches/{competition_id}/*.json"

    matches = con.execute(f"""
        SELECT match_id, match_date, home_team.home_team_name, away_team.away_team_name, home_score, away_score
        FROM read_json_auto('{matches_path}')
        WHERE (home_team.home_team_name = '{team_a}' AND away_team.away_team_name = '{team_b}')
           OR (home_team.home_team_name = '{team_b}' AND away_team.away_team_name = '{team_a}')
        ORDER BY match_date DESC
        LIMIT 5
    """).fetchall()

    results = []
    for match in matches:
        match_id = match[0]
        event_path = f"{DATA_PATH}/events/{match_id}.json"
        if not os.path.exists(event_path):
            continue

        xg_data = con.execute(f"""
            SELECT team.name, ROUND(SUM(shot.statsbomb_xg), 3)
            FROM read_json_auto('{event_path}')
            WHERE type.name = 'Shot'
            GROUP BY team.name
        """).fetchall()

        xg_map = {r[0]: r[1] for r in xg_data}

        results.append({
            "match_id": match_id,
            "date": str(match[1]),
            "home": match[2],
            "away": match[3],
            "home_score": match[4],
            "away_score": match[5],
            "xg_home": xg_map.get(match[2], 0),
            "xg_away": xg_map.get(match[3], 0),
        })

    return results