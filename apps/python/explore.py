import duckdb
import json

con = duckdb.connect()

con.execute("""
    CREATE TABLE players AS 
    SELECT * FROM read_csv_auto('data/raw/players_data.csv')
""")

insights = {}

insights["top_scorers"] = con.execute("""
    SELECT Player, Squad, Comp, Gls, Ast, CrdY, CrdR,
           ROUND(Gls / NULLIF("90s", 0), 2) AS gols_por_90min
    FROM players
    WHERE Gls > 0 AND "90s" >= 5
    ORDER BY Gls DESC
    LIMIT 20
""").fetchall()

insights["most_dangerous"] = con.execute("""
    SELECT Player, Squad, Comp, Pos, Gls, Ast, (Gls + Ast) AS contribuicoes
    FROM players
    WHERE (Gls + Ast) > 0 AND "90s" >= 5
    ORDER BY contribuicoes DESC
    LIMIT 20
""").fetchall()

insights["team_risk"] = con.execute("""
    SELECT 
        Squad,
        Comp,
        SUM(CrdY) AS total_amarelos,
        SUM(CrdR) AS total_vermelhos,
        ROUND(SUM(CrdY) / COUNT(*), 2) AS media_amarelos_por_jogador
    FROM players
    WHERE CrdY IS NOT NULL
    GROUP BY Squad, Comp
    ORDER BY total_amarelos DESC
    LIMIT 20
""").fetchall()

insights["most_efficient"] = con.execute("""
    SELECT Player, Squad, Comp, Gls, Sh, SoT,
           ROUND(Gls / NULLIF(Sh, 0), 2) AS eficiencia_gol
    FROM players
    WHERE Sh >= 20 AND Gls > 0
    ORDER BY eficiencia_gol DESC
    LIMIT 15
""").fetchall()

insights["league_stats"] = con.execute("""
    SELECT 
        Comp,
        ROUND(AVG(Gls), 2) AS media_gols,
        ROUND(AVG(CrdY), 2) AS media_amarelos,
        ROUND(AVG(Ast), 2) AS media_assistencias
    FROM players
    WHERE "90s" >= 5
    GROUP BY Comp
    ORDER BY media_gols DESC
""").fetchall()

for key, value in insights.items():
    print(f"\n=== {key.upper()} ===")
    for row in value:
        print(row)

output = {k: [list(row) for row in v] for k, v in insights.items()}
with open("data/processed/insights.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2, default=str)

print("\n✓ insights.json salvo em data/processed/")