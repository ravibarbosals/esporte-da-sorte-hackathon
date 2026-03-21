import duckdb
import requests

BASE_URL = "https://raw.githubusercontent.com/statsbomb/open-data/master/data"

def download_matches(competition_id, season_id):
    url = f"{BASE_URL}/matches/{competition_id}/{season_id}.json"
    response = requests.get(url)
    with open(f"data/raw/matches_{competition_id}_{season_id}.json", "w") as f:
        f.write(response.text)
    return response.json()

def get_match_results(competition_id, season_id):
    con = duckdb.connect()
    con.execute(f"""
        CREATE TABLE matches AS 
        SELECT * FROM read_json_auto('data/raw/matches_{competition_id}_{season_id}.json')
    """)
    return con.execute("""
        SELECT 
            match_id,
            match_date,
            home_team.home_team_name AS home_team,
            away_team.away_team_name AS away_team,
            home_score,
            away_score
        FROM matches
        ORDER BY match_date DESC
    """).fetchall()

def get_team_form(competition_id, season_id, team_name):
    con = duckdb.connect()
    con.execute(f"""
        CREATE TABLE matches AS 
        SELECT * FROM read_json_auto('data/raw/matches_{competition_id}_{season_id}.json')
    """)
    return con.execute(f"""
        SELECT 
            match_date,
            home_team.home_team_name AS home,
            away_team.away_team_name AS away,
            home_score,
            away_score,
            CASE
                WHEN home_team.home_team_name = '{team_name}' AND home_score > away_score THEN 'V'
                WHEN away_team.away_team_name = '{team_name}' AND away_score > home_score THEN 'V'
                WHEN home_score = away_score THEN 'E'
                ELSE 'D'
            END AS resultado
        FROM matches
        WHERE home_team.home_team_name = '{team_name}'
           OR away_team.away_team_name = '{team_name}'
        ORDER BY match_date DESC
        LIMIT 5
    """).fetchall()