import duckdb
import json

def get_top_scorers(limit=10):
    con = duckdb.connect()
    con.execute("CREATE TABLE players AS SELECT * FROM read_csv_auto('data/raw/players_data.csv')")
    return con.execute(f"""
        SELECT Player, Squad, Comp, Pos, Gls, Ast, CrdY, CrdR,
               ROUND(Gls / NULLIF("90s", 0), 2) AS gols_por_90
        FROM players
        WHERE Gls > 0 AND "90s" >= 5
        ORDER BY Gls DESC
        LIMIT {limit}
    """).fetchall()

def get_team_stats(team_name):
    con = duckdb.connect()
    con.execute("CREATE TABLE players AS SELECT * FROM read_csv_auto('data/raw/players_data.csv')")
    return con.execute(f"""
        SELECT Player, Pos, Gls, Ast, CrdY, CrdR, Min,
               ROUND(Gls / NULLIF("90s", 0), 2) AS gols_por_90
        FROM players
        WHERE Squad = '{team_name}'
        ORDER BY Gls DESC
    """).fetchall()

def get_team_risk(team_name):
    con = duckdb.connect()
    con.execute("CREATE TABLE players AS SELECT * FROM read_csv_auto('data/raw/players_data.csv')")
    return con.execute(f"""
        SELECT 
            SUM(CrdY) AS amarelos,
            SUM(CrdR) AS vermelhos,
            ROUND(SUM(CrdY) / COUNT(*), 2) AS media_amarelos
        FROM players
        WHERE Squad = '{team_name}'
    """).fetchone()

def get_player_profile(player_name):
    con = duckdb.connect()
    con.execute("CREATE TABLE players AS SELECT * FROM read_csv_auto('data/raw/players_data.csv')")
    return con.execute(f"""
        SELECT Player, Squad, Comp, Pos, Age, Gls, Ast, 
               CrdY, CrdR, Min, Sh, SoT,
               ROUND(Gls / NULLIF("90s", 0), 2) AS gols_por_90
        FROM players
        WHERE Player = '{player_name}'
        LIMIT 1
    """).fetchone()